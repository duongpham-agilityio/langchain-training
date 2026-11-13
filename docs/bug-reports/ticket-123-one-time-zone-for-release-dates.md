# Bug: release made at 22:00 in Los Angeles shows under "Last 7 days" instead of "Today"
Status: REPRODUCED

## Environment
- Branch / commit: claude/gf-17-release-timezone-a74b5b @ c89c3d5
- Versions: node v22.22.2, pnpm 10.33.0, macOS (darwin 23.6.0)
- Source: GitHub issue #123 ([GF-17] One time zone for release dates)

## Setup
1. `pnpm install --frozen-lockfile`
2. Bundle `groupReleaseHistoryByRecency` with esbuild and run it under `TZ=America/Los_Angeles` (scratch script outside the repo). The dev server was not used: the bug is in a pure function, and History needs a Supabase sign-in plus a live agent server.
Setup notes: the worktree branch first pointed at a stale `origin/practices` ("Initial commit"); it was reset to `github/practices` (c89c3d5) before any work. The repo has no web test runner and no `web-contract` script, so the issue's "Proof" script does not exist.

## Steps to reproduce
1. Take a release stamped by the server in the browser zone: `releaseDate = "20261113"` (Los Angeles date).
2. Call `groupReleaseHistoryByRecency([{ releaseDate: "20261113", monthLabel: "November 2026" }], new Date("2026-11-14T06:00:00Z"))` (22:00 on 2026-11-13 in Los Angeles) with `TZ=America/Los_Angeles`.

Reproduced: always (2 of 2 runs).

## Expected
Group label `Today`.

## Actual
`["Last 7 days"]`

## Evidence
```
$ TZ=America/Los_Angeles node repro.out.mjs
["Last 7 days"]
```

## Suspected area
Failing step: 2
Files:
```ts
// apps/web/src/lib/release-notes/group-release-history-by-recency.ts:32
const today = formatReleaseDate(now);
// apps/web/src/lib/release-notes/release-title.ts:6-9
export const formatReleaseDate = (now = new Date(), timeZone = RELEASE_NOTES_DEFAULT_TIME_ZONE) => ...
```
Why: `formatReleaseDate` defaults to `America/New_York`, so "today" at that instant is `20261114` (01:00 NY), while the stored date is `20261113` (server stamps in the browser zone via `X-Time-Zone`). Day diff is 1, so label is "Last 7 days". The display helpers (`formatReleaseDateDisplay` and siblings) share the same default. This is a suspicion, not a proven root cause.

## Questions for the reporter
- Should stored `YYYYMMDD` dates render as the same calendar day for every viewer? Assumption: yes (a stored date is a calendar day, not an instant).
