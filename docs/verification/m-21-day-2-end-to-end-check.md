# M-21 Day 2 end-to-end check: verification

Issue #24. Done when: the whole Day 2 flow is run once on the unchanged UI and each step is recorded pass/fail. Checked on 2026-11-09 against `practices` at merge commit `7567060` (PR #56, Slack publish tool).

**Verdict: the whole run was NOT performed. Every code path for the flow exists and `pnpm lint`, `pnpm typecheck` and `pnpm build` pass, but the worktree has no `apps/ai/.env` or `apps/web/.env` (Supabase, model and Slack settings), so the app cannot start and all live rows are UNVERIFIED. No UI change was made. The run must be repeated by hand with real env values before #24 can be closed.**

## Setup

- Dev test account: use the dev test account for local sign-in on `http://localhost:5173/` (credentials are not recorded here).
- Env: `apps/ai/.env` and `apps/web/.env` copied from the `.env.example` files with real Supabase and model keys. `SLACK_WEBHOOK_URL` set locally to a throwaway test channel; never commit it.
- Start: `pnpm dev` from the repo root.
- Not available in this check: both `.env` files are absent from the worktree, so `apps/ai/src/config.ts` fails at startup. Env files are also blocked for the checker by `.claude/settings.json`.

## 1. Dependencies

| Issue | State | Merged PR / evidence |
|-------|-------|----------------------|
| M-16 #19 count-only summary | CLOSED | PR #53 |
| M-18 #21 history endpoints | CLOSED | `gh issue list` |
| M-19 #22 Slack endpoint | CLOSED | commit `2994611` |
| M-20 #23 Slack tool with confirmation | CLOSED | PRs #55, #56 |

## 2. Checklist

| # | Step | Expected | Backing issue and code present | Result | Evidence |
|---|------|----------|--------------------------------|--------|----------|
| 1 | Sign in with the dev test account | Dashboard shown | M-09 #12; `apps/web/src/routes/SignInPage.tsx` | UNVERIFIED | Needs Supabase env; app cannot start |
| 2 | Paste a git log in chat | Message accepted, agent replies | M-11/M-12 #14/#15; `apps/web/src/components/chat` | UNVERIFIED | Needs server and model key |
| 3 | Count-only summary | Counts only, no full notes | M-16 #19; `apps/ai/src/tools/` and skills | UNVERIFIED | Needs model key |
| 4 | Streamed preview card | Card builds up while streaming | M-14/M-15 #17/#18; `apps/ai/src/tools/release-notes-preview.ts` | UNVERIFIED | Needs model key |
| 5 | Save to History | Release appears in `HistoryPage` | M-17/M-18 #20/#21; `apps/ai/src/routes/release-history.ts`, `apps/web/src/services/save-release-history.ts`, `apps/web/src/hooks/use-archive-release.ts`, `apps/web/src/routes/HistoryPage.tsx` | UNVERIFIED | Needs Supabase DB |
| 6 | Publish to Slack from chat | Confirmation card shown, message posted after approve | M-19/M-20 #22/#23; `apps/ai/src/tools/publish-release-notes-to-slack.ts`, `apps/ai/src/routes/slack.ts`, `apps/web/src/components/chat/SlackPublishConfirmCard.tsx` | UNVERIFIED | Needs model key and test webhook |
| 7 | Publish to Slack from History | Message posted | M-19 #22; `apps/web/src/services/publish-to-slack.ts`, `apps/web/src/hooks/use-send-release-to-slack.ts` (used in `HistoryPage.tsx`) | UNVERIFIED | Needs Supabase and test webhook |

Code check: no row has missing code; every file named above exists on `practices`.

## 3. Static checks (run in this worktree)

- `pnpm lint` exit 0
- `pnpm typecheck` exit 0
- `pnpm build` exit 0
- `pnpm test`: no script, exits 1 (no test runner in this repo).

## Gaps

No small gap was found, so no code was changed. No new GitHub issues were opened: nothing failed, the rows are only unrun. The one open item is the missing env, so the live run is still to be done by hand.
