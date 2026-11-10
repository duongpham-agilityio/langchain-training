# M-32 Final run-through against the intent: verification

Issue #35. Checked on 2026-11-10 against `practices` at `fef3fca` (PR #64).

**Verdict: NOT complete. Code for every in-scope feature is present except tracing and answer-quality checks, which are open tickets (#32, #33). No feature could be run live: this worktree has no `.env` files (reading and copying them is blocked), so nothing was exercised against Supabase, OpenAI or Slack. #35 should stay open until the live run is done.**

## Dependency state

| Ticket | State |
|--------|-------|
| M-01 to M-28 (#4 to #31) | CLOSED (merged) |
| M-21 Day 2 end-to-end check (#24) | OPEN. Its last run (2026-11-09) failed at save to History (DB host unreachable over IPv6), so steps 5 and 7 were never confirmed |
| M-29 tracing (#32) | OPEN; config only (`config.ts` reads LangSmith key and project), no tracing wired |
| M-30 answer-quality checks (#33) | OPEN; no evaluator code |
| M-31 error and recovery UI (#34) | OPEN |

## Checklist (intent scope)

Code = traced in source only. Live = needs env, UNVERIFIED here.

| # | Feature | Code present | Live |
|---|---------|--------------|------|
| 1 | Sign-in, email/password and GitHub | Yes: `apps/web/src/lib/auth/supabase-auth-service.ts`, `SignInPage.tsx`; server `middlewares/auth.ts` | UNVERIFIED here (verified earlier in `m-09-web-sign-in.md`) |
| 2 | Paste git log/PR, classify, count-only summary | Yes: `skills/`, `tools/load-skill.ts` | PASS on 2026-11-09 (`m-21` doc) |
| 3 | Draft for any destination | Yes: `tools/release-notes-preview.ts` | PASS on 2026-11-09 (Slack); other destinations UNVERIFIED |
| 4 | Live Preview and draft card | Yes: `agui/`, web `release-notes` components | PASS on 2026-11-09 |
| 5 | Automatic title and date | Yes: `utils/release-title.ts` | UNVERIFIED |
| 6 | Markdown export | Yes: web `RawMarkdownView.tsx` | UNVERIFIED |
| 7 | Slack publish from chat | Yes: `tools/publish-release-notes-to-slack.ts` with approval middleware | PASS on 2026-11-09 |
| 8 | Slack publish from History | Yes: `routes/slack.ts` | BLOCKED by save failure below |
| 9 | Release History: save, search, filter, detail | Yes: `routes/release-history.ts`, `db/release-history.ts` | FAIL on 2026-11-09 (save 500, DB unreachable); not re-run |
| 10 | Multiple threads, generated titles | Yes: `routes/threads.ts`, `utils/schedule-thread-title.ts` | UNVERIFIED |
| 11 | Conversation memory (recent kept, older summarized) | Yes: `middlewares/summarization.ts` | UNVERIFIED |
| 12 | Prompt-injection guard | Yes: `utils/prompt-injection-guard.ts`, wired in `index.ts` | UNVERIFIED |
| 13 | PII redaction | Yes: `middlewares/pii.ts` | UNVERIFIED |
| 14 | Model fallback | Yes: `middlewares/model-fallback.ts`, outermost in the agent | UNVERIFIED |
| 15 | Answer-quality checks | No (#33 open) | Cut candidate, first in the intent's cut line |
| 16 | Error and recovery UI | Partial (#34 open) | Pending |
| (not in scope list, in the epic) Tracing | No (#32 open) | Cut candidate, second in the cut line |

## Static checks

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: exit 0
- `pnpm test`: no script (no test runner in this repo)

## Gaps / next

1. Live run of rows 1 to 14 with real env, after switching `DATABASE_URL` to the Supabase session pooler (IPv4) so History works (from the #24 finding).
2. Land or formally cut #32, #33, #34. If cut, name them in the PR (done below).
3. Carry-over from #24: version/title not applied from a plain chat request, and the agent asks for a destination although the first message named one. Neither has an issue yet.

No code was changed and no issues were opened.
