# Plan: [F-06] Database: releases store the object, sends are recorded

## Goal
`release_history` holds one row per release with the release object in a `jsonb` column, and the unused per-platform text columns are gone. A new `release_sends` table records each Slack or email send under the same row-level security, so user A never sees user B's releases or sends.

## Assumptions
- Input: `docs/analysis/ticket-75-database-releases-store-object-sends-recorded.md`. The user answered all five questions:
  - Drop `github`, `app_store`, `google_play`.
  - `release_history` keeps `id`, `owner_id`, `status`, `created_at`, `updated_at`, and gets `release jsonb not null` with an object check. Drop `version`, `title`, `release_date`, `title_override`, `platforms`, `entries`, `feat_count`, `fix_count`.
  - `release_sends.status` is `pending` | `sent` | `failed`.
  - `release_sends.recipient` is `text not null default ''`.
  - `release_sends.release_id` cascades on delete from `release_history`; `owner_id` cascades from `auth.users`.
- The release object shape is not validated in SQL. It is defined by F-04 (#73), in `apps/ai/src/schemas/release.ts` on `claude/issue-73-release-schema-7bf378`. This base (`practices`, 3e55e1b) does not have it.
- Application code is not changed here. `apps/ai/src/db/release-history.ts` (`COLUMNS`, `ReleaseHistoryRow`, `toRecord`) and the other `release_history` readers select the dropped columns (`github`, `app_store`, `google_play`, `version`, `title`, ...). They break at runtime after the migration. Their rework belongs to later tickets (F-07 to F-12).
- No test runner exists (`CLAUDE.md`: "No test runner is set up"; F-01 #70 is open). No SQL test scripts are committed to this branch. RLS is checked by hand, on a Supabase database, as described in the Done check.
- Greenfield (user directive, relayed in this session): no existing data is kept or deleted, so no `delete` and no `alter table ... drop column`. The create migration is written as the full target schema. See Deviations.

## Steps
1. Code: write the create migration as the target schema. `release_history` has `id`, `owner_id`, `status`, `release jsonb not null default '{}'::jsonb` with a check `jsonb_typeof(release) = 'object'`, `created_at`, `updated_at`; no per-platform or per-field columns. Create `release_sends`: `id uuid primary key default gen_random_uuid()`, `release_id uuid not null references public.release_history (id) on delete cascade`, `owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade`, `channel text not null check (channel in ('slack', 'email'))`, `recipient text not null default ''`, `status text not null check (status in ('pending', 'sent', 'failed'))`, `sent_at timestamptz`, `error text`, `created_at timestamptz not null default now()`. Index on `(owner_id, release_id)`. Enable RLS on both tables with select/insert/update/delete policies `to authenticated` using `owner_id = (select auth.uid())`, as in the existing migration. Keep the `updated_at` trigger on `release_history`.
   Files: `supabase/migrations/20261109000000_create_release_history.sql` (edit, same file) - Change: as above. No separate migration file.

## Done check
- `pnpm lint` and `pnpm build` exit 0 (no lint script covers `supabase/`; run them to confirm nothing else changed)
- The migration applies cleanly to a Postgres database with the Supabase auth schema, run from the SQL editor or psql, with no errors
- By hand, on that database: as user A, `release_history` and `release_sends` return none of user B's rows; A cannot update, delete or insert rows owned by B
- No `pnpm test` step: no test runner exists. The UI line is dropped: no UI is touched.

## Deviations
- Greenfield directive (relayed from the user through the coordinating session, after the first implementation): the schema is new, so no migration deletes rows or drops columns. Changes from the first pass: `supabase/migrations/20261112000000_releases_store_object_sends.sql` removed; `release_history` created with `release jsonb` directly in `supabase/migrations/20261109000000_create_release_history.sql`; `release_sends` added to the same file. Why: the user chose a clean schema over an in-place upgrade. Impact: the existing `20261109000000` file is edited, not added to; if this migration was already applied to a shared database, it will not re-run and needs a fresh database or a manual reset.
- SQL test scripts removed: the first pass added `supabase/tests/release_history_rls.sql` (extended) and `supabase/tests/release_sends_rls.sql` (new). The user asked for the `supabase/tests` folder to be removed (commit `ab6656f`). Why: user request. The RLS check is now the manual check in the Done check. The earlier Step 1 entries below no longer apply.
- Step 1 (removed with the folder): the `update` case set `title = 'hijack'`, which Step 2 drops, so it would have used `status`. Recorded for history only.
- Verification (PGlite, outside the repo, before the folder was removed): the single create migration applies; both RLS scripts passed. With RLS disabled on `release_sends`, the check failed with "user A sees 1 of B sends". Still needed: one run on a real Supabase database.
- Done check: `pnpm test` exits 1 in the earlier run because the repo has no `test` script. Not a code change.
- Verification beyond the plan: no Postgres is installed here, so the SQL was run in PGlite (`@electric-sql/pglite` 0.3.2) in the session scratchpad, outside the repo. The repo gained no dependency. The auth schema was stubbed (`auth.users`, `auth.uid()`, roles `authenticated`/`anon`).
