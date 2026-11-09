# Plan: [M-10] Day 1 check-in

## Goal
Confirm day 1 ends with the spike result recorded and sign-in working on current `practices`, and record any risk that moves day 2 (M-11 to M-21) in one verification doc.

## Assumptions
- Unconfirmed: proof is merged-and-closed issues plus one re-run of sign-in (email/password and GitHub) on current `practices`, recorded in the doc.
- Unconfirmed: result lives in `docs/verification/m-10-day-1-check-in.md`; we do not comment on or close issue #13.
- Unconfirmed: "env" means M-01 (env, ports, paths, agent id) plus the M-02/M-03 config it feeds.
- Unconfirmed: each risk names the affected day 2 ticket and a proposed schedule change.
- This is a docs-only chore: no source code changes, so no automated test can fail first. The "test" is a checklist of verifiable facts.
- Starting point for risks: the "Unknowns" table and "Changes per ticket" in `docs/spikes/migration-spike.md` (real `ChatOpenAI` chunk shape, parallel tool calls, `PostgresSaver`, runner replay, pending confirmation on reload). Throwaway spike code is stated deleted; verify.
- M-01 was done under issue #4; format of `docs/verification/m-09-web-sign-in.md` is the model for the new doc.

## Steps
1. Check (replaces test): list the facts to confirm, as a checklist at the top of the doc.
   Files: `docs/verification/m-10-day-1-check-in.md` - Change: add rows for M-01 (#4), M-07 (#10), M-09 (#12), each with issue state, merged PR, and evidence column left to fill.
2. Check: confirm issues and PRs with `gh issue view` and `gh pr list --state merged`; confirm `docs/spikes/migration-spike.md` exists and each unknown is marked works or fallback; confirm no throwaway code remains (no `apps/ai/src/spikes/`, `apps/web/src/spikes/`, `hitl-spike.html`, `spike-tool-stream.html`, `spike:hitl` script).
   Files: read-only on `docs/spikes/migration-spike.md`, `apps/*`, `package.json` - Change: record results in the doc.
3. Check: re-run sign-in on current `practices` (`pnpm dev`, email/password and GitHub, sign-out, signed-out agent call gives 401), following `docs/verification/m-09-web-sign-in.md`. Record pass/fail; if GitHub sign-in cannot be run locally, mark it unverified.
   Files: `docs/verification/m-10-day-1-check-in.md` - Change: add result and evidence.
4. Docs: write the risk list from the spike "Unknowns" and any check failure. Each risk: affected ticket, likelihood, proposed change to day 2 order or size.
   Files: `docs/verification/m-10-day-1-check-in.md` - Change: add "Risks for day 2" section and a one-line verdict against "Done when".

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` still exit 0 (no test runner in this repo)
- Doc shows issues #4, #10, #12 closed with merged PRs, spike doc present, and sign-in result
- "Risks for day 2" section exists, each risk names a day 2 ticket

## Deviations
- Step 3: sign-in (email/password, GitHub, 401 curl) was not run live. The worktree has no `.env` files and no Supabase credentials, and entering credentials is not allowed for the implementer. All seven checks are marked UNVERIFIED in the doc, with the code evidence that exists. The doc's verdict says sign-in is not confirmed. A human must run the table.
- Step 1/2: the doc was written once after the checks (checklist, results and risks in one file) instead of as a checklist first, since there is no test to fail first for a docs-only change.
- Done check: `pnpm test` was also run (requested by the caller); the repo has no `test` script, so it exits 1. `pnpm typecheck` was run as the plan lists.
