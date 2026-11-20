# Plan: Projects table and project_id migration

## Goal
`projects` table with own-row RLS; `release_history.project_id` and `threads.project_id` NOT NULL foreign keys; project schema in contracts.

## Assumptions
- No backfill, no default project; old data is cleaned by hand first (an existing non-empty `threads` table makes the added column fail, logged by `ensureThreadsTable`).
- `on delete cascade` from `projects` to children, like `owner_id`.
- Migration is not applied to the dev database; verified on a throwaway database.
- Callers inserting into `threads` / `release_history` are not fixed here (#166).

## Steps
1. Code: new migration `supabase/migrations/20261120000000_create_projects.sql`: `projects`, index, updated_at trigger, RLS, `alter table release_history add column project_id uuid not null references projects`, owner+project index.
2. Code: `apps/ai/src/constants` add `PROJECTS_TABLE`; `apps/ai/src/db/threads.ts` `ensureThreadsTable` adds `project_id` (create + idempotent `add column if not exists`) and owner+project index.
3. Code: `packages/contracts/src/projects.ts` (`ProjectSchema`), export from index.
4. Verify: SQL checks on a throwaway Postgres; `pnpm typecheck`, `pnpm build`.

## Done check
- `pnpm typecheck`, `pnpm build` exit 0
- SQL checks: insert without `project_id` rejected, other user's project invisible
