# Plan: [M-03] Connect the server to the Supabase project

## Goal
`apps/ai` has a server-side Supabase client and a shared Postgres pool (reusable by the checkpointer in M-22), and `GET /health` reports whether the database is reachable. Wrong credentials make `/health` report unreachable instead of crashing or hanging the server.

## Assumptions
- Unconfirmed (analysis Q1): a Supabase project already exists and `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` are filled in `apps/ai/.env` by the person running the app. No project creation in code; `.env.example` already lists the variables (M-02) and stays unchanged.
- Unconfirmed (Q2): `/health` returns `{ "ok": boolean, "db": { "reachable": boolean } }`, status 200 when reachable and 503 when not; `ok` equals `db.reachable`.
- Unconfirmed (Q3): the check runs `select 1` through the `pg` pool only. The Supabase client is created and exported but not called by `/health`.
- Unconfirmed (Q4): one lazily created `pg.Pool` from `config.databaseUrl`, exposed by a factory, with a 3 second connection timeout and a pool `error` listener (idle-client errors would otherwise crash the process).
- `@supabase/supabase-js`, `pg` and `@types/pg` are already direct dependencies in `apps/ai/package.json` (M-02). No new dependency.
- `config.ts` already requires the four variables at startup (missing value fails naming it). That behaviour is kept; "wrong credentials" means present but invalid values.
- The repo has no test runner (root `CLAUDE.md`) and none is added. The "Test" step is a throwaway script run with `tsx` in the scratchpad, not committed, plus a manual run of the server.
- Supabase client uses the service-role key with `auth.persistSession: false` and `autoRefreshToken: false`, since it is server side. Session verification of user tokens is M-08, out of scope.
- `index.ts` currently builds `CopilotRuntime` at module load and `serve` at the bottom; the health handler is added in place, no restructuring.

## Steps
1. Test: write a throwaway script in the scratchpad (not committed) that, with env pointing `DATABASE_URL` at a closed port or a wrong password, calls the db check function and expects `{ reachable: false }` within about 4 seconds without throwing, and with valid values expects `{ reachable: true }`. Also expects the pool `error` event not to crash the process.
   Files: scratchpad only - Change: none in the repo; used to confirm step 3.
2. Code: add constants.
   Files: `apps/ai/src/constants/database.ts` (new), `apps/ai/src/constants/index.ts` - Change: `DB_CONNECTION_TIMEOUT_MS = 3000`, `DB_HEALTH_QUERY = "select 1"`, `HEALTH_PATH = "/health"` if useful; export from the barrel.
3. Code: Postgres pool, DB check and Supabase client factories.
   Files: `apps/ai/src/db/pg.ts` (new) - Change: `createPgPool()` returning a `pg.Pool` from `config.databaseUrl` with `connectionTimeoutMillis`, and an `error` listener that logs and does not throw. Comment why the listener exists.
   Files: `apps/ai/src/db/supabase.ts` (new) - Change: `createSupabaseAdminClient()` using `config.supabase.url` and `serviceRoleKey`, session persistence off.
   Files: `apps/ai/src/db/health.ts` (new) - Change: `checkDatabase(pool)` runs `DB_HEALTH_QUERY`, returns `{ reachable: true }`, or catches any error, logs the short message (no connection string) and returns `{ reachable: false }`.
   Files: `apps/ai/src/db/index.ts` (new) - Change: barrel. Arrow functions, `@/` imports, grouped comment headers as in `agent/index.ts`.
4. Code: wire `/health`.
   Files: `apps/ai/src/index.ts` - Change: create the pool once with `createPgPool()` (pool does not connect until first query, so bad credentials cannot crash startup); `/health` awaits `checkDatabase(pool)` and returns `{ ok, db }` with 200 or 503. Create the Supabase client with the factory and keep it available for later tickets.
5. Code: document the behaviour.
   Files: `apps/ai/CLAUDE.md` - Change: add `src/db/` to Architecture and update the `/health` line.

## Done check
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0 (no `pnpm test` or `pnpm lint` in this app)
- Throwaway script from step 1 passes
- Manual: `pnpm dev:ai` with valid values, `curl localhost:4000/health` returns `db.reachable: true`; with a wrong `DATABASE_URL` password the server stays up and `/health` returns 503 with `db.reachable: false` in under 4 seconds
- `grep -rn "process.env" apps/ai/src` still lists only `config.ts`
