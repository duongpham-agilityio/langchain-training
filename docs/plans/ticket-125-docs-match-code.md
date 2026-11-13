# Plan: Docs match the code (GF-19, #125)

## Goal
Every file, table and command named in `CLAUDE.md` and `apps/ai/CLAUDE.md` exists and matches the code; stale references in issue #109 are corrected.

## Assumptions
- #80 (history on the release object) and #81 (Slack on the new shape, sends recorded) are still open: write against current code, note in the PR.
- `docs/reports/repro/run.sh` is local only (issue says "not pushed yet"): the root line names it and says it is local, not committed.
- No test runner exists; the "test" is a path-existence check script (scratch, not committed).

## Steps
1. Test: scratch script lists backticked paths in both CLAUDE.md files that do not exist; today it reports `20261110000000_create_threads.sql`.
   Files: none committed - Change: none
2. Code: `apps/ai/CLAUDE.md` Thread titles bullet - say `threads` lives in schema `release-builder-dev`, created by `ensureThreadsTable` (`db/threads.ts`, called at start in `index.ts`), not by a migration; replace `public.threads`. Also the `routes/threads.ts` bullet. Add bullets for current history/email routes (`routes/release-history.ts`, `db/release-history.ts`, `routes/release-email.ts`) and note the `release_history` / `release_sends` migration `20261109000000_create_release_history.sql`.
   Files: apps/ai/CLAUDE.md, apps/ai/src/db/threads.ts (stale comment only)
3. Code: root `CLAUDE.md` - add a line about `docs/reports/repro/run.sh` (local repro scripts, not committed) and `supabase/migrations/`.
   Files: CLAUDE.md
4. Issues: `gh issue edit 109` - replace deleted `supabase/tests/*` references with a note; comment on #109.
   Files: none (GitHub)

## Done check
- Path-existence script reports nothing missing (except the declared local-only path)
- `pnpm typecheck` and `pnpm lint` exit 0 (no test runner in repo)

## Deviations
- Step 2: the migration `20261109000000_create_release_history.sql` stores one `release` jsonb per row, but `db/release-history.ts` still uses flat columns (`version`, `title`, `release_date`, ...), and nothing reads `release_sends`. The plan only said to "note the migration"; the bullet states this mismatch (open work #80/#81) so the doc matches the code.
- Done check: the worktree had no `node_modules`, so `pnpm typecheck` failed (TS2688, missing `node` types). Ran `pnpm install --frozen-lockfile` (no dependency or lockfile change), then both checks passed.
