# Plan: [M-32] Final run-through against the intent

## Goal
Check each feature in the migration intent scope against the code and, where possible, live; record pass / fail / UNVERIFIED per feature and name the cut items.

## Assumptions
- Unconfirmed: a feature backed by an open ticket (#32, #33, #34) counts as cut/pending, not failing.
- Unconfirmed: live run needs `apps/ai/.env` and `apps/web/.env`, which `.claude/settings.json` blocks and are absent here; live rows are UNVERIFIED.
- No test runner exists; the "test" is the checklist doc.

## Steps
1. Check: write checklist from the intent scope. Files: `docs/verification/m-32-final-run-through.md`.
2. Check: confirm dependency state with `gh issue list` and trace each feature to code in `apps/ai/src` and `apps/web/src`.
3. Check: run `pnpm lint`, `pnpm typecheck`, `pnpm build`.
4. Docs: record verdict and gaps; open issues only for real failures.

## Done check
- lint, typecheck, build exit 0
- every scope row has a result and evidence
- cut / pending items named

## Deviations
- Step 3 live run not done (no env). Rows marked UNVERIFIED.
