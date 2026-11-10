# Ticket 34: [M-31] Error and recovery UI against the new server

## What it asks
Check the web client's error surfaces (`ToolErrorCard`, chat send-failure, runtime-connection, error boundaries) against real server errors (401, 5xx, server down, guard block, tool failure) and fix gaps. Type: chore / hardening.
Done when: "each failure shows its message and a retry or recovery action; none leaves the UI stuck."

## What's ambiguous
- "guard block": the server answers a blocked prompt injection as a normal assistant text reply (`GUARD_REPLIES`, run finishes cleanly), not an error. Read as "must show a message", it already does.
- "tool failure": today `ToolErrorCard` only covers unusable tool-call data, and tells the user to ask again without offering an action.
- "retry or recovery action" for 401: retrying with the same token cannot work; recovery is signing in again.

## First step
Audit each failure against the current code (done below), then fix: classify chat errors (401 / 5xx / network / other), offer "Sign in again" for 401, add a retry action to `ToolErrorCard`, and show the 401 case in the connection dialog.

Audit findings:
- Send failure (`use-chat-send-failure.ts`): every error gets "Message failed to send" + Retry. On 401 (body `{"error":"Unauthorized"}`) Retry can never succeed.
- Connection dialog: server down shows message + Reload (ok). 401 on `/info` shows "Can't reach the server", which is wrong.
- `ToolErrorCard`: message only, no action.
- Error boundaries, `RouteErrorPage`: have Try again / Reload / Back to dashboard (ok).
- Guard block: plain reply (ok). History/Slack HTTP errors: surfaced by `HttpClient` messages (out of scope here).

## Clarifying questions
No ambiguity: defaults above are safe and reversible, and the ticket's acceptance is clear enough to build and check.
