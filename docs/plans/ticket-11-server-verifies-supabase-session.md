# Plan: [M-08] Server verifies the Supabase session

## Goal
Every `/api/*` request on the `apps/ai` server must carry a valid Supabase access token as `Authorization: Bearer <token>`. A valid token puts the user id on the Hono context for handlers; a missing or invalid token gets 401. `/health` stays public.

## Assumptions
- Unconfirmed (analysis Q1): the old `require-owner-id` is not in this repo. The "owner id" idea becomes a typed `userId` context variable that handlers read to scope data to its owner.
- Unconfirmed (Q2): the token is verified with `supabase.auth.getUser(token)` on the existing server Supabase client (`supabaseAdmin`); no new env vars or dependencies.
- Unconfirmed (Q3): 401 body is `{ "error": "Unauthorized" }`, identical for missing and invalid tokens.
- Unconfirmed (Q4): CORS preflight `OPTIONS` is not authenticated (browsers send no `Authorization` on preflight); it passes through the middleware.
- Only `/api/copilotkit/*` exists under `/api` today; REST routes come in later tickets and inherit the middleware via `app.use("/api/*", ...)`.
- `supabaseAdmin` is created in `index.ts`, so the middleware is a factory taking the client (`createRequireAuth(supabase)`), per the "factory over singleton" convention.
- No test runner in the repo; verification is a throwaway script/manual `curl`, not committed.
- Middleware must run after the global CORS middleware so 401 responses still carry CORS headers.

## Steps
1. Test: throwaway script in the scratchpad (not committed) that builds a Hono app with the middleware and a fake Supabase client (`getUser` returns a user for token `good`, an error for others). Expects: no header 401, `Basic x` 401, bad token 401, `Bearer good` 200 with the user id seen by the handler, `OPTIONS` not 401, route outside `/api` public.
   Files: scratchpad only - Change: none in the repo.
2. Code: constants and context type.
   Files: `apps/ai/src/constants/server.ts` - Change: add `API_PATH_PATTERN = "/api/*"` and `BEARER_PREFIX = "Bearer "`.
   Files: `apps/ai/src/types/auth.ts` (new) or inline in the middleware - Change: `AuthEnv = { Variables: { userId: string } }` Hono env type.
3. Code: middleware.
   Files: `apps/ai/src/middlewares/auth.ts` (new), `apps/ai/src/middlewares/index.ts` (new barrel; remove `.gitkeep` if present) - Change: `createRequireAuth(supabase)` returns a Hono middleware: skip `OPTIONS`; parse the Bearer token; call `supabase.auth.getUser(token)`; on missing token, error or no user return `c.json({ error: "Unauthorized" }, 401)`; otherwise `c.set("userId", data.user.id)` and `next()`. Comment why the same body is returned for all failures.
4. Code: mount it.
   Files: `apps/ai/src/index.ts` - Change: type `new Hono<AuthEnv>()`, add `app.use(API_PATH_PATTERN, createRequireAuth(supabaseAdmin))` after CORS, before the CopilotKit route. `/health` stays registered outside `/api`.
5. Docs: `apps/ai/CLAUDE.md` - Change: describe `src/middlewares/auth.ts` and the `/api/*` auth rule.

## Done check
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0 (no test or lint script in this app)
- Throwaway script from step 1 passes
- Manual (needs real `.env`): `curl -i localhost:4000/api/copilotkit/info` returns 401 without a token and with a bad token; `/health` returns 200/503 without a token
