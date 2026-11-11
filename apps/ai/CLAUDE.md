# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`@training/ai` — Node 22 ESM agent server. Hono app serving a LangChain agent to the web client through the CopilotKit runtime (AG-UI protocol).

## Commands

```bash
pnpm --filter @training/ai dev         # tsx watch, loads .env and ../web/.env if present
pnpm --filter @training/ai build       # tsup src/index.ts --format esm --target node22 --clean -> dist/index.js
pnpm --filter @training/ai start       # node dist/index.js
pnpm --filter @training/ai typecheck   # tsc --noEmit
```

Root shortcut: `pnpm dev:ai`. No test runner, no lint script in this app (root `pnpm lint` only covers apps that define one).


## Architecture

- `src/index.ts` — `CopilotRuntime` with one agent `releaseCopilotAgent` and `InMemoryAgentRunner` (event replay only; conversation state is the Postgres checkpointer); Hono mounts `createCopilotEndpoint` at `/api/copilotkit`, plus `GET /health`, which runs `select 1` on the shared pg pool and returns `{ ok, db: { reachable } }` (200, or 503 when the database is unreachable).
- `src/agent/` — `createBaseAgent(options?)` = `createAgent` + `ChatOpenAI`, `tools`; optional `middleware`, `checkpointer`, `systemPrompt` (default `SYSTEM_PROMPT`: static string from `constants/prompts.ts`, ported as-is from the old app; no time block, so the provider prompt cache stays valid; ends with a `RELEASE_FLOW` section: count-only summary, destination question, one `renderReleaseNotesPreview` call) via `CreateBaseAgentOptions`. Exports `BaseAgent` type.
- `src/agui/` — `ReleaseNotesAguiAgent` (custom `AbstractAgent`, replaces `@ag-ui/langchain` `LangChainAgent`, whose `chainFn` cannot emit tool results). Runs `agent.stream(..., {streamMode: "messages"})` with the AG-UI `threadId` as `configurable.thread_id`. Text streams token by token. Server tool calls stream as AG-UI `TOOL_CALL_START/ARGS/END` and then `TOOL_CALL_RESULT` when the tool returns; the web gates rendering on completion, so the preview never renders partially. `toLangChainMessages` converts AG-UI history (user/assistant+toolCalls/tool).
- `src/db/` — `createCheckpointer(pool)` (`PostgresSaver` on the shared pool, keyed by the AG-UI `threadId`; `setup()` runs at every start, idempotent; on failure logs and falls back to `MemorySaver`), `createPgPool()` (lazy `pg.Pool` from `DATABASE_URL`, 3 s connection timeout, `error` listener so idle-client errors do not crash the process; reusable by the checkpointer), `createSupabaseAdminClient()` (service-role key, no session persistence), `checkDatabase(pool)` for `/health`.
- `src/middlewares/auth.ts` — `createRequireAuth(supabase)` Hono middleware mounted on `/api/*`: reads `Authorization: Bearer <token>`, verifies with `supabase.auth.getUser`, sets `c.get("userId")` (type `AuthEnv`); missing/invalid token gets 401 `{ error: "Unauthorized" }`, `OPTIONS` passes. `/health` is outside `/api` and stays public.
- `src/routes/slack.ts` — `createSlackRoute()`: `POST /slack/publish` (body `SlackPublishRequestSchema`: `platformId`, `label`, `content` max 35 000), behind `createRequireAuth` mounted on `SLACK_PATH_PATTERN` (`/slack/*`). Posts to `config.slackWebhookUrl` via `utils/post-to-slack-webhook.ts` (`postToSlackWebhook`: JSON `{ text: "*<label>*\n<content>" }`, 10 s `AbortSignal.timeout`, throws `SlackWebhookError`). Returns `{ ok: true }`; errors are `{ error }` with 400 invalid body, 500 missing webhook URL, 502 Slack rejected / network failure, 504 timeout. Messages live in `SLACK_ERROR_MESSAGES` (same wording as web).
- `src/routes/threads.ts` — `createThreadsRoute(pool)`: `GET /api/memory/threads` (covered by the `/api/*` guard) returns `{ threads: ThreadSummary[] }` for `c.get("userId")` from the `threads` table (`db/threads.ts`, the only place that knows its columns), newest `updated_at` first. `resourceId` is the owner id. Rows are written by the title step (M-24), not here.
- `src/tools/` — `renderReleaseNotesPreview`: takes the web draft shape (`ReleaseNotesDraftSchema`), returns JSON `{ ...draft, releaseDate, heading }` with date (default today in the browser zone via `formatReleaseDate`, which defaults `timeZone` to `getUserTimeZone()`; falls back to `DEFAULT_TIME_ZONE` `America/New_York`) and title filled in.
- Slack publish from chat: `publishReleaseNotesToSlack` is guarded by LangChain `humanInTheLoopMiddleware` (approve/reject) in `createBaseAgent`, which needs the checkpointer wired in `index.ts`. `ReleaseNotesAguiAgent` streams `messages` + `updates`; a `__interrupt__` update ends the run with `RUN_FINISHED { outcome: { type: "interrupt" } }`, and a later run with `input.resume` becomes `new Command({ resume: { decisions } })` (`resolved` + `{decision: "approve"}` approves, anything else rejects). With saved state, a normal turn sends only the user messages after the last assistant message (`trimToNewMessages`). The web answers through `useInterrupt` (`hooks/use-slack-publish-approval.tsx`).
- Model fallback: `middlewares/model-fallback.ts` wraps prebuilt `modelFallbackMiddleware` with a `ChatOpenAI` on `config.fallbackModel` (`AI_FALLBACK_MODEL`, default `DEFAULT_FALLBACK_MODEL`); first in the `createBaseAgent` middleware list. Primary is `config.model` (`AI_MODEL`).
- Prompt-injection guard: `createPromptInjectionGuard(model)` (`utils/prompt-injection-guard.ts`) runs in `ReleaseNotesAguiAgent.run` **before** the graph, for the latest human message (not on resume). A small classifier model (`config.guardModel`, `AI_GUARD_MODEL`, default `DEFAULT_GUARD_MODEL`) returns a structured verdict (`PromptInjectionVerdictSchema`: `safe` | `injection`). `injection` streams `PROMPT_INJECTION_REFUSAL` as a normal AG-UI text message and ends the run; the graph and checkpointer are never touched, so the blocked user message and refusal are not stored. It is not agent middleware on purpose: a `beforeAgent` + `jumpTo: "end"` block was checkpointed (input, step 0 and step 1 all held the message and the refusal). **Fail-closed**: a classifier error replies `PROMPT_INJECTION_CHECK_FAILED`, also unsaved. If a thread has no saved state, `dropGuardedTurns` strips earlier guarded turns from the client history so they are not stored on resend.
- PII redaction (M-28): `middlewares/pii.ts` `createPiiMiddleware()` = prebuilt `piiMiddleware` for `email` (built-in) and `phone` (custom `detectPhone` in `utils/pii.ts`, patterns in `constants/pii.ts`), strategy `redact`, input only. It rewrites the user message in agent state, so the model and the checkpointer both see `[REDACTED_EMAIL]` / `[REDACTED_PHONE]`. URLs and IPs are not redacted (normal in commit text). Registered in `createBaseAgent` after `skillsMiddleware`.
- `src/skills/` — on-demand skills (`commit-pr-parsing`, `classification-rules`, `platform-formatting`, `release-reporting`) as TS modules + `SKILLS` registry. `middlewares/skills.ts` appends a short catalog to the system message each turn and registers the `load_skill` tool; full rules load only when the model calls it. Add a skill = new module + entry in `SKILLS`.

## Cross-app wiring

Web builds the runtime URL from `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (`/api/copilotkit`). Server default is `http://localhost:4000/api/copilotkit`; keep `AI_PORT` and `VITE_API_SERVER_URL` in step. The web asks for agent id `releaseCopilotAgent`. Every web request sends the browser IANA zone in `X-Time-Zone` (`TIME_ZONE_HEADER`, allowed in CORS); `userContextMiddleware` validates it with `resolveTimeZone` (invalid or missing = `DEFAULT_TIME_ZONE`).

## Code style and structure

Follow existing patterns; the folder layout is the convention.

- Path alias `@/*` → `src/*` (tsconfig `paths`). Import across folders with `@/...`, relative only for siblings inside one folder. Imports are ESM, double-quoted strings, semicolons, trailing commas, 2-space indent.
- One concern per folder, each with an `index.ts` barrel (`export * from "./x"`): `constants/`, `schemas/`, `tools/`, `utils/` (pure helpers such as `joinLines`, `formatReleaseDate`). Import from the barrel (`@/constants`), not deep files.
- Adding a tool = 3 pieces, wired together:
  1. name in `constants/tools.ts` → `TOOL_NAMES` (`as const`),
  2. zod schema in `schemas/<tool>.ts` (zod v4),
  3. `tool(...)` in `tools/<tool>.ts` using both, then append to the `tools` array in `tools/index.ts`.
- No magic values inline: model names, prompts, ports, paths go in `constants/`. Env access only in `config.ts`, exported as a single `as const` object.
- Arrow functions + `export const` for everything; `function*` only where a generator requires it (comment says why). Factory functions (`createBaseAgent`, `createAguiAgent`) over module-level singletons.
- Import blocks in `agent/` and `tools/` are grouped under short comment headers (`// Configs`, `// Constants`, `// Tools`, `// Schemas`).
- Comment the *why* (e.g. why tool calls are dropped), as in `agui/index.ts`; doc-comment non-obvious bridges with `/** */`.
- Stay on `createAgent` + prebuilt middleware; no custom LangGraph graphs. LLM does classify/write/interpret; render/validate/save/send stay deterministic code.
- Thread titles (M-24): after a turn that streamed a reply (and did not end in an interrupt), `ReleaseNotesAguiAgent` calls the optional `ThreadTitleScheduler` after `RUN_FINISHED`. `createThreadTitleScheduler` (`utils/schedule-thread-title.ts`) runs detached and never rejects: if `public.threads` has no row for the thread, it asks the model for a title from the first user message and inserts `(id, owner_id, title)` (`db/threads.ts`, first writer wins). A guard-blocked turn streams no reply, so it gets no row. The owner id reaches the agent through `userContext` (AsyncLocalStorage `{ userId, timeZone }`, set by `userContextMiddleware` after `createRequireAuth`, which is mounted on `/api/*`, `/release-history*` and `/slack/*`). The `public.threads` table comes from the M-23 migration (`20261110000000_create_threads.sql`); this branch carries no copy.
- Answer-quality checks (M-30): after a completed turn (reply streamed, no interrupt; guard-blocked turns are skipped) `ReleaseNotesAguiAgent` calls the optional `AnswerEvaluationScheduler` after `RUN_FINISHED`. `createAnswerEvaluationScheduler(client)` (`utils/schedule-answer-evaluation.ts`) runs the pure checks in `src/evaluators/` (`count-summary-format`, `draft-structure`, `grounded-items`; each `(turn) => { key, score, comment } | null`) detached and posts each score with `client.createFeedback` on the run. Non-blocking rule: never awaited, never rejects; a low score or a throwing evaluator is only logged server-side. No `LANGSMITH_API_KEY` = no client = no-op. The agent run gets a generated `runId` in its config so the feedback has a run to attach to; full tracing tags stay with M-29. Keys and thresholds live in `constants/evaluators.ts`.
- Tracing (M-29): `configureTracing(config.langsmith)` (`utils/configure-tracing.ts`, called once in `index.ts`) sets `LANGSMITH_TRACING` from the key: key set = on (project from `LANGSMITH_PROJECT`), empty = off even if the shell exports `LANGSMITH_TRACING=true`. Each agent run (`agui/index.ts`) is named `release-notes-turn`, tagged `release-copilot`, and carries `thread_id` and `user_id` (from `userContext`) as metadata; model and tool calls nest under it automatically. Names live in `constants/tracing.ts`.
- Phase 2 config: `config.resendApiKey` (`RESEND_API_KEY`, optional, empty = unset) and `config.emailFrom` (`EMAIL_FROM`, default `DEFAULT_EMAIL_FROM`); scheduler settings (`SCHEDULER_*`) and `STORE_LIMITS` live in `constants/`. Deps `resend` and `@js-temporal/polyfill` are installed, not used yet.
