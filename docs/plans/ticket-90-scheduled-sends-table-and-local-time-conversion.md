# Plan: [F-21] Scheduled sends table and local-time conversion

## Goal
`scheduled_sends` table with RLS, and `localTimeToInstant(local, zone, now)` that refuses invalid input.

## Steps
1. Code: `supabase/migrations/20261114000000_create_scheduled_sends.sql` (table, due-poller partial index, owner/release index, updated_at trigger, 4 owner RLS policies like `release_sends`).
2. Code: `apps/ai/src/utils/schedule-time.ts` with `ScheduleTimeError` (codes: invalid_local_time, unknown_time_zone, nonexistent_local_time, ambiguous_local_time, in_the_past) and `localTimeToInstant`, using `Temporal` `disambiguation: "reject"`; export from the utils barrel.
3. Tests: `schedule-time.test.ts` (vitest style) next to it. No runner setup (F-01).
4. Verify: run the test file through a throwaway vitest shim in the scratchpad; `pnpm build`, `pnpm lint`; typecheck.

## Done check
- Shim run passes all cases; build and lint exit 0; typecheck exits 0 apart from `vitest` not resolving until F-01 merges.
