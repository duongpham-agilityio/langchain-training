# M-21 Day 2 end-to-end check: verification

Issue #24. Done when: the whole Day 2 flow is run once on the unchanged UI and each step is recorded pass/fail. Checked on 2026-11-09 against `practices` at merge commit `7567060` (PR #56, Slack publish tool).

**Verdict: the run is NOT complete. Steps 1 to 4 and 6 pass live. Step 5 (save to History) fails with HTTP 500 because the database host is unreachable from this machine, so steps 5 and 7 are blocked. #24 should not be closed yet.**

## Setup

- Dev test account for local sign-in (credentials are not recorded here).
- Env: `apps/ai/.env` and `apps/web/.env` copied from the main checkout (git-ignored).
- Agent server: `pnpm --filter @training/ai dev` on `:4000`. Web: `pnpm --filter release-copilot dev --port 5175`, because `:5173` was taken by another process. The server allows only `AI_CORS_ORIGIN=http://localhost:5173`, so it was started with `AI_CORS_ORIGIN=http://localhost:5175` set in the shell (no file changed).
- Browser: headless Playwright, screenshots in `docs/verification/screenshots/`.

## 1. Dependencies

| Issue | State | Merged PR / evidence |
|-------|-------|----------------------|
| M-16 #19 count-only summary | CLOSED | PR #53 |
| M-18 #21 history endpoints | CLOSED | `gh issue list` |
| M-19 #22 Slack endpoint | CLOSED | commit `2994611` |
| M-20 #23 Slack tool with confirmation | CLOSED | PRs #55, #56 |

## 2. Checklist

| # | Step | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 1 | Sign in with the dev test account | Dashboard shown | PASS | Signed-out `/` redirected to `/sign-in`; sign-in landed on the dashboard showing the account email |
| 2 | Paste a git log in chat | Message accepted, agent replies | PASS | 5-line log accepted, agent replied (`m-21-chat-after-paste.png`) |
| 3 | Count-only summary | Counts only, no full notes | PASS | "Features: 2, Docs: 1, Internal: 2, Total: 5", then asked for a destination (`m-21-chat-after-paste.png`) |
| 4 | Streamed preview card | Card appears and opens in the preview panel | PASS | "Release notes / Slack" card and RELEASE_NOTES.md panel (`m-21-chat-slack-draft.png`) |
| 5 | Save to History | Release appears in History | FAIL | `POST /release-history` returned 500; toast "Couldn't archive release notes" (`m-21-after-archive.png`). Server log: `connect EHOSTUNREACH 2406:da12:...:5432` from `saveReleaseHistory` in `apps/ai/src/db/release-history.ts` |
| 6 | Publish to Slack from chat | Confirmation card, message posted after approve | PASS | "Send to Slack" opened the card "Publish 'Slack' release notes to Slack?" with Approve and Reject (`m-21-slack-confirmation.png`). After Approve the agent replied "Release notes published to Slack." and the message was received in Slack (confirmed by the user) (`m-21-slack-published.png`) |
| 7 | Publish to Slack from History | Message posted | BLOCKED | Needs a saved release (step 5) |

## 3. Static checks

- `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0
- `pnpm test`: no script, exits 1 (no test runner in this repo)

## 4. Gaps

1. **Save to History fails (step 5), environment.** The Postgres host resolves to an IPv6 address only and this machine has no IPv6 route. Likely fix: use the Supabase session pooler connection string (IPv4) as the database URL in `apps/ai/.env`. No code change is needed. Re-run steps 5 and 7 after that.
2. **Version and title are not applied from a plain request (small).** "Set version 1.0.0 and title ..." only got "Understood" and the preview card did not change, so Archive stayed disabled ("Ask Release Builder for a version and title to archive"). Archive enabled only after "Regenerate the Slack release notes draft now, with version 1.0.0 and title ...". Likely a prompt or tool-use gap in the agent.
3. **Agent asked for a destination although the first message said "for Slack" (small).** Answering "Slack" fixed it.
4. **Thread list returns 404.** `GET /api/memory/threads` is not implemented on the new server; the sidebar shows the raw thread id and the console logs repeated errors. This belongs to Day 3 (threads, M-22 and later), not Day 2.
5. **CORS origin is hard-wired to `:5173`.** Any other web port fails until `AI_CORS_ORIGIN` is overridden.

No code was changed. Gaps 2 and 3 are candidates for new issues; none have been opened yet.
