# Ticket 90: [F-21] Scheduled sends table and local-time conversion

## What it asks
Feature. A `scheduled_sends` migration (owner, release, content snapshot, `run_at` timestamptz, IANA `time_zone`, status pending/sending/sent/failed/cancelled, attempts, error, RLS) and a pure function turning a local date-time plus IANA zone into an instant with the F-02 date library. It refuses a skipped or repeated local time, a past time and an unknown zone.
Done when: `2026-11-11T19:00` in `Asia/Ho_Chi_Minh` gives `2026-11-11T12:00:00Z`; a skipped DST hour, a past time and a bad zone are each refused (unit tests).

## What's ambiguous
- "The date library from F-02": `@js-temporal/polyfill` is the only one in `apps/ai/package.json`. Used.
- "Past" needs a clock: `now` is a parameter so the test is deterministic (today is already after 2026-11-11).
- Release id: `release_history.id` (F-06), so the FK points there.
- Fixed offsets like `+07:00` are not IANA names: refused as unknown zone.

## First step
Migration modelled on `release_sends`; function in `apps/ai/src/utils/schedule-time.ts`.

## Clarifying questions
None blocking. Assumed Vitest (F-01 unmerged), so tests are written but not runnable here.
