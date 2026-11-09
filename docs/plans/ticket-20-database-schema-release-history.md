# Plan: [M-17] Database schema for Release History

## Goal
A Supabase migration creates `public.release_history` matching the web `ReleaseHistoryRecordSchema`, with RLS so each user sees and changes only their own rows. A SQL script proves user A cannot see user B's rows.

## Assumptions
- (unconfirmed) `owner_id` is `auth.users.id`, FK with cascade, default `auth.uid()`.
- (unconfirmed) `platforms` and `entries` are `jsonb` default `[]`; `release_date` is `text` with check `^\d{8}$`.
- (unconfirmed) Migrations live in `supabase/migrations/`; the repo has no test runner or Postgres locally, so verification is a manual SQL script.
- (unconfirmed) Policies cover select/insert/update/delete for role `authenticated`; the server's service role bypasses RLS (M-18 must still filter by owner).

## Steps
1. Test: SQL script that seeds two users and rows, switches to role `authenticated` with each user's JWT claims, and asserts user A sees 0 of B's rows and cannot insert/update/delete B's rows.
   Files: `supabase/tests/release_history_rls.sql` - Change: new, runs in a transaction and rolls back.
2. Code: migration creating the table, constraints, cursor index `(owner_id, created_at desc, id desc)`, `updated_at` trigger, RLS enabled and policies.
   Files: `supabase/migrations/20261109000000_create_release_history.sql` - Change: new.

## Done check
- Migration applies on a fresh Supabase project (SQL editor or `supabase db reset`); not runnable locally here.
- `supabase/tests/release_history_rls.sql` passes (raises no exception).
- No app code touched, so `pnpm typecheck` / `pnpm build` unaffected.
