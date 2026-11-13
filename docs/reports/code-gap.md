# Code gap report: status after the GF fixes

Checked on `practices` @ 186c051 (all of #127 to #136 merged), 2026-11-13. Each status was read from the code on that commit, not taken from the PR title. `docs/reports/repro/run.sh` (typecheck, lint, build and the four repro scripts) passes.

The original review report with the full G-xx list was never committed. This file is rebuilt from the GF issues (#115 to #125), so it lists only the gaps those issues name: G-03, G-05, G-06, G-08, G-10, G-11, G-13, G-14, G-15, G-17, G-18. Any other G-xx from the original review is not covered here.

Vietnamese copy: [code-gap.vi.md](code-gap.vi.md).

## Status per gap

| Gap | Problem | Ticket | PR | Status | Evidence on `practices` |
| --- | --- | --- | --- | --- | --- |
| G-03 | Draft tool throws on a failed version read; raw DB text reaches the chat | #115 (GF-02) | #128 | fixed | `tools/release-notes-preview.ts` returns `ok: false` with `RELEASE_NOTES_VERSION_ERROR`; real error logged on the server |
| G-05 | Old thread opens empty after a server restart | #122 (GF-16) | #133 | fixed (code); live restart not re-checked | `runner/checkpoint-agent-runner.ts` replays `toAguiMessages(state.values.messages)`; repro 122: owner gets `MESSAGES_SNAPSHOT` with tool calls, other user gets 0 events |
| G-06 | Server ignores the draft on screen (`input.context`) | #117 (GF-10) | #135 | fixed | `agui/index.ts` reads `findDraftContext(input.context)`; repro 117 prints `true` |
| G-08 | Format names like "GitHub" or "App Store" refused | #116 (GF-09) | #127 | fixed | alias map `RELEASE_FORMAT_ALIASES` applied before the allowed-list check |
| G-10 | `threads.updated_at` written once | #120 (GF-14) | #131 | fixed | `touchThread` called from the thread gate; repro 119-120: `updated>created=true`, "updated_at moved" |
| G-11 | New chat shows its UUID; row missing after a failed title or blocked first turn | #120 (GF-14), #121 (GF-15) | #131, #132 | fixed | repro 119-120: row exists, titled later; repro 121: sidebar shows "New chat" for id and empty title |
| G-13 | Any signed-in user can read and continue a thread by id | #119 (GF-13) | #131 | fixed | `identifyUser` on `CopilotRuntime`; repro 119-120: second user gets `RUN_ERROR`, graph state not read |
| G-14 | A retry stores the user message twice | #118 (GF-12) | #130 | fixed | `toLangChainMessages` passes the AG-UI `id` to `HumanMessage`. No script in the repo covers it (the `agent-gaps` G-14 block was never committed) |
| G-15 | Web decides "today" in America/New_York, server stamps the browser zone | #123 (GF-17) | #129 | fixed | web uses `getBrowserTimeZone()` in `release-title.ts` and the recency grouping; `RELEASE_NOTES_DEFAULT_TIME_ZONE` gone from web |
| G-17 | Constants and schemas copied by hand between `apps/ai` and `apps/web` | #124 (GF-18) | #136 | fixed | `packages/contracts` (`@training/contracts`) used by both apps; `PLATFORM_CHARACTER_LIMITS` removed. The three server routes with no web caller were kept and documented in `apps/ai/CLAUDE.md` |
| G-18 | Docs and comments point at things that do not exist (Mastra, deleted migration) | #121 (GF-15, web comments), #125 (GF-19) | #132, #134 | fixed | no `Mastra` or `tripwire` left in `apps/*/src`; `apps/ai/CLAUDE.md` updated |

## Still open (not a gap fix, tracked in their own issues)

| Item | Why it is open | Issue |
| --- | --- | --- |
| `release_history` / `release_sends` migration not applied to the dev Supabase database | Needs a person with access to the dev project; the draft tool's version lookup fails there until it is applied | #109 |
| History routes still read and write the old flat columns; nothing reads `release_sends`; `GET /release-history` fails on a database with the new schema | Feature work (F-11, F-12), outside the gap fixes | #80, #81 |
| Draft card / Live Preview on the new result shape (F-10) | Feature work | #79 |
| Answer-quality checks on the release object (F-14) | Feature work | #83 |
| No permanent checks: the repro blocks are not tests | No test runner yet | #70 |

## Permanent checks (to build once #70 lands, not built now)

- 117: draft context block lands on the latest human message only and never in the checkpoint.
- 119-120: second owner refused; `updated_at` moves; row exists after a failed title call.
- 122: restarted runner replays messages and tool calls for the owner only.
- 121: `ThreadListItem` shows "New chat" for a UUID or empty title.
- Missing today and worth adding: G-08 aliases, G-14 single stored human message, G-15 "Today" for a 22:00 Los Angeles release, G-03 `ok: false` on a bad stored version.

## Not verified

- No live browser run was done for this report. Not covered: G-05 after a real `pnpm dev:ai` restart, the two-account check for G-13, and the Slack draft flow of #109.
- #130 noted that the `renderReleaseNotesPreview` card showed "sent unusable data" when the model called the tool with a streamed preview; not re-checked here.
