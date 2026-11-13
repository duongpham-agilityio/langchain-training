# Bug: sidebar shows the raw thread UUID as the title of a new chat (GF-15 #121)
Status: REPRODUCED

Reproduced by rendering the real `ThreadListItem` (SSR), not in the running app (see Setup notes).

## Environment
- Branch / commit: `fix/thread-placeholder-title` @ b8612f5 (`github/practices`, includes #131)
- Versions: Node 22, React 19, tsx from `apps/ai`; OS: macOS (Darwin 23.6.0)
- Source: GitHub issue #121

## Setup
1. `pnpm install --frozen-lockfile`.
2. Copy `docs/bug-reports/ticket-121-thread-placeholder-title.repro.tsx` to `apps/web/repro.tmp.tsx`.
3. Add a throwaway `apps/web/tsconfig.repro.tmp.json` (`jsx: react-jsx`, `moduleResolution: bundler`, `allowImportingTsExtensions`, `baseUrl: .`, `paths: {"@/*": ["src/*"]}`).
4. From `apps/web`: `../ai/node_modules/.bin/tsx --tsconfig tsconfig.repro.tmp.json repro.tmp.tsx`. Delete both temp files afterwards.

Setup notes: the app could not be run live. The shell has no Supabase / OpenAI / `DATABASE_URL` variables and `.env*` is unreadable by rule, so the sign-in gate and the agent server cannot start. `.claude/launch.json` also only has the `dev` entry on :5173 with no AI server. The script therefore exercises the rendering path only; the behaviour of the hook is read from code.

## Steps to reproduce
1. Render `ThreadListItem` for a thread whose `title` equals its id (what `use-draft-thread-row` writes at the first message).
2. Render it for a server row whose `title` is `""` (what the thread gate creates before the title exists).
3. Render it for a row with a generated title (control).

Reproduced: always (deterministic render).

## Expected
Cases 1 and 2 show "New chat"; case 3 shows the title. A first turn that the guard blocks leaves no row in the sidebar once the polling window closes.

## Actual
```
client placeholder (use-draft-thread-row writes title = id)
  sidebar shows: "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b"
server row, title not generated yet (title = "")
  sidebar shows: "3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b"
server row, generated title
  sidebar shows: "Release notes for v1.2"
RESULT: BUG - raw thread UUID shown as title
```

## Evidence
Output above. Not observed in a live run: the blocked-turn placeholder staying in the sidebar (read from code only).

## Suspected area
Failing step: 1 and 2.
```ts
// apps/web/src/components/chat/ThreadListItem.tsx:49
{thread.title || thread.id}
// apps/web/src/hooks/use-draft-thread-row.ts:41
title: threadId,
```
Why: the component falls back to the id for an empty title, and the draft row is written with the id as its title. For the blocked turn, `draftThread` in `store/draft-thread-store.ts` is only ever replaced by a server row (`mergedThreads` in `use-thread-session.ts`); when no row appears, nothing clears it until a page reload. Comments in `constants/threads.ts`, `use-draft-thread-row.ts` and `use-thread-session.ts` still describe the Mastra server (`tripwire`, `generateTitle: false`). This is a suspicion, not a proven root cause.

## Questions for the reporter
- Should a placeholder still be dropped when the run fails with no RUN_FINISHED? Assumption: out of scope; only the RUN_FINISHED path is handled.
