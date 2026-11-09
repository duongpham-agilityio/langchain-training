# Ticket 4: [M-01] Align env, ports, paths and agent id between web and server

## What it asks
Chore. Make web and server agree on one runtime port and path, point `VITE_API_SERVER_URL` at the same server, and register the agent under the id the web asks for (`releaseCopilotAgent`, not `default`).
Done when: "`pnpm dev` starts both apps; the web client connects to the runtime (no connection error banner); a chat message reaches the agent under the id the web asks for."

## What's ambiguous
- "Pick one port and path" — the ticket does not say which. Today: server `:4000` + `/api/copilotkit` (`apps/ai/src/constants/server.ts`), web `.env.example` `:4111` + `/copilotkit`. The source draft (`docs/tickets/migration-draft.md`) lists this as an open question with default `:4000`, `/api/copilotkit`.
- "web `endpoints.ts`" — `COPILOTKIT_ROUTE_PATH` (`/copilotkit`) is not used anywhere; `AppProviders.tsx` reads `VITE_COPILOTKIT_RUNTIME_URL` directly. Unclear whether to wire the constant into the runtime URL or only change its value.
- "Point `VITE_API_SERVER_URL` at the same server" — it is the server origin (no path), used by `http-client.ts`; `VITE_COPILOTKIT_RUNTIME_URL` is a separate full URL. Unclear whether to keep both vars or derive the runtime URL from `VITE_API_SERVER_URL` + path.
- "Done when ... no connection error banner" — no local `.env` check is described; `apps/ai/.env` and a web `.env` are untracked, so an existing dev `.env` with old values may still break the check.

## First step
Fix the server side in `apps/ai/src/index.ts`: change the registered agent key from `default` to `releaseCopilotAgent`. Then align port/path values once the port question is answered.

## Clarifying questions
1. Which runtime port and path win: server's `:4000` + `/api/copilotkit`, or web's `:4111` + `/copilotkit`?
   Default assumption: `:4000` and `/api/copilotkit` (server already runs there; web `.env.example`, `VITE_API_SERVER_URL` and `endpoints.ts` change to match). Correct?
   Answer: Any port/path is fine; the web gets the URL from env, so it is flexible. Use default `:4000`, `/api/copilotkit`.

2. Should the web build the runtime URL from `VITE_API_SERVER_URL` + `COPILOTKIT_ROUTE_PATH` (dropping `VITE_COPILOTKIT_RUNTIME_URL`), or keep both env vars with matching values?
   Default assumption: keep both env vars, set to matching values; `COPILOTKIT_ROUTE_PATH` value updated to `/api/copilotkit` only. Correct?
   Answer: Option B — keep only `VITE_API_SERVER_URL`; the web appends `COPILOTKIT_ROUTE_PATH` (drop `VITE_COPILOTKIT_RUNTIME_URL`).
