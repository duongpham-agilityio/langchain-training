# Plan: [M-19] Slack publish endpoint and webhook client

## Goal
`apps/ai` serves `POST /slack/publish` (body `{ platformId, label, content }`) behind auth and posts to the Slack webhook from `config.slackWebhookUrl`. A failing webhook returns a non-2xx JSON `{ error }` that the web `HttpClient` surfaces to the UI.

## Assumptions
- Unconfirmed: Slack text is `*<label>*` line then `content`.
- Unconfirmed: statuses are 400 invalid body, 500 missing webhook URL, 502 Slack rejected, 504 timeout; body `{ error }`.
- Unconfirmed: auth middleware also mounted on `/slack/*`.
- Old `post-to-slack-webhook` source is not in the repo; the client is rewritten from the web's `SLACK_ERROR_MESSAGES` and 10 s timeout.
- No test runner exists in `apps/ai` (CLAUDE.md); checks are typecheck, build and a manual run against a local fake webhook.

## Steps
1. Constants: Files: `apps/ai/src/constants/slack.ts` (new), `constants/server.ts`, `constants/index.ts` - Change: add `SLACK_PUBLISH_PATH`, `SLACK_PATH_PATTERN`, `SLACK_WEBHOOK_TIMEOUT_MS` (10 000), `SLACK_MAX_CONTENT_LENGTH` (35 000), `SLACK_ERROR_MESSAGES` (same wording as web).
2. Schema: Files: `apps/ai/src/schemas/slack-publish.ts` (new), `schemas/index.ts` - Change: zod v4 `SlackPublishRequestSchema` (`platformId`, `label` min 1; `content` min 1, max 35 000).
3. Webhook client: Files: `apps/ai/src/utils/post-to-slack-webhook.ts` (new), `utils/index.ts` - Change: `postToSlackWebhook(url, {label, content})` POSTs `{ text }` JSON with `AbortSignal.timeout`; throws `SlackWebhookError` (status 502 on non-ok or network failure, 504 on timeout).
4. Route: Files: `apps/ai/src/routes/slack.ts` (new, barrel), `src/index.ts` - Change: `createSlackRoute()` validates body (400), reads `config.slackWebhookUrl` (500 if missing), calls client, returns `{ ok: true }`; map errors to `{ error }` + status. Mount in `index.ts` and apply `createRequireAuth` to `SLACK_PATH_PATTERN`.
5. Docs: Files: `apps/ai/CLAUDE.md` - Change: document the route and client.

## Done check
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0
- Manual: against a local fake webhook, valid POST returns 200 and the fake receives the text; webhook returning 500 gives 502 `{ error: "Slack rejected the message" }`; no token gives 401

## Deviations
- Step 4: also created `apps/ai/src/routes/index.ts` (barrel `export * from "./slack"`) so `src/index.ts` imports from `@/routes`, as the "each folder has an index.ts barrel" convention in apps/ai/CLAUDE.md requires. The plan named only `routes/slack.ts`.
