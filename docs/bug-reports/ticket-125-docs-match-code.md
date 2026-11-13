# Bug: CLAUDE.md files and issue #109 name files that do not exist
Status: REPRODUCED

## Environment
- Branch / commit: docs/gf-19-docs-match-code @ c89c3d5 (`practices`)
- Versions: docs-only ticket, no app started (no server needed to observe the symptom)
- Source: GitHub issue #125 (GF-19)

## Setup
1. `git switch docs/gf-19-docs-match-code`
2. Run a path check over every backticked path in `CLAUDE.md` and `apps/ai/CLAUDE.md` (scratch script, not committed): each path is tried relative to the repo root, the app folder and `apps/ai/src`.
Setup notes: none. No dev server started (docs ticket); port overrides AI_PORT=4119 / 5119 not needed.

## Steps to reproduce
1. In `apps/ai/CLAUDE.md`, find the "Thread titles (M-24)" bullet and the file named `20261110000000_create_threads.sql`.
2. Run `ls supabase/migrations`.
3. Run `git grep -n "supabase/tests"` and open issue #109 (`gh issue view 109`).
4. Run `ls docs/reports`.

Reproduced: always (static check).

## Expected
Every file, table and command named in the two `CLAUDE.md` files exists and is accurate; issue #109 points at real files.

## Actual
- `supabase/migrations` holds only `20261109000000_create_release_history.sql`. `20261110000000_create_threads.sql` does not exist, yet `apps/ai/CLAUDE.md` says "The `public.threads` table comes from the M-23 migration (...); this branch carries no copy" and twice says `public.threads`.
- Code creates the table at startup: `apps/ai/src/db/threads.ts` `ensureThreadsTable` (called in `apps/ai/src/index.ts`) runs `create schema if not exists "release-builder-dev"` and creates `"release-builder-dev".threads` (`THREADS_TABLE`, `apps/ai/src/constants/threads.ts`; `DB_SCHEMA` in `constants/database.ts`).
- `apps/ai/src/db/threads.ts:9` comment also cites `supabase/migrations/*_create_threads.sql`.
- `supabase/tests/` does not exist in git. Issue #109 tells the reader to run `supabase/tests/release_history_rls.sql` and `supabase/tests/release_sends_rls.sql`.
- `docs/reports/` (incl. `repro/run.sh`) does not exist in the repo: the issue says it is local and not pushed. Root `CLAUDE.md` has no line about it.
- `apps/ai/CLAUDE.md` has no entry for `src/routes/release-history.ts`, `src/routes/release-email.ts` or `src/db/release-history.ts`, which exist.

## Evidence
```
MISSING [apps/ai/CLAUDE.md]: 20261110000000_create_threads.sql
$ ls supabase/migrations
20261109000000_create_release_history.sql
$ ls supabase/tests
ls: supabase/tests: No such file or directory
```

## Suspected area
Failing step: 2
```md
<!-- apps/ai/CLAUDE.md:56 -->
The `public.threads` table comes from the M-23 migration (`20261110000000_create_threads.sql`); this branch carries no copy.
```
Why: the threads table moved from a Supabase migration to runtime `ensureThreadsTable` in a custom schema; docs were not updated. This is a suspicion, not a proven root cause.

## Questions for the reporter
- Is `docs/reports/repro/run.sh` going to be committed? Assumption: no (local only); the root line says so and does not claim it is in a fresh clone.
- Final wording after #80 and #81 (still open). Assumption: document current code and note it in the PR.
