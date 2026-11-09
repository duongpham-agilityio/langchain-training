# Ticket 5: [M-02] Add server dependencies and config shape

## What it asks
Chore in `apps/ai`: install the packages the migration needs (Supabase client, Postgres driver, LangGraph Postgres checkpointer, LangSmith), confirm the installed `langchain` ships summarization, model-fallback and PII middleware (bump if not), extend `config.ts` with the new settings, update `apps/ai/.env.example`, and allow CORS for the `Authorization` header and non-CopilotKit routes.
Done when: `pnpm typecheck` and `pnpm build` pass; a missing required variable fails at startup with a message naming it; no env var is read outside `config.ts`.

## What's ambiguous
- "Supabase URL and keys": which keys? Anon key, service-role key, JWT secret? The server "verifies the Supabase session itself" (intent), which may need only URL + anon key, or the JWT secret.
- "a missing required variable fails at startup": which variables are required? Existing ones (`OPENAI_API_KEY`) and the defaulted ones (`AI_PORT`, `AI_MODEL`, `AI_CORS_ORIGIN`) are clearly handled differently from the new ones; the ticket does not say if Slack webhook, LangSmith key/project and fallback model are required or optional (intent says tracing and quality checks are cut first on day 3).
- "Allow CORS for the `Authorization` header and for non-CopilotKit routes": the server has only `/health` and the CopilotKit endpoint, and no other routes exist yet. Unclear whether to add a global `hono/cors` middleware now or only configure the shape.
- "Slack webhook": a single global webhook URL, or per-user/per-destination? Ticket and intent show a single config value.
- "no env var is read outside `config.ts`": the `dev`/`start` scripts load env files via `--env-file-if-exists`; assumed this stays untouched. LangSmith SDK also reads `LANGSMITH_*` env vars itself internally.

## First step
Check the installed `langchain` version (`^1.6.2`) for `summarizationMiddleware`, `modelFallbackMiddleware` and `piiRedactionMiddleware` exports, since that decides whether a bump is needed before adding other packages.

## Clarifying questions
1. Which Supabase values does the server need: URL + anon key only, or also service-role key and/or JWT secret?
   Default assumption: URL, anon key and service-role key (verify sessions via `supabase.auth.getUser(token)`, no JWT secret). Correct?
   Answer: _(pending)_

2. Which new variables are required (fail at startup) vs optional?
   Default assumption: required = `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`; optional = `SLACK_WEBHOOK_URL`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `AI_FALLBACK_MODEL` (the last with a constant default). `OPENAI_API_KEY` becomes required. Correct?
   Answer: _(pending)_

3. For CORS, should this ticket mount a global `cors()` middleware (origin from `AI_CORS_ORIGIN`, `Authorization` + `Content-Type` allowed, standard methods) on the app now?
   Default assumption: yes, global middleware in `index.ts` with `allowHeaders: ["Authorization", "Content-Type"]`; the CopilotKit endpoint's own `cors` is kept. Correct?
   Answer: _(pending)_

4. Is a single Slack webhook URL from env enough?
   Default assumption: yes, one `SLACK_WEBHOOK_URL`. Correct?
   Answer: _(pending)_
