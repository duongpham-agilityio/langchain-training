# Plan: [F-07] Renderers: Markdown, Slack, store text, JSON, with limits

## Goal
Add pure render functions that turn one release object into GitHub Markdown, Slack text, App Store text, Google Play text and JSON. Each output is checked against its limit; over-limit input returns an error result with no text. One shared list of supported formats is used by the tool and the UI. `refs` appear only in JSON.

## Assumptions
- Rebased onto `practices` 8bf070e. F-01 is now there: `apps/ai/src/schemas/release.ts` defines `Release` (`version`, `date` yyyymmdd, `openingLine`, `changes[]`) and `Change` (`id`, `type`, `breaking`, `description`, optional `refs`). Use these types; do not redefine.
- `SLACK_MAX_CONTENT_LENGTH` exists in `apps/ai/src/constants/slack.ts` (35 000). Reuse it; do not redefine.
- No format list exists yet. Create it in `apps/ai/src/constants/`.
- No test runner (commit "remove unused test script and tests"). Per user decision, unit tests are skipped; Done check is typecheck and lint only.
- Typecheck and lint: `pnpm typecheck` and `pnpm lint` (root). `apps/ai` has no lint script.
- Renderers are pure code: LLM does not render (CLAUDE.md "render/validate/save/send stay deterministic code").

## Decisions (user)
1. Release object: wait for F-01 before implementing. Rebase onto the schema branch once it is in `practices`, then regenerate this plan.
2. Unit tests: skipped (no test runner). Done when "unit tests render one fixture" is NOT met; verify with typecheck and lint only, and say so in the PR.
- Release object shape (from F-01, not in this worktree): unconfirmed. Default: a local fixture type with `version`, `title`, `notes` and a `refs` array; replace with the F-01 type once merged.
- F-04 dependency: unconfirmed. Default: no code from F-04 is imported by this plan.
- `SLACK_MAX_CONTENT_LENGTH`: unconfirmed. Default: read the existing constant from the Slack integration module; do not redefine it. If it does not exist, stop and ask.
- Limits: App Store 4000 characters, Google Play 500 characters, Slack `SLACK_MAX_CONTENT_LENGTH`. Markdown and JSON have no limit (unconfirmed).
- Shared format list: unconfirmed location. Default: one exported constant in a shared module imported by both the render tool and the UI.
- Error result shape: unconfirmed. Default: a discriminated union `{ ok: true, text }` / `{ ok: false, error }`, with `text` absent on failure.

## Steps
1. Code: `RELEASE_FORMATS` constant (the one shared list, `as const`) and `RELEASE_FORMAT_LIMITS` (App Store 4000, Google Play 500, Slack = `SLACK_MAX_CONTENT_LENGTH`; Markdown and JSON absent).
   Files: `apps/ai/src/constants/release-formats.ts` (new), `apps/ai/src/constants/index.ts` (barrel export) - Change: add constants.
2. Code: pure renderers in `apps/ai/src/utils/render-release.ts`: `renderRelease(release: Release, format)` returns `{ ok: true, text }` or `{ ok: false, error }`. Markdown, Slack, App Store and Google Play text never include `refs`; JSON is `JSON.stringify(release)`. Over-limit returns `{ ok: false }` with no text, never sliced.
   Files: `apps/ai/src/utils/render-release.ts` (new), `apps/ai/src/utils/index.ts` (barrel export) - Change: renderers and limit check.
3. Code: typecheck and lint pass.
   Files: none - Change: fix any type errors in steps 1-2.
4. UI picker and tool wiring are out of scope for this step; the plan will be extended when the UI consumer is chosen.

## Done check
- `pnpm typecheck` and `pnpm lint` exit 0 (root). No test runner: unit-test check of the Done when is NOT met, say so in the PR.
- Behaviour check by code reading: `refs` appear only in JSON output; Google Play over-limit returns `{ ok: false }` with no text.
- No UI touched in this step; no preview needed.

## Deviations
- Step 1: `RELEASE_FORMAT_LIMITS` reuses `STORE_LIMITS` (`constants/store-limits.ts`, already holds 4000 / 500) and `SLACK_MAX_CONTENT_LENGTH` instead of repeating the literals. Why: one source for each limit, no duplicate values.
- Step 1: the same new file also exports `RELEASE_FORMAT_LABELS`, `RELEASE_CHANGE_TYPE_LABELS` and `RELEASE_BREAKING_LABEL`. Why: the renderers need section headings and the error message needs a format name; the plan named only two constants.
- Step 2: `renderRelease` also reads the existing `Release` type through `@/schemas` (type import). Not a deviation from the plan's intent; recorded because the plan named the type's source as F-01.
- Step 3 (environment, not code): `pnpm install --frozen-lockfile` was run in this worktree because `node_modules` was missing and `pnpm typecheck` failed without it. No dependency was added or changed.
