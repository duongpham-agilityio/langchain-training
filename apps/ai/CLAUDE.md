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
- `src/agent/` — `createBaseAgent(options?)` = `createAgent` + `ChatOpenAI`, `tools`; optional `middleware`, `checkpointer`, `systemPrompt` (default `SYSTEM_PROMPT`) via `CreateBaseAgentOptions`. Exports `BaseAgent` type.
- `src/agui/` — wraps the agent in `@ag-ui/langchain` `LangChainAgent`. `streamTextChunks` runs `agent.stream(..., {streamMode: "messages"})` and passes the AG-UI `threadId` as `configurable.thread_id` (logged once per run) and yields **only text chunks**; server tool calls are dropped on purpose (AG-UI history must not hold tool calls the client cannot answer). The bridge treats tools as frontend tools; the agent runs its own server-side tool loop.
- `src/db/` — `createPgPool()` (lazy `pg.Pool` from `DATABASE_URL`, 3 s connection timeout, `error` listener so idle-client errors do not crash the process; reusable by the checkpointer), `createSupabaseAdminClient()` (service-role key, no session persistence), `checkDatabase(pool)` for `/health`.
- `src/middlewares/auth.ts` — `createRequireAuth(supabase)` Hono middleware mounted on `/api/*`: reads `Authorization: Bearer <token>`, verifies with `supabase.auth.getUser`, sets `c.get("userId")` (type `AuthEnv`); missing/invalid token gets 401 `{ error: "Unauthorized" }`, `OPTIONS` passes. `/health` is outside `/api` and stays public.
- `src/skills/` — empty (`.gitkeep`); reserved for skills.

## Cross-app wiring

Web builds the runtime URL from `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (`/api/copilotkit`). Server default is `http://localhost:4000/api/copilotkit`; keep `AI_PORT` and `VITE_API_SERVER_URL` in step. The web asks for agent id `releaseCopilotAgent`.

## Code style and structure

Follow existing patterns; the folder layout is the convention.

- Path alias `@/*` → `src/*` (tsconfig `paths`). Import across folders with `@/...`, relative only for siblings inside one folder. Imports are ESM, double-quoted strings, semicolons, trailing commas, 2-space indent.
- One concern per folder, each with an `index.ts` barrel (`export * from "./x"`): `constants/`, `schemas/`, `tools/`. Import from the barrel (`@/constants`), not deep files.
- Adding a tool = 3 pieces, wired together:
  1. name in `constants/tools.ts` → `TOOL_NAMES` (`as const`),
  2. zod schema in `schemas/<tool>.ts` (zod v4),
  3. `tool(...)` in `tools/<tool>.ts` using both, then append to the `tools` array in `tools/index.ts`.
- No magic values inline: model names, prompts, ports, paths go in `constants/`. Env access only in `config.ts`, exported as a single `as const` object.
- Arrow functions + `export const` for everything; `function*` only where a generator requires it (comment says why). Factory functions (`createBaseAgent`, `createAguiAgent`) over module-level singletons.
- Import blocks in `agent/` and `tools/` are grouped under short comment headers (`// Configs`, `// Constants`, `// Tools`, `// Schemas`).
- Comment the *why* (e.g. why tool calls are dropped), as in `agui/index.ts`; doc-comment non-obvious bridges with `/** */`.
- Stay on `createAgent` + prebuilt middleware; no custom LangGraph graphs. LLM does classify/write/interpret; render/validate/save/send stay deterministic code.
