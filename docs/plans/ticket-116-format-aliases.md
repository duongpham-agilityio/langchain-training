# Plan: Accept the format names users actually say

## Goal
The preview tool normalizes the requested format (trim, lower-case, spaces/underscores to `-`, alias map) before the allowed-list check, so `github`, `GitHub`, `App Store`, `google play` render and `discord` is still refused with `supportedFormats`. Prompt wording matches the real list.

## Assumptions
- Aliases exactly as in the issue: `github`, `gh` to `markdown`; `html`, `email` to `html-email`; `appstore` to `app-store`; `googleplay`, `play` to `google-play`. Alias lookup runs after separator normalization, so `App Store` gives `app-store` (valid directly) and `app_store` too.
- Collapse runs of spaces/underscores into one `-`.
- No test runner exists in the repo; the "test" is a tsx script calling the tool for the five names plus `discord` (the `ai-contract` G-08 block is not in this checkout).
- Alias map lives in `constants/release-formats.ts` (one concern per folder, no inline magic values).
- `LOOP` wording lists the real formats instead of "GitHub, App Store, Slack, or anything else"; the "no platform named" rule is otherwise unchanged. The `SYSTEM_PROMPT` doc comment loses the "use the time tool" sentence.
- GF-02 edits the same tool file; keep the diff to the normalization lines to ease merging.

## Steps
1. Test: script calling the tool with `github`, `GitHub`, `App Store`, `google play`, `discord`; fails today for the first four.
   Files: scratch script (not committed) - Change: none in repo.
2. Code: alias map and `normalizeReleaseFormat` helper; tool uses it before `isReleaseFormat`.
   Files: `apps/ai/src/constants/release-formats.ts`, `apps/ai/src/tools/release-notes-preview.ts` - Change: add `RELEASE_FORMAT_ALIASES`; replace the lower-case line with the helper; keep refusal text and `supportedFormats`.
3. Code: prompt wording and stale comment.
   Files: `apps/ai/src/constants/prompts.ts`, `apps/ai/CLAUDE.md` - Change: replace "(GitHub, App Store, Slack, or anything else)" with the real list (Markdown, Slack, App Store, Google Play, JSON, HTML email); drop "(use the time tool)"; note aliases in the tools bullet.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0 (no `pnpm test` script exists)
- The script prints `ok=true` for the four names and `ok=false` with `supportedFormats` for `discord`
