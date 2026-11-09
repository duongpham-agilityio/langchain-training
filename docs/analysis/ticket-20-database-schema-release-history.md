# Ticket 20: [M-17] Database schema for Release History

## What it asks
Chore/feature: SQL migration creating `release_history` on Supabase Postgres, with row-level security so a user only sees their own rows. Starts empty (no Turso data).
Done when: "migration applies cleanly on a fresh project; a query as user A returns none of user B's rows."

## What's ambiguous
- "fields the web `release-history-record` type needs": the web record has `id`, `version`, `title`, `releaseDate` (`^\d{8}$`), `titleOverride`, `status` (draft/published/archived), `github`, `appStore`, `googlePlay`, `platforms[]`, `entries[]`, `featCount`, `fixCount`, `createdAt`. Column types for the nested arrays and `releaseDate` are not stated.
- "owner id": the Supabase auth user id (uuid) is assumed; not stated.
- Where migrations live: no `supabase/` folder exists yet.
- "applies cleanly on a fresh project" and "query as user A": no local Postgres/Supabase CLI here, so the check must be a SQL script a person runs.

## First step
Write `supabase/migrations/<timestamp>_create_release_history.sql`.

## Clarifying questions
1. Is `owner_id` the Supabase auth user id (`auth.users.id`, uuid)?
   Default assumption: yes, FK to `auth.users` with `on delete cascade`, default `auth.uid()`. Correct?
   Answer: _(pending)_

2. Column types for `platforms`, `entries`, `releaseDate`?
   Default assumption: `platforms` and `entries` are `jsonb` (default `[]`); `release_date` is `text` with a check `^\d{8}$` so the API returns it unchanged. Correct?
   Answer: _(pending)_

3. Migration location and tooling?
   Default assumption: Supabase CLI layout `supabase/migrations/*.sql`, applied by `supabase db push` or the SQL editor. Correct?
   Answer: _(pending)_

4. Should the server keep using the service role (bypasses RLS) with explicit owner filtering in M-18?
   Default assumption: RLS is defense in depth; policies target role `authenticated` and cover select/insert/update/delete. Correct?
   Answer: _(pending)_
