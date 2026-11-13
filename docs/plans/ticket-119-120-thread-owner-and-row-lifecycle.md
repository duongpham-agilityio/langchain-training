# Plan: Threads belong to their owner and the server owns the thread row lifecycle (#119, #120)

## Goal
A thread is reachable only by its owner (runtime scoping plus a server-side owner check before the graph), the owner row is created at run start with an empty title, `updated_at` moves on every used turn, and the title step fills the title later.

## Assumptions
- Guard-blocked first turn creates no row: the owner check runs before the guard, the claim runs after it (unconfirmed, default of question 1).
- An interrupted turn that streamed a reply bumps `updated_at` (unconfirmed).
- Rows with an empty title are listed; the web shows the id until #121 (unconfirmed).
- No test runner exists in the repo; behaviour is proven by a repro script under the scratchpad against a real Postgres, not committed.
- `identifyUser` re-verifies the Bearer token with the same Supabase client as `createRequireAuth` (shared helper), and throws when it cannot resolve a user.

## Steps
1. Test: repro script (not committed) that, with two user ids, shows user B cannot claim or run user A's thread and `updated_at` moves after a touch.
   Files: scratchpad only - Change: script exercising `db/threads.ts` helpers and the gate.
2. Code: db helpers.
   Files: `apps/ai/src/db/threads.ts` - Change: add `getThreadOwner`, `claimThread` (insert empty title, on conflict do nothing, return owner), `touchThread(pool, ownerId, id)`, `setThreadTitle` (insert-or-fill only where `title = ''` and same owner), `hasTitledThread`; drop `createThread`/`hasThread`.
3. Code: thread gate and title step.
   Files: `apps/ai/src/utils/thread-gate.ts` (new), `apps/ai/src/utils/index.ts`, `apps/ai/src/utils/schedule-thread-title.ts` - Change: `createThreadGate(pool)` with `canUse`, `claim`, `touch` reading the owner from `userContext`; title scheduler skips when a titled row exists and otherwise fills the title.
4. Code: agent run and runtime wiring.
   Files: `apps/ai/src/agui/index.ts`, `apps/ai/src/middlewares/auth.ts`, `apps/ai/src/index.ts`, `apps/ai/CLAUDE.md` - Change: shared token helper; `identifyUser` on `CopilotRuntime`; in `run`, check owner before the guard (RUN_ERROR, no state read), claim after the guard passes (race: re-check owner), touch after a turn that produced a reply; keep the diff small (one new optional constructor argument).

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` all exit 0 (no test runner exists)
- Repro script: second user refused, first user unaffected, `updatedAt` moves

## Deviations
- Step 1: no real Postgres/Supabase was reachable (`.env*` unreadable), so the repro runs against an in-memory fake `Pool` that interprets the `db/threads.ts` queries by shape, plus a stub `BaseAgent`, instead of a real Postgres. The SQL itself (the `on conflict ... do update ... where title = ''` clause) is therefore not executed against Postgres.
- Step 2/4: added `THREAD_ACCESS_DENIED_MESSAGE` to `apps/ai/src/constants/threads.ts` (not named in the Steps) because CLAUDE.md forbids inline magic strings; the same wording covers "not yours" and "does not exist".
- Step 4: in `apps/ai/src/index.ts` the `export const supabaseAdmin = createSupabaseAdminClient()` line moved above `new CopilotRuntime(...)`, because `identifyUser` needs the client at construction.
