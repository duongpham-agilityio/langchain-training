# Ticket 6: [M-03] Connect the server to the Supabase project

## What it asks
Feature/chore in `apps/ai`: add a server-side Supabase client and a Postgres connection (reused later by the LangGraph checkpointer), and add a DB check to `GET /health`. Creating or reusing the Supabase project itself is part of the scope.
Done when: "`/health` reports DB reachable; wrong credentials make it report unreachable instead of crashing the server."

## What's ambiguous
- "Create or reuse the Supabase project": this is an external, manual step (dashboard, real keys in `.env`). Code cannot do it, and `.env*` is off limits to the agent. Unclear whether a project already exists and who supplies the values.
- "add a DB check to `/health`": the response shape is not defined. Today it is `{ "ok": true }` (`apps/ai/src/index.ts`). Add a `db` field? Does `ok` become false when the DB is down? Which HTTP status when unreachable (200 or 503)?
- "Postgres connection" and "Supabase client": which one does the check use? `pg` (`select 1` on `DATABASE_URL`), the Supabase client (service-role request), or both. They use different credentials, so each can fail separately.
- "wrong credentials make it report unreachable instead of crashing the server": `config.ts` already fails at startup when a variable is missing (kept). Wrong but present values must not crash. Also no hang: no timeout is stated for the check.
- "Postgres connection (used later by the checkpointer)": shape not stated. A shared `pg.Pool` exported for M-22, or just a connection string the checkpointer opens itself.

## First step
Confirm with the reporter that a Supabase project exists and that `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are filled in `apps/ai/.env` (M-02 already added the config and `.env.example`; `@supabase/supabase-js` and `pg` are already in `package.json`). Then build the `pg.Pool` and the Supabase client factories.

## Clarifying questions
1. Does a Supabase project already exist, with the four variables available to whoever runs the app?
   Default assumption: yes, an existing project is reused; no project creation in code, `.env.example` stays as is. Correct?
   Answer: _(pending)_

2. What should `/health` return?
   Default assumption: `{ "ok": boolean, "db": { "reachable": boolean } }`, HTTP 200 when reachable and 503 when not; `ok` equals `db.reachable`. Correct?
   Answer: _(pending)_

3. What does the DB check run?
   Default assumption: `select 1` through the `pg` pool on `DATABASE_URL` only. The Supabase client is created and exported but not called by `/health`. Correct?
   Answer: _(pending)_

4. Should the Postgres connection be a shared `pg.Pool` that the checkpointer reuses in M-22?
   Default assumption: yes, one lazily created `pg.Pool` from `DATABASE_URL`, exported by a factory, with a connect timeout of 3 seconds and an `error` listener so a bad connection never crashes the process. Correct?
   Answer: _(pending)_
