# Plan: Ticket 34 error and recovery UI

Source: docs/analysis/ticket-34-error-and-recovery-ui-against-the-new-server.md

## Steps
1. Add `lib/chat-error.ts`: `ChatErrorKind` const enum (Unauthorized, Server, Network, Other) and `classifyChatError(error)` returning kind + title.
2. Use it in `use-chat-send-failure.ts`; add `kind` to `ChatSendFailure`; `useChatSendFailure` also exposes `signInAgain` (signOut).
3. `CopilotUserMessage`: for Unauthorized show "Sign in again" instead of Retry.
4. `use-runtime-connection.ts` + `ConnectionErrorDialog`: detect 401 (`runtimeInfoStatus`), show session-expired text and "Sign in again".
5. `ToolErrorCard`: add a "Try again" button that re-asks the agent.
6. Verify: `pnpm lint`, `pnpm build`, and preview simulation of server down / 401 if feasible.

## Out of scope
Server changes; History/Slack HTTP error UI.

## Unconfirmed assumptions
None pending.
