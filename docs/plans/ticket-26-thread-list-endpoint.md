# Plan: [M-23] Thread list endpoint

## Goal
`GET /api/memory/threads` returns the signed-in user's threads in the web response shape; other users' threads never appear.

## Steps
1. Migration `supabase/migrations/20261110000000_create_threads.sql` (table, index, RLS) and manual check `supabase/tests/threads_rls.sql`.
2. `constants/threads.ts`, `schemas/threads.ts` (mirrors web schema), `db/threads.ts` (`listThreads`, filtered by owner), `routes/threads.ts`, mounted in `index.ts` behind the existing `/api/*` auth guard.
3. Document in `apps/ai/CLAUDE.md`.

## Done check
- `pnpm --filter @training/ai typecheck` passes.
- Migration applied and the RLS script passes (not runnable here: no local Postgres).
