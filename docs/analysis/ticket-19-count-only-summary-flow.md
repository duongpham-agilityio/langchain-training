# Ticket 19: [M-16] Count-only summary flow

## What it asks
Feature (server prompts/skills/tool wiring in `apps/ai`). A pasted git log or PR list is parsed and classified, the reply is a count-only summary, then the user names a destination and gets a draft as a preview card in that format.
Done when: paste a log, get counts per class, then ask for a destination and get a preview card in that format.

Extra constraint from the requester (not in the ticket): the preview card must NOT stream; it appears only after the model has finished generating the draft.

## What's ambiguous
- "Wire instructions, skills and preview tool": the pieces exist on `practices` (`SYSTEM_PROMPT`, four skills, `renderReleaseNotesPreview`) but nothing tells the model to chain them. `SYSTEM_PROMPT` only says "ask for a destination"; `release-reporting` says "present it for review" without naming the tool.
- Rule conflict: skill `platform-formatting` says "Title and date line, then sections", but the tool schema says `content` must never hold a title line (the app prepends it).
- "Depends on M-15": M-15 (#18, open, parallel branch) is what lets a server tool call reach the client; on `practices` `agui/streamTextChunks` still drops tool calls, so the card cannot render end to end until #18 merges.
- "Must not stream": M-15's spike route forwards tool-call argument deltas and CopilotKit renders `inProgress` with partial args. "Not stream" is read as: no draft content shows before the tool call is complete.
- "Count-only": whether skipped merges / Other entries may be mentioned; the skill says yes, with their number.

## First step
Add a flow section to `SYSTEM_PROMPT` that orders the steps (load skills, count-only reply, ask destination, one preview tool call with the full draft), then align the two skills and the tool description with it.

## Clarifying questions
1. Does "not stream" mean the card shows only once the tool call is complete (a placeholder while generating is fine, no partial content)?
   Default assumption: yes. The web `inProgress` branch keeps its content-less placeholder; partial-args fill (M-20 idea) is not built; M-15 should forward the tool call only when complete. Correct?
   Answer: Clarified by requester: transport still streams, but the UI renders nothing (not even a placeholder card) until the tool call is complete.
2. Should the model also print the draft text in chat after the card appears?
   Default assumption: no; the card is the only place the draft shows, chat gets one short line. Correct?
   Answer: _(pending)_
3. May the work land before M-15 (#18) is merged?
   Default assumption: yes; the PR notes that the end-to-end card check needs #18 and verifies the server flow on its own. Correct?
   Answer: _(pending)_
