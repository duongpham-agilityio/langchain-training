# Spike A (M-04): stream tool-call data to the UI

Result: **works, both routes.** The draft card grows while the tool call streams (0 -> 146 chars of `content` over ~2 s, status `inProgress` -> `complete`). No blocker. The "card only appears on completion" fallback is not needed.

Code (throwaway, isolated): `apps/ai/src/spikes/tool-stream/`, `apps/web/src/spikes/tool-stream/`, `apps/web/spike-tool-stream.html`.
Run: `pnpm --filter @training/ai exec tsx src/spikes/tool-stream/server.ts` (port 4010), `pnpm --filter release-copilot exec vite --port 5194`, open `http://localhost:5194/spike-tool-stream.html?route=frontend|forwarding`. `events.ts` prints the raw AG-UI events. A fake streaming model replaces the LLM (no key needed); it emits `tool_call_chunks` shaped like OpenAI's.

## Why it works
- `@ag-ui/langchain` already turns an `AIMessageChunk` stream with `tool_call_chunks` into `TOOL_CALL_START` / `TOOL_CALL_ARGS` (one per delta) / `TOOL_CALL_END`.
- CopilotKit v2 parses the partial JSON arguments on every delta (`partialJSONParse`) and calls the tool render with `status: "inProgress"` and the partial args. So the card only needs to render whatever fields exist so far.
- Today's `streamTextChunks` in `agui/index.ts` discards those chunks (`chunk.text` only). That filter is the only thing hiding tool calls.

## Route A: frontend tool (stock bridge)
Server: `new LangChainAgent({ model })` (no `chainFn`). Browser: `useFrontendTool({ name, parameters, handler, render })`.
- Event order: text, `TOOL_CALL_START`, ~27 `TOOL_CALL_ARGS` (+120 ms apart), `TOOL_CALL_END`, `RUN_FINISHED`. The browser runs `handler` and reruns the agent with the result; the model then answers ("Draft ready.").
- Evidence (DOM sampled every 300 ms): `inProgress` content length 0, 19, 39, 58, 86, 104, 135, then `complete` 146; title and version appear first.
- Limits: the tool executes in the browser, not on the server (render/validate/save stays client side). The bridge converts the client's JSON schema with its own converter that only knows object/string/number/boolean/array: **`.nullish()` / `.nullable()` fields make the run fail with `Invalid JSON schema`** (hit in the browser as an error toast, server log `Agent execution failed: Error: Invalid JSON schema`). The real `ReleaseNotesDraftSchema` uses `.nullish()` for `releaseDate`, `titleOverride`, `version`, `title`, so it cannot go through this route unchanged.

## Route B: stream forwarding (server tool) - recommended for M-15/M-20
Server: custom `AbstractAgent` (`forwarding-route.ts`) running `createAgent({ tools })` with `streamMode: "messages"`; it maps
- `AIMessageChunk.tool_call_chunks` -> `TOOL_CALL_START` / `TOOL_CALL_ARGS`,
- `ToolMessage` -> `TOOL_CALL_END` + **`TOOL_CALL_RESULT`**,
- text chunks -> `TEXT_MESSAGE_*`.
Browser: `useRenderTool({ name, parameters, agentId, render })` only (render, no handler).
- Same growth evidence as A: `inProgress` 0, 9, 39, 58, 86, 104, 135, then `complete` 146; the run continues server side and streams "Draft ready." after the result.
- A second user turn works: history now holds the server tool call with its result, so the client has nothing unanswered. This addresses the reason tool calls are dropped today ("history must not hold tool calls the client cannot answer"): the dropped part was the missing result, not the call.
- Server tool keeps the full zod schema (nullish ok); the browser schema in `useRenderTool` is only for typing/parsing.
- Cost: `@ag-ui/langchain`'s `chainFn` cannot return a tool *result* event (only message chunks), so the `LangChainAgent` wrapper has to be replaced by a small custom `AbstractAgent`. It also needs its own AG-UI -> LangChain history conversion (the spike does user/assistant/tool only; the bridge's multimodal handling is lost) and `threadId`/`runId` pass-through (needed by M-06/M-22).

## Gotchas found
1. A chat model only streams inside `createAgent` if its `_streamResponseChunks` calls `runManager.handleLLMNewToken` (real `ChatOpenAI` does). Without it, `streamMode: "messages"` delivers one aggregated chunk at the end and the card would jump instead of grow.
2. The bridge reads only `tool_call_chunks[0]`: parallel tool calls in one model turn are not forwarded correctly by route A. Route B in the spike also reads `[0]`; handle all indexes if parallel calls are enabled.
3. Tool-call ids must be unique per call (a repeated id made the second card not render in a first fake-model run). Real providers generate unique ids.
4. `useRenderTool` also renders `Executing`/`Complete`; existing `use-release-draft.tsx` currently shows only a spinner card while `inProgress` and ignores `props.parameters`. Progressive fill needs that branch to render partial parameters (M-20), and must not call `setDraft` before the args are complete/valid.

## Effect on later tickets
- M-15 (agent/AG-UI bridge): replace `streamTextChunks` filter with route B (custom AG-UI agent forwarding tool chunks and `TOOL_CALL_RESULT`). Not verified here: real `ChatOpenAI` chunks, parallel tool calls, middleware (summarization/HITL) interplay with `streamMode: "messages"`, `threadId` keying.
- M-20 (preview card): `inProgress` branch renders partial `props.parameters`; keep `safeParse` only for `complete`.
- Fallback if B proves fragile: route A with a schema without nullish fields (bridge limit).
