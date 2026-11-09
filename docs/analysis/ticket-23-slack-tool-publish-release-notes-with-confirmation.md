# Ticket 23: [M-20] Slack tool `publishReleaseNotesToSlack` with confirmation

## What it asks
Feature. Add an agent tool so the user can say "send to Slack" in chat. The chat must ask the user to confirm before anything is sent, reusing the M-19 Slack webhook client (ticket 22), using the spike B result (`docs/spikes/m-05-hitl-confirmation.md`).
Done when: "chat asks for confirmation; Approve posts once; Reject posts nothing."

## What's ambiguous
- "Ask the user to confirm ... using the spike B result": the spike recommends path A (frontend tool `useHumanInTheLoop` + deterministic server step gated on the tool result). Two parts follow: a web part (register the confirmation tool) and a server part (publish tool, `agui` pass-through of frontend tool calls). The ticket does not say web is in scope; "Done when" is only satisfiable end to end if it is.
- Which content is published: ticket does not say. The web already has a "Send to Slack" suggestion ("Send the current release notes to Slack.") and a draft per platform (`platformId`, `label`, markdown). `SlackPublishRequest` is `{ platformId, label, content }`.
- Spike notes say the confirmation must be server-gated; the tool call ids carry an `-idx-N` suffix in `@ag-ui/langchain`, but this repo now uses its own `ReleaseNotesAguiAgent`, so spike gotchas about ids may not apply.

## First step
After ticket 22 lands on `feat/slack-publish-endpoint`, branch from it. Then read `apps/ai/src/agui/index.ts` and decide how a frontend (confirmation) tool call from the model gets through the custom AG-UI agent: it currently streams only server tool calls and does not forward `input.tools` to the model.

## Clarifying questions
1. Should the web app be changed in this ticket (register the `useHumanInTheLoop` confirmation card in `apps/web`), or only the server?
   Default assumption: yes, both; the Done-when needs a visible Approve/Reject card.
   Answer: _(pending)_
2. Should the tool publish one platform's draft chosen by the model (args `platformId`, `label`, `content`), matching `SlackPublishRequest`?
   Default assumption: yes, same three fields as `POST /slack/publish`, one call per platform.
   Answer: _(pending)_
3. After Reject, should the agent just reply that nothing was sent (no retry, no re-ask)?
   Default assumption: yes.
   Answer: _(pending)_
