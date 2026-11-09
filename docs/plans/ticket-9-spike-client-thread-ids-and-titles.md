# Plan: [M-06] Spike C: client-made thread ids and generated thread titles

## Goal
A headless, isolated spike shows whether the client's thread id keys a checkpointer conversation through the AG-UI bridge, whether a repeated run (reload) avoids duplicated messages when the client resends full history, and whether a title can be generated after the first turn without blocking the run. Result and fallbacks are written to `docs/spikes/spike-c-threads.md`.

## Assumptions
- Unconfirmed (Q1): no real `/api/memory/threads` route; the spike proves title generation, storage and a lookup shaped like that route's response (`{ threads: [{ id, title, resourceId, createdAt, updatedAt }] }`). The route itself is M-24.
- Unconfirmed (Q2): `MemorySaver` + deterministic fake chat model (`FakeStreamingChatModel` / `FakeListChatModel` from `@langchain/core/utils/testing`). Same `BaseCheckpointSaver` contract as `PostgresSaver`; Postgres is verified in M-22. No `.env`, OpenAI key or database is read.
- Unconfirmed (Q3): result doc is `docs/spikes/spike-c-threads.md`.
- Findings already read from `node_modules/@ag-ui/langchain@0.0.4`: `chainFn` receives `threadId`, `runId` and the whole message list converted from AG-UI (`HumanMessage`/`AIMessage` built WITHOUT the AG-UI message id). Passing that list to a checkpointed `createAgent` appends it to stored state, so history duplicates; to be confirmed by the spike.
- Throwaway code lives only under `apps/ai/src/spikes/thread-ids/`, imports nothing from `config.ts` (it requires env vars), and is not imported by `src/index.ts`. No new dependency; `@langchain/langgraph` already provides `MemorySaver`.
- No test runner exists (root `CLAUDE.md`); the "test" is a runnable `tsx` script that asserts and exits non-zero on failure.
- Repo conventions (`apps/ai/CLAUDE.md`) followed in spike code: `@/` alias, arrow functions, `function*` only where needed, constants not inline.

## Steps
1. Test: write `apps/ai/src/spikes/thread-ids/run.ts`, a script that drives `LangChainAgent` (from `@ag-ui/langchain`) via `run()` with a `RunAgentInput`, using a fake model and a `createAgent` with a `MemorySaver`. Scenarios, each printing PASS/FAIL and exiting 1 on any FAIL: (a) `threadId` seen in `chainFn` equals the id the client sent; (b) naive pass-through of full AG-UI history on run 2 with the same id yields duplicated messages in checkpoint state (documents the risk); (c) mitigation: pass only the messages after the last assistant message (or only the last user message) as input and `configurable.thread_id = threadId`; run 2 on a fresh agent instance sharing the checkpointer ("reload") shows exactly the expected messages and the model sees prior turns; (d) a different thread id stays isolated; (e) a title is generated after the first turn in a fire-and-forget promise: the `RUN_FINISHED` event arrives before the title resolves (use a title step with a deliberate delay), and a lookup shaped like the threads route returns it afterwards; a failing title generator does not fail the run.
   Files: `apps/ai/src/spikes/thread-ids/run.ts` - Change: new.
2. Code: spike helpers used by the script (checkpointed agent factory, history trimming function, title generator + in-memory title store, route-shaped lookup).
   Files: `apps/ai/src/spikes/thread-ids/agent.ts`, `titles.ts`, `history.ts` (new) - Change: minimal implementations that make step 1 pass; comments explain the why. Add script `"spike:threads": "tsx src/spikes/thread-ids/run.ts"` is NOT added to package.json; run with `pnpm --filter @training/ai exec tsx src/spikes/thread-ids/run.ts`.
3. Docs: write the spike result.
   Files: `docs/spikes/spike-c-threads.md` (new) - Change: per question works / needs fallback, evidence (script output), the dedupe rule, title approach (non-blocking, how the client reads it, 15 s poll window in `constants/threads.ts`), what it changes in M-20, M-22, M-24, caveat that CopilotKit `InMemoryAgentRunner` replay on reload and `PostgresSaver` were not exercised, and how to delete the spike folder.

## Done check
- `pnpm --filter @training/ai exec tsx src/spikes/thread-ids/run.ts` exits 0, all scenarios PASS
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0 (no `test` or `lint` script in this app)
- `grep -rn "process.env" apps/ai/src` still lists only `config.ts`
- `src/index.ts` does not import the spike folder

## Deviations
- Step 2: the fake model is a custom `RecordingModel` (extends `BaseChatModel`, has `bindTools` returning `this`) instead of `FakeListChatModel` / `FakeStreamingChatModel`. Why: `bindTools` on the stock fakes returns a new `FakeStreamingChatModel`, so call recording and scripted replies were lost and "model sees prior turns" could not be checked.
- Step 1 (b): the script reports PASS when duplication is observed (and prints the "no duplicates" property as FAIL). Why: the Done check requires exit 0 with all scenarios PASS, while the plan expects the naive pass-through to duplicate.
