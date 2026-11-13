# Bug: an old thread opens empty after the AI server restarts, although the model still remembers it
Status: REPRODUCED (runner level; real app blocked, see Setup notes)

## Environment
- Branch / commit: fix/history-after-restart @ b8612f5 (github/practices)
- Versions: node v22.22.2, pnpm 10.33.0, `@copilotkit/runtime` 1.84.1, macOS (darwin 23.6.0)
- Source: GitHub issue #122 ([GF-16] Chat history is still there after a server restart)

## Setup
1. `git fetch github`, branch reset to `github/practices` (b8612f5).
2. `pnpm install --frozen-lockfile`.
3. Scratch script `docs/bug-reports/ticket-122-history-after-restart.repro.ts` (copied into `apps/ai`, run with `tsx`). It builds the real `createBaseAgent` with a `MemorySaver` standing in for the Postgres checkpointer, writes a thread with a tool call and its result, then asks a fresh runner (a process that served no run yet) for `connect()` like the web does when a thread is opened.
Setup notes: the real app could not be started in this session. The worktree has no `.env`, `.env*` reading is denied, and the shell has none of `OPENAI_API_KEY`, `SUPABASE_*`, `DATABASE_URL`. So the live restart steps below are written from the issue and code, and were NOT run (marked "not observed").

## Steps to reproduce
1. Create a thread with a draft (user message, `renderReleaseNotesPreview` tool call, tool result, assistant text). The checkpoint (Postgres) now holds 4 messages. Observed in the script: `checkpoint messages: 4`.
2. Use a runner that has not run this thread (what a restarted `apps/ai` has: `new InMemoryAgentRunner()`, which is the runner in `apps/ai/src/index.ts`).
3. Call `runner.connect({ threadId, ownerId })` as the thread owner.
4. Not observed (needs the real app): `pnpm dev:ai`, send a draft request, stop and restart `pnpm dev:ai`, reload the page on the thread.

Reproduced: always (2 of 2 runs).

## Expected
`connect()` replays the thread: a `MESSAGES_SNAPSHOT` with the user message, the assistant tool call, the tool result and the assistant text, so messages and draft cards come back.

## Actual
`connect as owner: events=0`. The stream completes with no event. The web shows an empty thread, while `agent.getState` still returns all 4 messages.

## Evidence
```
checkpoint messages: 4
runner: InMemoryAgentRunner
connect as owner: events=0 types=-
connect as other user: events=0 types=-
```

## Suspected area
Failing step: 3
Files:
```ts
// apps/ai/src/index.ts:78
runner: new InMemoryAgentRunner(),
// @copilotkit/runtime dist/v2/runtime/runner/in-memory.mjs:582-589
connect(request) { const found = sharedStore.peek(request.threadId); ... if (!store) { connectionSubject.complete(); ... } }
```
Why: the runner keeps replay events only in process memory; after a restart the store has no thread, so `connect()` completes empty. The conversation itself is in the checkpointer and is never read by `connect()`. This is a suspicion, not a proven root cause.

## Questions for the reporter
- Should a thread waiting on a Slack approval show its pending approval after a restart? Assumption: out of scope; only messages, tool calls and results come back.
- Spike (option b, a persistent runner): `IntelligenceAgentRunner` in this version needs a hosted CopilotKit Intelligence Phoenix websocket (`url`, `authToken`), not our Postgres. Assumption: option (a), a runner subclass that reads the checkpoint.
