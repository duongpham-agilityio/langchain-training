# Plan: [M-20] Slack tool `publishReleaseNotesToSlack` with confirmation

## Goal
In chat, "send to Slack" makes the agent show an Approve/Reject card. Approve posts the release notes to Slack exactly once through the M-19 `postToSlackWebhook`; Reject posts nothing. Follows spike path A (`docs/spikes/m-05-hitl-confirmation.md`): frontend confirmation card, deterministic server step gated on the answer.

## Assumptions
- Stacked on ticket 22 (M-19, `feat/slack-publish-endpoint`): this plan needs `postToSlackWebhook`, `SlackWebhookError`, `config.slackWebhookUrl`, `SlackPublishRequestSchema`. Branch from `origin/feat/slack-publish-endpoint` once #22 pushes; PR base is that branch and must merge after it.
- Unconfirmed (Q1): web is in scope (Approve/Reject card in `apps/web`).
- Unconfirmed (Q2): tool args are `{ platformId, label, content }` (same as `SlackPublishRequest`); one call per platform.
- Unconfirmed (Q3): after Reject the agent replies that nothing was sent, no retry.
- Design choice: instead of forwarding CopilotKit `input.tools` to the model, the server declares a stub tool `confirmSlackPublish` (same schema, never executed). A middleware ends the run when the model calls it; the web registers the same name with `useHumanInTheLoop`, answers `"approved"`/`"rejected"`; the answer arrives as a `ToolMessage` in the next run's history. Keeps `agui` input handling unchanged.
- Gate lives in code, not the model: `publishReleaseNotesToSlack` posts only if the thread history holds an `approved` answer to a `confirmSlackPublish` call with identical args, newer than the last publish result (so one approval = one post). Reads state with LangGraph `getCurrentTaskInput()`; verify it works inside a `createAgent` tool, else use the tool `runtime` argument.
- `agui` currently never closes a tool call when the run ends without a `ToolMessage`; the stub call needs a `TOOL_CALL_END` at stream end.
- Repo has no test runner; tests are scratchpad `tsx` scripts (not committed), per ticket 19.
- Spike notes number this M-20 for the `agui` filter; code shows server tool calls already pass through, so no filter change is needed.

## Steps
1. Test: scratchpad `.mts` script, fails before steps 2-5. Cases: (a) gate returns "not approved" with no history, with `rejected`, with `approved` for different args; (b) approved + matching args posts once (fake `fetch`), a second call with the same history posts nothing; (c) `SYSTEM_PROMPT` contains the publish rule (call `confirmSlackPublish` before any publish, never publish on reject); (d) the end-run middleware jumps to end when the last AI message calls `confirmSlackPublish`, and not otherwise.
   Files: scratchpad only.
2. Code: names, schema, prompt.
   Files: `apps/ai/src/constants/tools.ts` - add `confirmSlackPublish` and `publishReleaseNotesToSlack` to `TOOL_NAMES`, plus description constants and confirmation answer values (`approved`, `rejected`); `apps/ai/src/constants/prompts.ts` - add a Slack section to `RELEASE_FLOW`: when asked to send to Slack, call `confirmSlackPublish` with the exact content, after `approved` call `publishReleaseNotesToSlack` once, on `rejected` reply that nothing was sent; `apps/ai/src/schemas/` - reuse `SlackPublishRequestSchema` (from #22) for both tools.
3. Code: gate helper.
   Files: `apps/ai/src/utils/` - pure `findApprovedPublish(messages, args)` implementing the history rule above, exported from the barrel.
4. Code: tools.
   Files: `apps/ai/src/tools/confirm-slack-publish.ts` - stub tool (returns an error text if ever run); `apps/ai/src/tools/publish-release-notes-to-slack.ts` - reads state, runs the gate, calls `postToSlackWebhook(config.slackWebhookUrl, args)`, returns a short result string; on missing approval or missing webhook URL or `SlackWebhookError` returns a text the model relays, never throws secrets; append both to `tools/index.ts`.
5. Code: end the run on the confirmation call.
   Files: `apps/ai/src/middlewares/` - new middleware with an `afterModel` hook, `canJumpTo: ["end"]`, jumping to end when the last AI message calls `confirmSlackPublish`; register in `agent/index.ts` next to `skillsMiddleware`. `apps/ai/src/agui/index.ts` - at stream end, emit `TOOL_CALL_END` for calls still in `openCalls`.
6. Code (web): confirmation card.
   Files: `apps/web/src/hooks/use-slack-publish-confirmation.tsx` - `useHumanInTheLoop` named `confirmSlackPublish`, `agentId` `RELEASE_COPILOT_AGENT_ID`, card with platform label, content preview, Approve/Reject buttons answering `approved`/`rejected`, answered state shown after; name constant in `apps/web/src/constants/agent-tools/tools-name.ts`; mount once next to `useReleaseDraft` (single call site, see its comment). Optionally render the `publishReleaseNotesToSlack` result via `useRenderTool` only if needed.
7. Docs: `apps/ai/CLAUDE.md` (tools, gate, middleware) and `apps/web/CLAUDE.md` if it lists hooks.

## Done check
- Step 1 script passes
- `pnpm --filter @training/ai typecheck` and `build` exit 0; `pnpm --filter release-copilot typecheck`, `lint` and `build` exit 0
- With a real model and a fake webhook (local listener): ask to send -> card appears; Approve -> exactly one POST; Reject -> zero POSTs; a second send request asks again
- UI: dev server preview, card renders, no console errors, screenshot taken
