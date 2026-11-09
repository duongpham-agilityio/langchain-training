# Plan: [M-16] Count-only summary flow

## Goal
A pasted git log or PR list is parsed and classified with the on-demand skills, answered with a count-only summary, then, once the user names a destination, answered with one `renderReleaseNotesPreview` call carrying the full draft. The draft is never streamed as partial content.

## Assumptions
- Confirmed by requester: AG-UI transport keeps streaming unchanged (`agui/` untouched). The UI must not render anything progressively: no card, placeholder or partial content until the tool call is complete. Rendering is gated on completion in the web `useRenderTool` render.
- Unconfirmed (Q2): the draft is not repeated in chat; one short line after the card.
- Unconfirmed (Q3): lands before M-15 (#18). `agui/streamTextChunks` still drops tool calls on this base, so the card cannot render end to end here; verified at server level only.
- Code contradicts doc: `platform-formatting` asks for a title line, the tool schema forbids it. Skill is changed to match the schema.
- Repo has no test runner; the test step is a scratchpad script (not committed).

## Steps
1. Test: scratchpad `tsx` script asserting that `SYSTEM_PROMPT` contains the flow section (load skills, count-only reply, destination question, single tool call, no draft text in chat), that `release-reporting` names `renderReleaseNotesPreview`, that `platform-formatting` no longer asks for a title line, and that the tool description says "once" / "complete draft". Must fail before steps 2-4.
   Files: scratchpad only.
2. Code: flow section in the system prompt.
   Files: `apps/ai/src/constants/prompts.ts` - add `RELEASE_FLOW` and append it to `SYSTEM_PROMPT` after `LOOP`.
3. Code: align skills.
   Files: `apps/ai/src/skills/release-reporting.ts` - step 2 calls the tool, does not print the draft; `apps/ai/src/skills/platform-formatting.ts` - drop title line, content only.
4. Code: tool description.
   Files: `apps/ai/src/constants/release-notes.ts` - `RELEASE_NOTES_PREVIEW_DESCRIPTION`: call once, after counts and a named destination, with the complete body.
5. Code (web): gate the preview on completion.
   Files: `apps/web/src/hooks/use-release-draft.tsx` - the `inProgress` branch of `useRenderTool` returns `null` (no card, no spinner, no partial args); only the complete status parses and renders `DraftToolCall`. `pnpm --filter release-copilot build` must pass.
6. Docs: update `apps/ai/CLAUDE.md` (prompt mentions flow section).

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0 (no test runner or lint script in `apps/ai`)
- Step 1 script passes
- Live check with real model: paste log gives counts only, destination reply triggers the tool call (server side; card render needs #18)

## Deviations
- Step 1: the scratch script uses `.mts` (top-level await) and checks the title rule as "no 'Title and date line' and 'no title' present" because the new skill text itself says "no title or date line".
- Done check: `node_modules` was missing in the worktree, so `pnpm install --frozen-lockfile` was run before typecheck/build (no dependency added, lockfile unchanged).
