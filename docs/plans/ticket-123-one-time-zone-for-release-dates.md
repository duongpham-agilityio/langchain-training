# Plan: One time zone for release dates (GF-17, #123)

## Goal
In `apps/web`, "today" is decided in the browser zone (`getBrowserTimeZone()`), the same zone the server stamps release dates in, so a release made at 22:00 in Los Angeles is grouped under "Today" that evening. `RELEASE_NOTES_DEFAULT_TIME_ZONE` is gone from the web.

## Assumptions
- The web has no test runner and the issue forbids new dependencies in a bug fix, so the Test step is the scripted repro from the bug report (esbuild bundle run under `TZ=America/Los_Angeles`), not a committed test file. The `web-contract` script named in the issue does not exist in the repo.
- A stored `YYYYMMDD` is a calendar day. `parseReleaseDate` returns UTC noon, so display helpers format it in `UTC` (not the browser zone): that keeps the same day for every viewer, including zones at UTC+13/+14 where UTC noon would roll to the next day. Only "today" (`formatReleaseDate`) uses the browser zone.
- `formatReleaseDate` keeps an optional `timeZone` parameter; its default becomes `getBrowserTimeZone()`.
- `TIME_ZONE_HEADER` stays in `constants/config/time-zone.ts`; only `RELEASE_NOTES_DEFAULT_TIME_ZONE` is removed. `apps/ai` is untouched.

## Steps
1. Test: run the scripted repro from the bug report and see it print `["Last 7 days"]` before the fix, then `["Today"]` after. Also check a stored date one day earlier prints `Last 7 days`.
   Files: scratch script outside the repo - Change: none in repo
2. Code: default "today" to the browser zone and format stored dates as calendar days.
   Files: `apps/web/src/lib/release-notes/release-title.ts` - Change: import `getBrowserTimeZone` from `@/lib/time-zone.ts`; `formatReleaseDate` defaults `timeZone` to `getBrowserTimeZone()`; display helpers format in `UTC` via a local constant and drop their `timeZone` parameter and the `RELEASE_NOTES_DEFAULT_TIME_ZONE` import; fix the comment in `group-release-history-by-recency.ts`.
   Files: `apps/web/src/lib/release-notes/group-release-history-by-recency.ts` - Change: comment says "today" is read in the browser zone.
3. Code: remove the unused constant.
   Files: `apps/web/src/constants/config/time-zone.ts` - Change: delete `RELEASE_NOTES_DEFAULT_TIME_ZONE`, keep `TIME_ZONE_HEADER`.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` all exit 0 (web has no `pnpm test`)
- The scripted repro prints `["Today"]` under `TZ=America/Los_Angeles`
- `grep -rn RELEASE_NOTES_DEFAULT_TIME_ZONE apps/web` finds nothing
