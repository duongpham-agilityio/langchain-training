# Ticket 165: [IP-02a] Projects table and project_id migration

## What it asks
Add a `projects` table and make `release_history` and `threads` belong to exactly one project (`project_id` NOT NULL, foreign key). Add the project schema to `packages/contracts`. Type: chore (database).
Done when: the migration applies on a clean database; a row without `project_id` is rejected; a user cannot read another user's project.

## What's ambiguous
- "SQL checks on the dev database in a comment": the user decided not to apply the migration to the dev database; checks run on a throwaway database instead.
- Schema: the migration files write `public.*`, the server reads `"release-builder-dev".*` (`DB_SCHEMA`). Follow the existing migration style (`public`), and reference `projects` through a new `PROJECTS_TABLE` constant in `DB_SCHEMA` for the server-side `threads` DDL.

## First step
Write `supabase/migrations/20261120000000_create_projects.sql`.

## Clarifying questions
No ambiguity: scope, no-backfill and NOT NULL decisions are stated by the ticket owner.
