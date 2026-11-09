# Plan: [M-21] Day 2 end-to-end check

## Goal
Run the whole Day 2 flow once on the unchanged UI (sign in, paste log, count summary, preview card, save to History, publish to Slack from chat and from History), record each step as pass/fail in one verification doc, fix small gaps, and open new issues for bigger ones.

## Assumptions
- Unconfirmed: "small gap" means a fix of a few lines in one or two files with no schema, API-shape or UI-layout change; anything bigger becomes a new GitHub issue.
- Unconfirmed: Slack publish posts to a throwaway test channel via a locally set `SLACK_WEBHOOK_URL`; the URL is never committed.
- Unconfirmed: result is recorded in `docs/verification/m-21-day-2-end-to-end-check.md` and summarised in the PR description with links to new issues.
- Dev test account for sign-in was given by the user in chat. It is not written to any file or doc; the doc says "dev test account" only. The implementer gets it from the caller prompt.
- This is a verification chore: no automated test can fail first, and the repo has no test runner. The "test" is a checklist of facts to confirm, modelled on `docs/verification/m-09-web-sign-in.md`.
- Env files (`apps/ai/.env`, `apps/web/.env`) are blocked by `.claude/settings.json`; real Supabase/Slack/model keys may be missing in the worktree. Any step that cannot run is marked UNVERIFIED with the reason, as in `docs/verification/m-10-day-1-check-in.md`.
- Dependencies M-16, M-18, M-20 and the Slack work (tickets 21, 22, 23) are merged on the base branch `practices` (latest merge is PR #56, Slack publish tool); verify with `gh`.

## Steps
1. Check (replaces test): write the checklist table first.
   Files: `docs/verification/m-21-day-2-end-to-end-check.md` - Change: setup section plus rows: sign in; paste a git log; count-only summary; streamed preview card; save to History (appears in `HistoryPage`); publish to Slack from chat (confirmation shown, message posted); publish to Slack from History. Columns: step, expected, result, evidence.
2. Check: confirm dependencies and code paths exist.
   Files: read-only on `apps/ai/src/tools/` (`release-notes-preview.ts`, `publish-release-notes-to-slack.ts`), `apps/ai/src/routes/` (`release-history.ts`, `slack.ts`), `apps/web/src/services/` (`save-release-history.ts`, `publish-to-slack.ts`), `apps/web/src/routes/HistoryPage.tsx`, `apps/web/src/components/chat`, `history` - Change: note in the doc which merged issue backs each row; flag any row whose code is missing.
3. Check: run the flow. Start `pnpm dev`, drive the web app in the browser pane with the dev test account, run each row, capture console/network evidence. Keep the UI unchanged.
   Files: `docs/verification/m-21-day-2-end-to-end-check.md` - Change: fill result and evidence per row; mark UNVERIFIED with reason where env or credentials are missing.
4. Code (only if a small gap shows): fix it in the smallest place, with a note in the doc.
   Files: whichever file the gap is in (expected under `apps/ai/src` or `apps/web/src`) - Change: minimal fix; re-run the failed row.
5. Docs: for each bigger gap, create a GitHub issue with `gh issue create` (title, repro row, suspected area) and link it in the doc. Write a one-line verdict against "Done when".
   Files: `docs/verification/m-21-day-2-end-to-end-check.md` - Change: add "Gaps" section and verdict.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0 (no test runner in this repo)
- Every checklist row has pass, fail-with-issue-link, or UNVERIFIED-with-reason
- Verdict states whether the whole run passes on the unchanged UI
- No credentials, webhook URL or token appears in the doc or any committed file

## Deviations
- Step 3: the flow was not run. Both `.env` files are absent from the worktree (and blocked for reading), so the server cannot start. All live rows are marked UNVERIFIED with the reason, as the plan allows. Static checks were run instead.
- Step 5: no GitHub issues created, because no row failed; the missing env is recorded in the doc under Gaps and the verdict.
