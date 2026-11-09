# Plan: [M-18] History endpoints

## Goal
`apps/ai` serves `GET /release-history`, `GET /release-history/:id`, `POST /release-history` for the signed-in user only, in the shape the web zod schemas validate.

## Assumptions
- Unconfirmed (Q1): `release_history` columns are snake_case of the web record plus `owner_id` (see analysis). All SQL column names live in `constants/release-history.ts`; the row mapper is the only other place that knows them.
- Unconfirmed (Q2): saved status is `archived`.
- Uses the shared `pg` pool with parameterized SQL and an explicit `owner_id = $1` filter (service connection bypasses RLS, so ownership is enforced in code).
- Platform slot mapping: `github` / `app-store` / `google-play` go to their named columns, any other platform is appended to `platforms` jsonb. Save always inserts a new row.
- `entries` = `[]`, counts = 0 on save (not in request).
- Not in `/api/*`, so auth is mounted on `/release-history` and `/release-history/*`.
- No test runner: scripted check in the scratchpad against a stub pool, not committed.

## Steps
1. Constants + schemas: `constants/release-history.ts`, `schemas/release-history.ts` (zod v4 port of save request, record, list response, list query).
2. DB layer: `db/release-history.ts` (list with `q` ilike on version/title/ `status`, keyset cursor on `created_at,id`; get by id; insert).
3. Routes: `routes/release-history.ts` (`createReleaseHistoryRoutes(pool)`), mount in `index.ts` with auth middleware. 400 on bad body/query, 404 on missing or foreign id, 201 `{id}` on save.
4. Docs: update `apps/ai/CLAUDE.md`.

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0
- scratchpad script: response parses with a copy of the web schema; foreign id gives 404; no token gives 401
