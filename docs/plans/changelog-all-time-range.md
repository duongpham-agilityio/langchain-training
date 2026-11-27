# Plan: Let the changelog tool answer for all releases without asking for a range

## Goal
When the user asks for all releases of the project, the agent calls `getChangelog` for the full range and answers from the returned releases. It never asks for a time range again.

## Assumptions
- Source: bug report `docs/bug-reports/changelog-all-time-range.md`. No ticket id, so the plan is built from the report path. Its questions are unconfirmed.
- Unconfirmed: live chat run not done. The worktree has no `apps/ai/.env`, and the code-level probe is the only observed evidence. The exact agent loop is inferred from the tool and prompt code.
- Unconfirmed: the all-time value is a `period` entry (`all_time`), so the tool keeps one-of-four input rules. Alternative (not chosen): make empty input mean all time. That would weaken the "exactly one" rule tested today.
- Unconfirmed: all-time range is `from` `00000000` to `to` `99999999`, which covers every `YYYYMMDD` release date. The date is a plain string compare in `buildChangelogQuery`, so no change there.
- The tool still returns at most `CHANGELOG_TOOL_LIMIT` releases with `truncated: true`; the prompt already tells the model to say the list is partial.
- No new dependency.

## Steps
1. Test: unit tests in `apps/ai/src/utils/changelog-range.test.ts` for the new period. `resolveChangelogRange({ period: "all_time" }, now, HCM)` returns `{ from: "00000000", to: "99999999" }`. Also `{ period: "all_time", month: "2026-09" }` still throws (exactly one rule), and the existing `{}` rejection stays. Today the first assertion fails with "Unknown period."
   Files: `apps/ai/src/utils/changelog-range.test.ts` - Change: add an `it` for `all_time` and one more `it.each` input that combines `all_time` with another field.
2. Code: add the value and its resolution.
   Files: `apps/ai/src/constants/tools.ts` - Change: add `"all_time"` to `CHANGELOG_PERIODS`; update `GET_CHANGELOG_DESCRIPTION` to say `period` also takes `all_time` (every saved release, any date).
   Files: `apps/ai/src/utils/changelog-range.ts` - Change: add `case "all_time":` in the `switch`, returning `{ from: "00000000", to: "99999999" }`. Keep the "exactly one" check as is.
   Files: `apps/ai/src/schemas/changelog-tool.ts` - Change: update the `period` `.describe(...)` text to mention `all_time` (all releases). The enum comes from `CHANGELOG_PERIODS`, so no other schema edit.
3. Prompt: make the model use `all_time` instead of asking.
   Files: `apps/ai/src/constants/changelog-qa.ts` - Change: in step 1 of "Questions about past releases", add: when the user asks for all releases or every release, or says all after being asked for a period, call `getChangelog` with `period: "all_time"`. Do not ask for a time range again once the user has asked for all. Keep the rest of the rule.
4. Docs: keep the architecture note in sync.
   Files: `apps/ai/CLAUDE.md` (the "Changelog tool (F-28)" line) - Change: list `all_time` in the accepted `period` values.

## Done check
- `pnpm test`, `pnpm lint`, `pnpm build` all exit 0
- The new `changelog-range.test.ts` cases pass: `all_time` resolves to the full `YYYYMMDD` range; `all_time` combined with another field is rejected; `{}` is still rejected.
- Live chat run NOT done (no `apps/ai/.env` in the worktree; the user chose to continue without it). The prompt change in step 3 is verified only by reading it, not by a model run. Say so in the PR.
- No UI touched: no storybook or preview check needed.
