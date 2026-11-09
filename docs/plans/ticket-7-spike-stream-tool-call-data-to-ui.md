# Plan: Spike A - stream tool-call data to the UI

## Goal
Prove (or disprove, with evidence) that a card for `renderReleaseNotesPreview` can grow while the tool call streams, via the frontend-tool route and the stream-forwarding route. Record the result in `docs/spikes/`.

## Assumptions
- Fake streaming model instead of a real LLM (unconfirmed: no key needed, behaviour of real OpenAI chunks assumed identical in shape).
- Spike code is isolated under `apps/ai/src/spikes/tool-stream/` and `apps/web/src/spikes/tool-stream/`; not wired into `src/index.ts` or the app router.

## Steps
1. Code: fake model emitting `tool_call_chunks` in small deltas. Files: `apps/ai/src/spikes/tool-stream/fake-model.ts`
2. Code: route A (`LangChainAgent` with `model`) and route B (custom AG-UI agent forwarding chunks + result). Files: `frontend-tool-route.ts`, `forwarding-route.ts`, `server.ts`
3. Test: `events.ts` prints AG-UI events with timing per route.
4. Code: web spike page with a card rendering partial args (`useFrontendTool` for A, `useRenderTool` for B). Files: `apps/web/spike-tool-stream.html`, `apps/web/src/spikes/tool-stream/*`
5. Verify in browser, write findings to `docs/spikes/ticket-7-tool-call-streaming.md`.

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0 (no test runner exists)
- Card growth shown by timed DOM samples in the findings doc
