# Plan: Spike B: agent confirmation request shows in the UI

## Goal
Show that an agent confirmation request renders in the web UI, that Approve and Reject both resume the run, and that Reject prevents the action. Write the result (or blocker and fallback) to `docs/spikes/m-05-hitl-confirmation.md` for M-07.

## Assumptions
- (unconfirmed) Frontend-tool route (`useHumanInTheLoop`) is primary; middleware `interrupt` route is analysed from source, not built.
- (unconfirmed) Agent replies with short text after Reject.
- (unconfirmed) A scripted fake chat model proves the transport/UI path. Real LLM run is not verified (no `.env` access).
- Spike code is isolated and throwaway: `apps/ai/src/spikes/hitl/` (own entry, does not import `config.ts`) and `apps/web/src/spikes/hitl/` + `apps/web/hitl-spike.html` (no auth gate). Not wired into the real app.

## Steps
1. Code (server): scripted spike agent + AG-UI bridge that forwards frontend tool calls from `ChainFnParams.tools`; on tool result "approved" run a throwaway server action (recorded in memory, `GET /spike/actions`), on "rejected" do not.
   Files: `apps/ai/src/spikes/hitl/*`, `apps/ai/package.json` (script `spike:hitl`) - Change: new files, separate port.
2. Code (web): spike page mounting `CopilotKit` + `CopilotChat` with a `useHumanInTheLoop` tool rendering Approve/Reject.
   Files: `apps/web/hitl-spike.html`, `apps/web/src/spikes/hitl/*` - Change: new files.
3. Verify in browser: prompt shows; Approve resumes and action recorded; Reject resumes and action NOT recorded. Screenshots saved.
   Files: `docs/spikes/screenshots/m-05/*`
4. Write findings, blocker/fallbacks, impact on M-15/M-20/M-22/M-24.
   Files: `docs/spikes/m-05-hitl-confirmation.md`

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0
- Both paths shown working in the browser with evidence
- Findings doc written

## Deviations
- Fake model is a hand-made `AIMessageChunk` stream inside `chainFn` (not a LangChain `FakeToolCallingModel`): the spike only needs the transport/UI path. No new dependency added.
- Spike server added `DELETE /spike/actions` (reset helper) besides `GET /spike/actions`.
- Screenshots are `.jpg` (copied from the Browser pane output).
- Reject was verified as the second turn after Approve in the same thread (covers the "twice in one thread" check) rather than as a separate fresh-thread run.
- `apps/web/hitl-spike.html` is served by the Vite dev server only; it is not added to the Vite build inputs.
