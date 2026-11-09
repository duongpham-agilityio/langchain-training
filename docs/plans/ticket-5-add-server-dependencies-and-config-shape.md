# Plan: [M-02] Add server dependencies and config shape

## Goal
`apps/ai` has the packages the migration needs and a `config.ts` that exposes Supabase, database, Slack, LangSmith and fallback-model settings. A missing required variable fails at startup naming it, no env var is read outside `config.ts`, CORS allows the `Authorization` header on all routes, and `pnpm typecheck` and `pnpm build` pass.

## Assumptions
- Unconfirmed (analysis Q1): Supabase values are `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; no JWT secret.
- Unconfirmed (Q2): required = `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`. Optional = `SLACK_WEBHOOK_URL`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `AI_FALLBACK_MODEL` (default constant `DEFAULT_FALLBACK_MODEL`).
- Unconfirmed (Q3): mount a global `hono/cors` middleware in `index.ts` (origins from `AI_CORS_ORIGIN`, headers `Authorization` and `Content-Type`); the CopilotKit endpoint keeps its own `cors` option.
- Unconfirmed (Q4): a single `SLACK_WEBHOOK_URL`.
- Checked in the installed `langchain@1.6.2`: `summarizationMiddleware`, `modelFallbackMiddleware`, `piiMiddleware` and `piiRedactionMiddleware` are exported, so no `langchain` bump is needed.
- `pnpm-lock.yaml` and `node_modules/.pnpm` already contain `@supabase/supabase-js` 2.119.0 and `langsmith` 0.11.8 (transitive); they still get added as direct dependencies of `@training/ai`.
- The repo has no test runner (see root `CLAUDE.md`), and none is added under "no new dependency without asking". The "Test" step is therefore a scripted check, not a unit test.
- Postgres driver is `pg` (+ `@types/pg`) and the checkpointer is `@langchain/langgraph-checkpoint-postgres`; versions are picked at install time, compatible with `@langchain/langgraph` ^1.7.1.
- `OPENAI_API_KEY` becoming required changes the current behaviour (today it is read by the OpenAI client implicitly); `.env.example` already lists it.
- The `--env-file-if-exists` flags in `dev`/`start` scripts stay as they are.
- `LANGSMITH_*` vars are also read by the LangSmith SDK from `process.env`; `config.ts` reads them for validation and the SDK still sees them because they come from the same env files.

## Steps
1. Test (check for the failing startup): before changing code, write a throwaway script run via `tsx` in the scratchpad (not committed) that imports `config.ts` with required vars unset and expects a thrown error naming the first missing variable.
   Files: scratchpad only - Change: none in the repo; used to confirm step 3 works, and a grep check `grep -rn "process.env" apps/ai/src` that must list only `config.ts`.
2. Code: add dependencies to `@training/ai`: `@supabase/supabase-js`, `pg`, `@types/pg` (dev), `@langchain/langgraph-checkpoint-postgres`, `langsmith`. Run `pnpm install` for the lockfile.
   Files: `apps/ai/package.json`, `pnpm-lock.yaml` - Change: new direct dependencies; no `langchain` bump.
3. Code: add defaults and extend `config.ts`.
   Files: `apps/ai/src/constants/model.ts` - Change: add `DEFAULT_FALLBACK_MODEL` (a different cheap OpenAI model than `DEFAULT_MODEL`, e.g. `gpt-4o`... final value chosen at implementation and noted in PR).
   Files: `apps/ai/src/config.ts` - Change: keep the single `as const` object; add `supabase: { url, anonKey, serviceRoleKey }`, `databaseUrl`, `slackWebhookUrl`, `langsmith: { apiKey, project }`, `fallbackModel`, `openaiApiKey`. Add a small `requireEnv(name)` helper in the same file that throws `Missing required environment variable: <NAME>`; optional ones use `process.env.X` directly with constant defaults. All new defaults live in `src/constants`.
4. Code: CORS for `Authorization` and non-CopilotKit routes.
   Files: `apps/ai/src/index.ts` - Change: add `app.use("*", cors({ origin: config.corsOrigin, allowHeaders: ["Authorization", "Content-Type"] }))` before routes; keep the CopilotKit endpoint's `cors` and make sure `Authorization` is also allowed there if its option supports `allowHeaders`.
5. Code: update env template.
   Files: `apps/ai/.env.example` - Change: add the new variables with comments marking required vs optional; no real values.
6. Check: run the step 1 script (fails naming the variable), then with all required vars set it passes; grep confirms `process.env` only in `config.ts`.
   Files: none - Change: none.

## Done check
- `pnpm typecheck` and `pnpm build` exit 0 (`pnpm test` does not exist; `pnpm lint` run if the app defines it)
- Starting the server with a required variable unset exits with a message naming that variable
- `grep -rn "process.env" apps/ai/src` lists only `src/config.ts`
- An `OPTIONS` request to `/health` with `Access-Control-Request-Headers: authorization` returns the header in `Access-Control-Allow-Headers`

## Deviations
- Step 5: `apps/ai/.env.example` was NOT edited. The implementation instructions forbid reading or editing any `.env*` file, which overrides the plan. The new variables (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` required; `SLACK_WEBHOOK_URL`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `AI_FALLBACK_MODEL` optional) still need to be added by hand.
- Step 2: `pnpm install` was done via `pnpm --filter @training/ai add ...` (worktree had no installed `tsx`). Added deps (all named in the plan): `@supabase/supabase-js`, `pg`, `@langchain/langgraph-checkpoint-postgres`, `langsmith`, dev `@types/pg`.
- Step 3: fallback model value chosen as `gpt-4.1-mini` (plan left it open).
- Step 4: added `CORS_ALLOWED_HEADERS` to `apps/ai/src/constants/server.ts` (no inline magic values rule). The CopilotKit endpoint's `cors` option has only `origin`/credentials, no `allowHeaders`, so it was left unchanged; the global middleware answers preflights first.
- Step 1/6: the check script is `check.mts` (not `.ts`) because top-level await needs ESM.
- Done check: `pnpm test` has no script and exits 1 with no output; `pnpm lint` only covers `release-copilot`.
