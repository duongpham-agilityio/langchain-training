# Migration spike result and decision (M-07)

All three mandatory spikes (intent: `docs/intents/migration.md`) are done. Nothing blocks the migration. Evidence lives in the per-spike docs; this page is the decision and what it changes. Ticket numbers follow `docs/tickets/migration-draft.md` (M-15 preview stream, M-20 Slack tool, M-22 checkpointer, M-24 titles).

| Spike | Question | Result | Decision |
| --- | --- | --- | --- |
| A (M-04) | UI gets tool-call data, card grows while built | Works | Route B: custom `AbstractAgent` forwarding tool chunks and `TOOL_CALL_RESULT`. Fallback: route A (frontend tool, no nullish schema fields) |
| B (M-05) | Agent confirmation shows in UI, Approve/Reject resume, Reject stops the action | Works with frontend tool + `useHumanInTheLoop` | Path A. `humanInTheLoopMiddleware` is blocked with the current bridge, so it is not used |
| C (M-06) | Client thread id keys the conversation, no duplicated history, title without blocking | Works, with a fallback for history | Trim history to messages after the last assistant message; fire-and-forget title |

Details: [A](ticket-7-tool-call-streaming.md), [B](m-05-hitl-confirmation.md), [C](spike-c-threads.md).

## A. Stream tool-call data to the UI: works
- Card grew from 0 to full content while the call streamed (`inProgress` then `complete`). The card-only-on-completion fallback is not needed.
- Today `streamTextChunks` in `agui/index.ts` hides tool calls; that filter is the only blocker.
- Route A (stock bridge, frontend tool) works but runs the tool in the browser and the bridge rejects `.nullish()`/`.nullable()` schema fields (`Invalid JSON schema`); the real `ReleaseNotesDraftSchema` uses them. Kept as fallback only.
- Route B keeps the server tool and full zod schema. Cost: replace `LangChainAgent` by a small custom `AbstractAgent`, with its own AG-UI to LangChain history conversion and `threadId`/`runId` pass-through.

## B. Confirmation in the UI: works (path A), middleware path is a fallback only
- `useHumanInTheLoop` renders Approve/Reject; the answer arrives as a tool message on a new run; Reject runs nothing. No duplicated calls or cards across turns.
- The side effect must run in deterministic server code gated on an approved tool result, never on the model's choice. A system-prompt rule must make the model ask first.
- Tool-call ids arrive with an `-idx-N` suffix; match ids from history.
- `humanInTheLoopMiddleware` / `interrupt` fails through `@ag-ui/langchain@0.0.4` (no resume, no interrupt outcome). Fallback if ever wanted: custom `AbstractAgent` mapping `__interrupt__` to an interrupt outcome and `input.resume` to `Command`. Since M-15 already builds a custom agent, this becomes a smaller step later; it is not needed now.

## C. Thread ids and titles: works, history needs the trim fallback
- The client id reaches `chainFn` as `threadId`; passed as `configurable.thread_id` it keys the conversation and survives a fresh agent instance.
- Naive pass-through of the AG-UI history duplicates messages (6 instead of 4). Fallback (the dedupe rule): pass only messages after the last assistant message.
- Title: promise started after the stream ends and never awaited; `RUN_FINISHED` is not delayed; failures do not fail the run. Web polls every 1.5 s for 15 s.

## Changes per ticket
- **M-15 (stream preview card):** build the custom AG-UI agent (route B). Map `tool_call_chunks` to `TOOL_CALL_START/ARGS`, `ToolMessage` to `TOOL_CALL_END` + `TOOL_CALL_RESULT`; handle all chunk indexes, not only `[0]`. It must also carry `threadId`/`runId`, apply the history trim and convert history (tool calls with results) itself, so M-20 and M-22 build on it. Web: `useRenderTool`; the `inProgress` branch renders partial parameters, `safeParse` only on `complete`, no `setDraft` before args are valid.
- **M-20 (Slack tool with confirmation):** use path A. Register `useHumanInTheLoop` (agent id `releaseCopilotAgent`); the stream must pass frontend-tool calls through (match by name against `tools`), and history must keep the answered call. The Slack send is a server step reachable only after an approved result; add the "always confirm before publish" prompt rule. An "edit before approve" flow would be a JSON result `{decision, edits}`; there is no built-in edit.
- **M-22 (Postgres checkpointer):** `PostgresSaver` replaces `MemorySaver`; `threadId` from `chainFn` is `configurable.thread_id`; apply the history trim. Re-run the thread checks (same id after restart/reload, isolation, no duplicates) against Postgres.
- **M-24 (titles):** use the fire-and-forget title step after the first turn; the condition is "no row for this thread" so a failed first try can retry; skip when a guard blocked the turn. Write order must make the title visible to the web poll.

## Unknowns
Marked with the decision that covers them if they fail.

| Unknown | Status | If it fails |
| --- | --- | --- |
| Real `ChatOpenAI` chunk shape and streaming (spikes used scripted models) | Works expected: the fake mirrored OpenAI `tool_call_chunks`; check in M-15 | Streaming needs `handleLLMNewToken`; stock `ChatOpenAI` does it |
| Model reliably calls the confirm tool first and honours Reject | Fallback in place: side effect gated in server code | Tighten prompt; the gate keeps Reject safe regardless |
| Parallel tool calls | Fallback: disable parallel tool calls on the model | Handle all indexes in the M-15 agent |
| `PostgresSaver` behaviour | Works expected (same `BaseCheckpointSaver` contract); verify in M-22 | Keep `MemorySaver` for dev, fix saver setup |
| CopilotKit `InMemoryAgentRunner` replay on reload | Fallback: the checkpointer wins; stop using the runner for conversation state (M-22) | Trim history from the checkpoint |
| Pending confirmation across reload/abort, middleware (summarization) with `streamMode: "messages"` | Fallback: treat an unanswered confirmation as rejected on the next run; summarization is checked in M-25 | Reject on timeout/reload |

## Throwaway code
Deleted in this change: `apps/ai/src/spikes/`, `apps/web/src/spikes/`, `apps/web/hitl-spike.html`, `apps/web/spike-tool-stream.html` and the `spike:hitl` script. Nothing in `src/index.ts` or the web entry imported them. Recover with `git show <commit>:<path>` from PRs #40 (thread ids, `e74d300`), #41 (tool-call streaming, `25bc78b`) and #42 (confirmation, `b8ba8c8`). The run commands in the three spike docs no longer work. Keep to move into real folders at the start of M-15/M-20/M-22/M-24: `trimToNewMessages`, the title helper, the forwarding route.
