# Ticket 22: [M-19] Slack publish endpoint and webhook client

## What it asks
Feature (server). Port `post-to-slack-webhook` and `POST /slack/publish` into `apps/ai` with the request shape the web already sends (`platformId`, `label`, `content`). Webhook URL comes from `config.slackWebhookUrl` only.
Done when: publish from History posts to Slack; a failing webhook returns an error the UI shows through `network-error-message`.

## What's ambiguous
- "Port `post-to-slack-webhook`": the old source is not in this repo (only the web messages in `SLACK_ERROR_MESSAGES` and `SLACK_WEBHOOK_TIMEOUT_MS = 10_000` remain), so the Slack message layout is not stated.
- "a failing webhook returns an error the UI shows through `network-error-message`": the web `HttpClient` shows the JSON `error` string of any non-2xx response; `toNetworkErrorMessage` only covers fetch failures (timeout, abort, connect). Which status codes the server uses is not stated.
- "webhook URL from config only": config already has optional `slackWebhookUrl`; not stated whether a missing URL fails at startup or at request time.

## First step
Add the webhook client (`post-to-slack-webhook`) with timeout and typed error, then mount `POST /slack/publish` behind the existing `/api/*`-style auth.

## Clarifying questions
1. How should the Slack message look?
   Default assumption: a bold label line (`*<label>*`) followed by the `content` body, as one `text` payload. Correct?
   Answer: _(pending)_
2. Which status for failures?
   Default assumption: 400 invalid body, 500 missing webhook URL, 502 Slack rejected, 504 webhook timeout, all as `{ error: <message> }` using the existing `SLACK_ERROR_MESSAGES` wording. Correct?
   Answer: _(pending)_
3. Should the route sit behind auth although its path is `/slack/publish` (not under `/api`)?
   Default assumption: yes, mount the auth middleware on `/slack/*` too (M-08 says REST routes are protected). Correct?
   Answer: _(pending)_
