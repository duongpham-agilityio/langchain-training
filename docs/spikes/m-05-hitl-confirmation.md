# M-05 Spike B: agent confirmation request in the UI

## Result

| Path | Result |
|---|---|
| A. Frontend tool + `useHumanInTheLoop` through `@ag-ui/langchain` `LangChainAgent` | **Works** (verified in a real browser with a scripted fake model) |
| B. `humanInTheLoopMiddleware` (`interrupt`) through the same bridge | **Blocked as the bridge stands today** (source analysis only, not built) |

Use path A for M-07 onward.

## Evidence (path A)

Spike code: `apps/ai/src/spikes/hitl/` (server, port 4100, no `config.ts`, no env), `apps/web/hitl-spike.html` + `apps/web/src/spikes/hitl/` (no auth). Run: `pnpm --filter @training/ai spike:hitl`, `pnpm --filter release-copilot dev`, open `http://localhost:5173/hitl-spike.html`.

Screenshots in `docs/spikes/screenshots/m-05/`:

1. `01-prompt-shown.jpg` - user sends a message, the confirmation card ("Confirm: Publish release notes to Slack" + Approve/Reject) renders inside `CopilotChat`.
2. `02-approve-resumed.jpg` - Approve: card shows `Answered: approved`, a new run starts automatically, agent replies "Done: ... was executed."; `GET /spike/actions` has exactly 1 entry.
3. `03-second-turn-prompt.jpg` - second turn in the same thread: a new card appears, the old one stays answered, nothing re-runs.
4. `04-reject-resumed-cancelled.jpg` - Reject: `Answered: rejected`, agent replies "Cancelled: ... was not executed."; `GET /spike/actions` still has 1 entry (the action did not run).

Approve then Reject in one thread: no duplicated tool calls, no repeated action execution, no repeated confirmation card.

## Mechanism

1. `useHumanInTheLoop({ name, parameters, render })` (from `@copilotkit/react-core/v2`, present in 1.84.1) registers a frontend tool without a handler. CopilotKit sends it in `RunAgentInput.tools`.
2. `@ag-ui/langchain` converts `input.tools` to `DynamicStructuredTool[]` and passes them as `chainFn({ messages, tools, threadId, ... })`. The chain must emit a tool call named like the frontend tool.
3. The bridge turns a streamed `AIMessageChunk` (`tool_call_chunks`) into `TOOL_CALL_START/ARGS/END`. CopilotKit renders `render` with `status: Executing` and a `respond(result)` callback.
4. `respond("approved" | "rejected")` appends a tool message to the thread history and CopilotKit starts a **new run** automatically (a plain follow-up run, not a resume of a paused one). The bridge converts the history back to LangChain messages: `AIMessage` with `tool_calls` + `ToolMessage`. The server sees `ToolMessage` as the last message and decides.
5. The decision lives in the server: on `approved` run the side effect, on `rejected` do not. The UI cannot execute the action itself.

## Gotchas

- **Tool call ids get a suffix.** For streamed chunks the bridge rewrites the id to `${id}-idx-${index}` (e.g. `call_...-idx-0`). The `ToolMessage.tool_call_id` and the `AIMessage.tool_calls[].id` in history carry that suffix, so match on the ids in the history, never on the id the model produced.
- **Tool calls must be emitted by `chainFn`.** Today `apps/ai/src/agui/index.ts` yields only text chunks and drops tool calls. To use path A for real, the stream must let the confirmation tool call through (and only that one, as server tool calls would stay unanswerable). Needs a filter: pass through chunks whose tool name is a registered frontend tool (`tools` param), drop the rest.
- **The bridge handles only `tool_call_chunks[0]` of each chunk** and a single streamed tool call per model response reliably; parallel tool calls in one response are untested.
- **Result type is a free value.** `respond(x)` content arrives as a string on the server (may be JSON-encoded if an object is sent). Normalise it (the spike strips quotes). Prefer a small fixed vocabulary or a JSON object with a zod parse.
- **The server must re-check the decision on the resumed run.** With a real LLM the model will see the tool result and decide the next step itself; to make "reject prevents the action" deterministic, the side-effect must run in deterministic code gated on the tool result (like the spike), not by trusting the model to call the real tool only after approval. A server-side tool that is only reachable after an approved `ToolMessage` is the safe shape.
- **Re-asking is the model's job.** The scripted model asks again on every new user turn. A real LLM needs a system prompt rule ("call `confirmAction` before any publish; never publish without an approved result").
- Browser: the first Return key press sends; the card is rendered inside the chat via the tool-call renderer (virtualized list: see `use-is-latest-tool-call.ts` for re-mount caveats in the existing app).

## Path B: `humanInTheLoopMiddleware` / `interrupt` (analysis only)

`langchain@1.6.2` `humanInTheLoopMiddleware` raises a LangGraph `interrupt()` (in `afterModel` for `batched`, in `wrapToolCall` for `per_call`) and expects the caller to resume with `new Command({ resume: { decisions: [...] } })` on the same `thread_id` with a checkpointer.

Why it cannot work through `@ag-ui/langchain@0.0.4` as is:

- `LangChainAgent.run` never passes a `Command`/`resume` and never forwards `thread_id` into `configurable`; `chainFn` only receives `messages/tools/state/context/threadId/runId/headers`, so the chain would have to read `threadId` and build the config itself.
- Everything the bridge emits goes through `RUN_STARTED ... RUN_FINISHED` with no `outcome`. It never emits `RUN_FINISHED { outcome: { type: "interrupt" } }` nor the legacy `on_interrupt` custom event, which are what `useInterrupt` (react-core v2) listens for. A LangGraph interrupt surfaces in the stream only as an `__interrupt__` update (`streamMode: "updates"`), not in `"messages"` mode that `src/agui` uses, so it would be silently lost and the run would look finished.
- Resume is not carried: AG-UI core 1.0.2 and react-core 1.84 do have the standard interrupt/`resume` types (`RunFinishedInterruptOutcome`, `ResumeEntry`), but `@ag-ui/langchain` does not read `input.resume`/`forwardedProps` to build a `Command`.
- Also needs a checkpointer (the repo has `@langchain/langgraph-checkpoint-postgres` and `createPgPool`, so feasible) and a conflict with the current "server tool calls are dropped on purpose" design.

Possible but out of scope: a custom `AbstractAgent` (not `LangChainAgent`) that streams with `streamMode: ["messages","updates"]`, emits `RUN_FINISHED` with an interrupt outcome when `__interrupt__` appears, and on the next run maps `input.resume` to `new Command({ resume })`. This is real work plus protocol risk; path A needs none of it.

## Fallback

Path A is the fallback and recommended route. If the middleware route is ever wanted, build the custom agent above.

## Impact on tickets

- **M-07 (and this spike's consumers):** use frontend tool + `useHumanInTheLoop`; the pattern is proven end to end.
- **M-15:** if M-15 relies on middleware `interrupt` to gate an action, change it to the frontend-tool pattern: model emits `confirmAction`, UI answers, a deterministic server step runs the action only on `approved`. Do not use `humanInTheLoopMiddleware` with the current bridge.
- **M-20:** the `src/agui` stream filter must start passing through the frontend-tool calls (match by name against `tools`), and the history must keep the answered tool call (it is what carries "approved/rejected" back). Server-side tool calls stay dropped.
- **M-22:** needs the confirmation tool registered in the web (`useHumanInTheLoop` with `agentId` `releaseCopilotAgent`) and a system-prompt rule to always ask first; the side effect (Slack publish) must be in deterministic server code gated on the tool result, so Reject cannot publish.
- **M-24:** state that per-call decisions are plain tool results (string/JSON), so an "edit before approve" flow would be a JSON result `{decision, edits}` handled by the server step; there is no built-in `edit` decision as in the middleware.

## Not verified

- Real LLM behaviour (no `.env` access): whether the model reliably calls `confirmAction` first, honours Reject in its reply, and tolerates the `-idx-0` id suffix and tool history on later turns.
- Parallel tool calls, multiple pending confirmations, page reload / thread restore with a pending (unanswered) confirmation, abort mid-confirmation, the real app's auth headers and `useIsLatestToolCall` interplay.
- Path B was analysed from source only; nothing was built or run.
- Production build of the spike page (it is served by the Vite dev server only; not an input of `pnpm build`).
