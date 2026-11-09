# Plan: [M-07] Record spike result and decide

## Goal
`docs/spikes/migration-spike.md` records the decision for spikes A, B and C (works / fallback, how, effect on M-15, M-20, M-22, M-24), and no throwaway spike code remains in `apps/`.

## Assumptions
- Unconfirmed (Q1): throwaway code is deleted (`apps/ai/src/spikes`, `apps/web/src/spikes`, `apps/web/hitl-spike.html`, `apps/web/spike-tool-stream.html`, `spike:hitl` script). Code stays recoverable from git history (PRs #40, #41, #42).
- Unconfirmed (Q2): the three per-spike docs stay as evidence; the new doc links to them.
- Unconfirmed (Q3): ticket numbering follows `docs/tickets/migration-draft.md`; spike-doc references to other numbers are re-mapped in the new doc.
- Spike docs reference run commands and code paths that disappear; the new doc states that and points to the merge commits instead of editing the old docs.
- No test runner exists; the check is typecheck, lint and build plus grep for leftovers.

## Steps
1. Test: define the failing check first: `grep -rIl spike apps --exclude-dir=node_modules` lists spike files today; after the change it lists none.
   Files: none - Change: none.
2. Code: delete the throwaway code and entries.
   Files: `apps/ai/src/spikes/`, `apps/web/src/spikes/`, `apps/web/hitl-spike.html`, `apps/web/spike-tool-stream.html`, `apps/ai/package.json` (remove `spike:hitl`) - Change: remove.
3. Docs: write `docs/spikes/migration-spike.md`: summary table A/B/C; per spike what works, the chosen route, the fallback; "Changes per ticket" for M-15, M-20, M-22, M-24 using the ticket-list numbering; remaining unknowns each marked works or fallback; where the deleted code lives in git.
   Files: `docs/spikes/migration-spike.md` - Change: new.

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0
- `grep -rIil spike apps --exclude-dir=node_modules` lists nothing
- `docs/spikes/migration-spike.md` exists; every unknown is marked works or fallback
