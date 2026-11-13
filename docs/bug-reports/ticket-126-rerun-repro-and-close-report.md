# Bug: gap fixes need a re-run to confirm each gap is closed
Status: REPRODUCED (nothing fails; the re-run found no regression)

## Environment
- Branch / commit: claude/gf-20-close-report-f1124b @ 186c051 (`practices` with #127 to #136 merged)
- Source: GitHub issue #126

## Setup
`pnpm install --frozen-lockfile`, then `docs/reports/repro/run.sh`. No server, database, API key or browser was used.
Setup notes: `docs/reports/` and the original repro scripts (`ai-contract`, `agent-gaps`, `db-gaps`, `runner`, `web-contract`, `tool-error`) were never committed, so they do not exist anywhere. The ticket says to run `docs/reports/repro/run.sh`; it was written fresh, from the repro scripts under `docs/bug-reports/` plus typecheck, lint and build.

## Steps to reproduce
1. `docs/reports/repro/run.sh`

Reproduced: always (2 runs, same result).

## Expected
Every gap named by #115 to #125 is fixed, or has an open issue with the reason.

## Actual
`typecheck`, `lint`, `build` pass. Repros 117 (`true`), 119-120 (`refused`, `updated_at moved`, `row exists (titled later)`), 122 (owner replay has `MESSAGES_SNAPSHOT`; other user 0 events), 121 (`RESULT: OK`) pass. Gaps G-03, G-08, G-14, G-15, G-17, G-18 have no script: status read from code. See `docs/reports/code-gap.md`.

## Evidence
`connect as owner: events=3 types=RUN_STARTED,MESSAGES_SNAPSHOT,RUN_FINISHED` / `connect as other user: events=0`.

## Suspected area
None for the gaps. Open items are feature or environment work: #109 (migration not applied), #80/#81 (History on the release object), #79, #83, #70.

## Questions for the reporter
- The original review report with all G-xx ids is not in the repo. Assumption: only the gaps named in #115 to #125 are in scope. Is there a G-xx outside those?
- Should the G-05, G-13 and #109 live checks be done by hand before closing? Assumption: no, they are listed as not verified.
