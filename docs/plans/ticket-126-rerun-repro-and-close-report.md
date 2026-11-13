# Plan: [GF-20] Re-run the repro and close the report

## Goal
Every gap named in #115 to #125 is marked fixed, or has an open issue with the reason, in `docs/reports/code-gap.md` and `code-gap.vi.md`, backed by a `docs/reports/repro/run.sh` that passes on `practices`.

## Assumptions
- The original `docs/reports/` never existed in the repo; rebuild it from the GF issues and `docs/bug-reports/`.
- Only gaps named in the GF issues are covered; the others are unknown.
- Permanent checks are only listed, not built: no test runner (#70).
- Root `CLAUDE.md` (from #134) already describes `docs/reports/repro/run.sh` as local and uncommitted. This ticket commits the file, so that line goes stale; the line is left to a follow-up because editing `CLAUDE.md` was not authorised here.

## Steps
1. Re-run: write `docs/reports/repro/run.sh` (turbo typecheck/lint/build with `--force`, then the four repros, each copied into its app and deleted after). Done: it exits 0.
2. Verify each gap against the code on `practices` and write `docs/reports/code-gap.md` and `code-gap.vi.md` (gap, problem, ticket, PR, status, evidence; open items with issues).
3. Docs: `docs/bug-reports/ticket-126-...md` (the re-run record).

## Done check
- `docs/reports/repro/run.sh` exits 0
- every gap row is fixed, or links an open issue
- no file outside `docs/` changed
