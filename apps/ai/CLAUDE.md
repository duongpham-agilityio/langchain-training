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

- `src/index.ts` — `CopilotRuntime` with one agent `releaseCopilotAgent` and `InMemoryAgentRunner`; Hono mounts `createCopilotEndpoint` at `/api/copilotkit`, plus `GET /health`, which runs `select 1` on the shared pg pool and returns `{ ok, db: { reachable } }` (200, or 503 when the database is unreachable).
- `src/agent/` — `createBaseAgent(options?)` = `createAgent` + `ChatOpenAI`, `tools`; optional `middleware`, `checkpointer`, `systemPrompt` (default `SYSTEM_PROMPT`: static string from `constants/prompts.ts`, ported as-is from the old app; no time block, so the provider prompt cache stays valid; ends with a `RELEASE_FLOW` section: count-only summary, destination question, one `renderReleaseNotesPreview` call) via `CreateBaseAgentOptions`. Exports `BaseAgent` type.
- `src/agui/` — `ReleaseNotesAguiAgent` (custom `AbstractAgent`, replaces `@ag-ui/langchain` `LangChainAgent`, whose `chainFn` cannot emit tool results). Runs `agent.stream(..., {streamMode: "messages"})` with the AG-UI `threadId` as `configurable.thread_id`. Text streams token by token. Server tool calls stream as AG-UI `TOOL_CALL_START/ARGS/END` and then `TOOL_CALL_RESULT` when the tool returns; the web gates rendering on completion, so the preview never renders partially. `toLangChainMessages` converts AG-UI history (user/assistant+toolCalls/tool).
- `src/db/` — `createPgPool()` (lazy `pg.Pool` from `DATABASE_URL`, 3 s connection timeout, `error` listener so idle-client errors do not crash the process; reusable by the checkpointer), `createSupabaseAdminClient()` (service-role key, no session persistence), `checkDatabase(pool)` for `/health`.
- `src/middlewares/auth.ts` — `createRequireAuth(supabase)` Hono middleware mounted on `/api/*`: reads `Authorization: Bearer <token>`, verifies with `supabase.auth.getUser`, sets `c.get("userId")` (type `AuthEnv`); missing/invalid token gets 401 `{ error: "Unauthorized" }`, `OPTIONS` passes. `/health` is outside `/api` and stays public.
- `src/routes/slack.ts` — `createSlackRoute()`: `POST /slack/publish` (body `SlackPublishRequestSchema`: `platformId`, `label`, `content` max 35 000), behind `createRequireAuth` mounted on `SLACK_PATH_PATTERN` (`/slack/*`). Posts to `config.slackWebhookUrl` via `utils/post-to-slack-webhook.ts` (`postToSlackWebhook`: JSON `{ text: "*<label>*\n<content>" }`, 10 s `AbortSignal.timeout`, throws `SlackWebhookError`). Returns `{ ok: true }`; errors are `{ error }` with 400 invalid body, 500 missing webhook URL, 502 Slack rejected / network failure, 504 timeout. Messages live in `SLACK_ERROR_MESSAGES` (same wording as web).
- `src/tools/` — `renderReleaseNotesPreview`: takes the web draft shape (`ReleaseNotesDraftSchema`), returns JSON `{ ...draft, releaseDate, heading }` with date (default today, `America/New_York`) and title filled in.
- Slack publish from chat: `publishReleaseNotesToSlack` is guarded by LangChain `humanInTheLoopMiddleware` (approve/reject) in `createBaseAgent`, which needs the `MemorySaver` checkpointer wired in `index.ts` (Postgres comes with M-22). `ReleaseNotesAguiAgent` streams `messages` + `updates`; a `__interrupt__` update ends the run with `RUN_FINISHED { outcome: { type: "interrupt" } }`, and a later run with `input.resume` becomes `new Command({ resume: { decisions } })` (`resolved` + `{decision: "approve"}` approves, anything else rejects). With saved state, a normal turn sends only the newest message. The web answers through `useInterrupt` (`hooks/use-slack-publish-approval.tsx`).
- Model fallback: `middlewares/model-fallback.ts` wraps prebuilt `modelFallbackMiddleware` with a `ChatOpenAI` on `config.fallbackModel` (`AI_FALLBACK_MODEL`, default `DEFAULT_FALLBACK_MODEL`); first in the `createBaseAgent` middleware list. Primary is `config.model` (`AI_MODEL`).
- `src/skills/` — on-demand skills (`commit-pr-parsing`, `classification-rules`, `platform-formatting`, `release-reporting`) as TS modules + `SKILLS` registry. `middlewares/skills.ts` appends a short catalog to the system message each turn and registers the `load_skill` tool; full rules load only when the model calls it. Add a skill = new module + entry in `SKILLS`.

## Cross-app wiring

Web builds the runtime URL from `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (`/api/copilotkit`). Server default is `http://localhost:4000/api/copilotkit`; keep `AI_PORT` and `VITE_API_SERVER_URL` in step. The web asks for agent id `releaseCopilotAgent`.

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
