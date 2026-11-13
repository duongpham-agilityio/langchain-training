# Apply Supabase migrations to the dev database

`supabase/migrations/*.sql` is not applied automatically. `apps/ai` only creates its own objects at startup (checkpointer tables and `threads` in schema `release-builder-dev`). Tables in `public` such as `release_history` and `release_sends` must be applied by hand, or the `renderReleaseNotesPreview` tool fails with `release_history relation missing` (issue #109).

You need the dev project's `DATABASE_URL` (Supabase dashboard, Project Settings, Database, connection string) in `apps/ai/.env`. Never commit it.

## Option A: SQL editor (no tooling)

1. Open the Supabase dashboard, SQL Editor, new query.
2. Paste `supabase/migrations/20261109000000_create_release_history.sql` and run.

## Option B: script in this repo (needs only Node)

From `apps/ai`:

```bash
pnpm db:status
pnpm db:migrate
```

`db:status` prints whether `public.release_history` and `public.release_sends` exist. `db:migrate` runs the F-06 migration in one transaction (all or nothing).

## Option C: Supabase CLI

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## If `release_history` already exists

The migration is a greenfield `create table`, so it fails with `relation "release_history" already exists`. The old table holds test data only. Drop it first (this deletes its rows):

```sql
drop table if exists public.release_sends, public.release_history cascade;
```

Then run the migration again.

## Verify

1. `pnpm db:status` shows both tables as `exists`.
2. Run the RLS checks: `release_history_rls.sql` and `release_sends_rls.sql` (removed from `supabase/tests` in `ab6656f`; restore with `git show b0340e6:supabase/tests/<name>.sql`). Each rolls back and leaves no data:

   ```bash
   node --env-file=.env scripts/run-sql.mjs <path-to-rls-file.sql>
   ```

3. Repeat the Slack draft flow in the chat; the tool returns `ok: true`.
