# Ticket 7: [M-04] Spike A: stream tool-call data to the UI, including the preview card while it is built

## What it asks
Spike (throwaway code allowed): find out how the UI can receive tool-call start, argument deltas and result so the `renderReleaseNotesPreview` card fills in progressively. Try the frontend-tool route and the stream-forwarding route.
Done when: "UI shows a card that grows while the tool call streams, or the blocker and fallback (card appears only when the call completes) are written down with evidence."

## What's ambiguous
- "Throwaway agent": no real LLM key is guaranteed. Default: use a deterministic fake streaming model that emits OpenAI-shaped `tool_call_chunks`.
- "Depends on M-01" (agent id / port alignment): the spike runs on its own port and agent ids, so it does not need M-01 merged.

## First step
Read how `@ag-ui/langchain` converts LangChain chunks to AG-UI tool events and how CopilotKit v2 renders in-progress tool calls.

## Clarifying questions
No ambiguity: scope and acceptance are explicit; defaults above are enough to proceed.
