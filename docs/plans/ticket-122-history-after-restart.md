# Plan: Chat history survives a server restart (GF-16, #122)

## Goal
After `apps/ai` restarts, opening an existing thread replays its messages, tool calls and tool results from the Postgres checkpoint, so messages, draft cards and the Live Preview come back. The replay is owner-aware (#119).

## Assumptions
- Spike result: option (b) is not usable. `IntelligenceAgentRunner` (`@copilotkit/runtime` 1.84.1) needs a hosted CopilotKit Intelligence Phoenix websocket (`url`, `authToken`), not our Postgres. Option (a): a subclass of `InMemoryAgentRunner` whose `connect()` falls back to the checkpoint.
- Keep the in-memory replay when the thread is in memory (live streaming, same process). Only when it yields no event at all, read the checkpoint with `agent.getState`.
- Owner check: the `ownerId` the runtime passes to `connect()` (from `identifyUser`) must equal the `threads` row owner (`getThreadOwner`). No row, another owner, or no `ownerId` = empty stream, same as an unknown thread. No leak of existence.
- The replay is `RUN_STARTED`, one `MESSAGES_SNAPSHOT`, `RUN_FINISHED`. The snapshot has user messages, assistant messages with `toolCalls`, and `tool` messages with `toolCallId` and content, so the web's completed tool calls render the draft cards. System messages are skipped.
- A message without an id gets a stable id `<threadId>:<index>`.
- Not covered: a pending Slack approval (interrupt) is not replayed after a restart; the run is not resumed. Recorded in the PR.
- No test runner exists: the Test step is the scripted repro from the bug report, run before and after.
- Real-app check needs credentials that the session cannot read; if still blocked, the PR says so.

## Steps
1. Test: run `docs/bug-reports/ticket-122-history-after-restart.repro.ts` and see `events=0` before the fix; after the fix the owner gets `RUN_STARTED, MESSAGES_SNAPSHOT, RUN_FINISHED` with a tool call and a tool message, and another user gets 0 events.
   Files: repro script only - Change: none in the repo beyond the script.
2. Code: LangChain-to-AG-UI message conversion.
   Files: `apps/ai/src/agui/index.ts` - Change: add exported `toAguiMessages(messages, threadId)` next to `toLangChainMessages`.
3. Code: the runner.
   Files: `apps/ai/src/runner/checkpoint-agent-runner.ts`, `apps/ai/src/runner/index.ts` - Change: `CheckpointAgentRunner extends InMemoryAgentRunner`, `connect()` as in Assumptions; `createCheckpointAgentRunner(agent, pool)`.
4. Code: wire it.
   Files: `apps/ai/src/index.ts` - Change: build the base agent once, use it for the AG-UI agent and the runner; replace `new InMemoryAgentRunner()`.
5. Docs: `apps/ai/CLAUDE.md` architecture line for `index.ts` and the new `runner/` folder.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0
- The scripted repro shows the replay with tool calls for the owner, and nothing for another user
- Live restart check in the real app, or the PR states what blocked it
