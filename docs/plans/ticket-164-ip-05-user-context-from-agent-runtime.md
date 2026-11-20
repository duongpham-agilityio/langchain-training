# Plan: [IP-05] User context from the agent runtime, not AsyncLocalStorage

## Goal
`AsyncLocalStorage` and `userContext` are gone from `apps/ai`. Each agent run gets an explicit runtime context `{ userId, timeZone, projectId? }`; tools and middlewares read it from the LangChain runtime; utils outside the agent take user id and time zone as parameters.

## Assumptions
- Unconfirmed: the user is resolved in `ReleaseNotesAguiAgent.run` from `this.headers` (`authorization`, `x-time-zone`, set per request by the CopilotKit runtime) with the existing Supabase check (`resolveUserFromAuthHeader`). No verified user = `RUN_ERROR` (THREAD_ACCESS_DENIED_MESSAGE path / "Unauthorized"), as today's thread gate refuses.
- Unconfirmed: `release-notes-preview` passes `context.timeZone` to `formatReleaseDate`.
- `projectId` is optional in the schema and never set until #166.
- `userContextMiddleware` is removed from `/api/*`, `/release-history*` and `/slack/*`; `createRequireAuth` stays. Routes already read `c.get("userId")`.
- Do not touch `apps/ai/src/db/threads.ts` or `packages/contracts` (another session, #165).
- No new tests; delete the four `userContext.run` tests (publish-changelog-page, show-changelog-answer, schedule-validation, schedule-graph) without rewriting.

## Steps
1. Code: runtime context type and schema.
   Files: new `apps/ai/src/agent/context.ts` (zod `contextSchema` `{ userId: string, timeZone: string, projectId?: string }`, `AgentContext` type, helper to read `runtime.context`), `apps/ai/src/agent/index.ts` (`contextSchema` in `createAgent`) - Change: add and wire.
2. Code: resolve the user per run and pass the context.
   Files: `apps/ai/src/agui/index.ts`, `apps/ai/src/middlewares/auth.ts`, `apps/ai/src/index.ts` - Change: `ReleaseNotesAguiAgent` gets an `identify` function (headers to user id, built on `resolveUserFromAuthHeader`), reads `this.headers`, time zone via `resolveTimeZone`; no user = refuse run; trace metadata uses it; `agent.stream(..., { context })` (also on resume); call `threads.canUse/claim/touch(userId, threadId)` and `scheduleTitle({ userId, ... })`; `clone()` keeps the new dependency; `index.ts` passes the identifier and drops `userContextMiddleware` mounts.
3. Code: utils take parameters.
   Files: `apps/ai/src/utils/thread-gate.ts` (userId arg on canUse/claim/touch), `schedule-thread-title.ts` (userId in turn), `release-title.ts` (timeZone required param, no default from context), `utils/index.ts` (drop export) - Change: no hidden reads.
4. Code: tools read the context from the runtime (second argument of `tool` callback).
   Files: `tools/user-memory.ts`, `show-changelog-answer.ts`, `edit-release-item.ts`, `publish-changelog-page.ts`, `get-changelog.ts`, `send-release-email.ts`, `schedule-release-send.ts`, `release-notes-preview.ts`, `publish-release-notes-to-slack.ts` - Change: replace `userContext.getStore()` / `getUserTimeZone()` with `runtime.context`.
5. Code: middlewares read the context.
   Files: `middlewares/user-template.ts` (`request.runtime.context`), `middlewares/schedule-validation.ts` (`runtime.context.timeZone`) - Change: same.
6. Cleanup: delete `utils/user-context.ts`, `middlewares/user-context.ts`, export lines in the barrels, and the four tests (`tools/publish-changelog-page.test.ts`, `tools/show-changelog-answer.test.ts`, `middlewares/schedule-validation.test.ts`, `middlewares/schedule-graph.test.ts`). Update `apps/ai/CLAUDE.md` mentions of `userContext` / `userContextMiddleware`.
7. Check: `grep -rn "userContext\|AsyncLocalStorage" apps/ai` is empty.

## Done check
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` all exit 0
- grep for `userContext` and `AsyncLocalStorage` in `apps/ai` finds nothing
- Manual proof (user, in the real preview, after the PR): two real test accounts, user B sees none of A's memory, History or threads; steps posted as a comment on #164

## Deviations
- Step 2: `AbstractAgent` in the installed `@ag-ui/client` types has no `headers` property (only `HttpAgent` does), so `ReleaseNotesAguiAgent` declares `headers: Record<string, string> = {}` itself; the CopilotKit runtime assigns it on the clone before `run`. Why: typecheck failed otherwise.
- Step 2: the identifier is `createIdentifyRunUser(supabase)` (headers -> user id or null) in `middlewares/auth.ts`, passed as the last argument of `createAguiAgent`/`ReleaseNotesAguiAgent`; the new constant `UNAUTHORIZED_MESSAGE` was added to `constants/threads.ts` (not named in the Steps) for the refusal text.
- Step 3: `formatReleaseDate` has `timeZone` required, so `now` before it keeps its default (`new Date()`); the preview tool passes both.
- Steps 4/5: the context helper is `readAgentContext(runtime)` (zod safe-parse); tools import it from `@/agent/context` (deep import, avoids a cycle with `@/agent` -> tools). Without a context, the schedule/date tools fall back to `DEFAULT_TIME_ZONE`.
