# Plan: [M-01] Align env, ports, paths and agent id between web and server

## Goal
Web and server share one runtime address, driven by env: the web builds the CopilotKit URL from `VITE_API_SERVER_URL` plus `COPILOTKIT_ROUTE_PATH`, matching the server's `:4000` + `/api/copilotkit`. The server registers its agent as `releaseCopilotAgent`, so a chat message from the web reaches it. `pnpm dev` starts both apps with no connection error banner.

## Assumptions
- Port and path: any value works as long as both sides match; default `:4000` and `/api/copilotkit` (answered in the analysis doc).
- `VITE_COPILOTKIT_RUNTIME_URL` is dropped; the runtime URL is `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (answered, option B).
- Unconfirmed: the repo has no test runner and no `*.test.*` files (`apps/ai` has only `typecheck` and `build`; `apps/web` has `lint` and `build`). Adding one needs a new dependency, so no automated test is added; a tiny pure helper is introduced to keep the URL logic easy to test later, and verification is typecheck, lint, build and a manual run.
- Unconfirmed: existing untracked `.env` files (`apps/ai/.env`, `apps/web/.env`) may still hold old values (`:4111`, `VITE_COPILOTKIT_RUNTIME_URL`); developers must update them by hand. `apps/ai` dev also loads `../web/.env`, so `AI_PORT` there would override.
- Unconfirmed: the CopilotKit v2 client appends its own sub-paths to `runtimeUrl`, so the value must equal the server `basePath` exactly (no trailing slash).

## Steps
1. Code (server): register the agent under the id the web asks for.
   Files: `apps/ai/src/index.ts`, `apps/ai/src/constants/server.ts` - Change: in `CopilotRuntime({ agents })` replace the `default` key with `releaseCopilotAgent`, defined once as a named constant in `constants/server.ts` (not inlined). Keep `DEFAULT_PORT = 4000` and `RUNTIME_BASE_PATH = "/api/copilotkit"`.
2. Code (web, path): align the route path with the server.
   Files: `apps/web/src/constants/endpoints.ts` - Change: set `COPILOTKIT_ROUTE_PATH` to `/api/copilotkit`.
3. Code (web, URL): build the runtime URL from the server origin plus the route path.
   Files: `apps/web/src/providers/AppProviders.tsx`, `apps/web/src/lib/env.ts` (or a new small helper next to it) - Change: replace `import.meta.env.VITE_COPILOTKIT_RUNTIME_URL` with `getRequiredEnv(import.meta.env.VITE_API_SERVER_URL, 'VITE_API_SERVER_URL')` joined with `COPILOTKIT_ROUTE_PATH`, trimming a trailing slash from the origin. A missing `VITE_API_SERVER_URL` fails with the existing named-variable error.
4. Code (env files and types): remove the old variable and point at the server port.
   Files: `apps/web/.env.example`, `apps/web/src/vite-env.d.ts` - Change: `.env.example` keeps only `VITE_API_SERVER_URL=http://localhost:4000` (delete `VITE_COPILOTKIT_RUNTIME_URL`); remove `VITE_COPILOTKIT_RUNTIME_URL` from `ImportMetaEnv`. Grep confirms no other reader of the variable.
5. Docs check: keep notes consistent.
   Files: `apps/web/CLAUDE.md`, `apps/ai/CLAUDE.md`, `apps/ai/.env.example` - Change: only if they mention `:4111`, `/copilotkit` or `VITE_COPILOTKIT_RUNTIME_URL`, update to match; `AI_PORT=4000` already matches.
6. Manual verify (no automation available): run `pnpm dev`, open the web app, check no connection error banner, send a chat message, and see the server log the request under `releaseCopilotAgent`. Also try changing `AI_PORT` and `VITE_API_SERVER_URL` together to confirm the port is env-driven.

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0 (no `pnpm test` script exists in the repo)
- Grep finds no `4111`, `VITE_COPILOTKIT_RUNTIME_URL` or registered agent id `default` left in `apps`
- Manual run (step 6): web connects, no error banner, chat message reaches `releaseCopilotAgent`

## Deviations
- Step 4: `apps/web/.env.example` was NOT edited. The run rules forbid reading or editing `.env*` files, so the removal of `VITE_COPILOTKIT_RUNTIME_URL` and the `VITE_API_SERVER_URL=http://localhost:4000` line must be done by hand. `vite-env.d.ts` was updated.
- Step 5: `apps/ai/.env.example` was not read for the same reason. `apps/ai/CLAUDE.md` was updated (agent id, cross-app wiring). `apps/web/CLAUDE.md` has no stale mentions.
- Step 3: added a small `joinUrl` helper in `apps/web/src/lib/env.ts` (trims trailing slash of origin), as the plan allowed.
- Step 6 / Done check: `pnpm test` does not exist (plan says so); `pnpm typecheck` was run instead. Manual `pnpm dev` run was not performed (needs real Supabase session and stale local .env that cannot be inspected).
