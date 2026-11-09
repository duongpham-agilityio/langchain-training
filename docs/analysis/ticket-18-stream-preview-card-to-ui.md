# Ticket 18: [M-15] Stream the preview card to the UI

## What it asks
Apply spike A (route B, `docs/spikes/ticket-7-tool-call-streaming.md`) in `apps/ai/src/agui/`: tool call data reaches the client, draft card and Live Preview render, `draft-slice` updates per thread. Done when: pasting a log fills the draft card and Live Preview; Markdown export works as before.

## Constraint (from the user)
Transport still streams (AG-UI events keep flowing), but the UI must NOT render the preview progressively from partial data. Draft card and Live Preview render only once the tool call is complete (result available). This overrides the spike's progressive-fill idea (M-20 partial render).

## Dependencies
M-07 (spike recorded) and M-14 (tool) are merged into `practices`.

## Decisions
- Custom `AbstractAgent` replaces `LangChainAgent` (it cannot emit `TOOL_CALL_RESULT`).
- Server forwards text and tool-call chunks as they arrive, plus `TOOL_CALL_RESULT` on the tool's `ToolMessage`.
- Web: render tool returns nothing unless `status === 'complete'`; existing `safeParse` + `setDraft(threadId, ...)` path stays.

## Not verified
Real `ChatOpenAI` chunks, parallel tool calls with different indexes (handled by index map), middleware interplay (summarization/HITL), checkpointer history.
