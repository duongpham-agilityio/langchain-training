# Ticket 75: [F-06] Database: releases store the object, sends are recorded

## What it asks
Feature (database). One SQL migration: `release_history` becomes one row per release that stores the release object, the per-platform text columns that are no longer used are dropped, and a new `release_sends` table records each send with row-level security on both tables. Existing `release_history` rows are deleted (test data, no backfill). Extend `supabase/tests`.

Done when: migration applies cleanly on the current database; a query as user A returns none of user B's releases or sends.

## What's ambiguous
- Resolved: per-platform columns dropped are `github`, `app_store`, `google_play`.
- Resolved: `release_history` keeps `id`, `owner_id`, `status`, `created_at`, `updated_at` plus one `release jsonb` column. `version`, `title`, `release_date`, `title_override`, `platforms`, `entries`, `feat_count`, `fix_count` are dropped.
- Resolved: `release_sends.status` is `pending`, `sent`, `failed`.
- Resolved: `release_sends.recipient` is `''` for Slack (not null).
- Resolved: deleting a release or user cascades to its sends.
- Open (not asked): "extend `supabase/tests`" has no test runner (F-01, #70, is open). The existing `release_history_rls.sql` is a manual script run in the SQL editor or psql. Extending means adding cases to that style of script.
- Open (not asked): the release object shape is defined by F-04 (#73, closed), in `apps/ai/src/schemas/release.ts` on branch `claude/issue-73-release-schema-7bf378`. It is not in `practices` (3e55e1b), the base chosen for this worktree. The migration only needs a `jsonb` column, so the schema file is not needed for the SQL itself.

## First step
Read `supabase/migrations/20261109000000_create_release_history.sql` and `supabase/tests/release_history_rls.sql` (both in this worktree), then write the new migration file and extend the RLS script.

## Clarifying questions
1. Which per-platform text columns are dropped: `github`, `app_store`, `google_play`.
   Answer: Bỏ cả github, app_store, google_play.
2. What holds the release object, and which existing columns stay?
   Answer: Một cột `release jsonb`; giữ id, owner, status, thời gian.
3. Allowed `release_sends.status` values.
   Answer: pending, sent, failed.
4. Slack recipient: empty string or null.
   Answer: Chuỗi rỗng `''`.
5. Delete behaviour for sends.
   Answer: Cascade: xóa release hoặc user thì xóa luôn send.
