# Plan: [F-09] Draft tool takes a release object and a format

## Goal
`renderReleaseNotesPreview` takes the changes of a release plus the format the user asked for. Code computes the version and fills the date, renders only that format, and returns the release object, the rendered text and a hash of the object. An unknown format (for example "Discord") is refused with the supported list; an over-limit result returns the error and no text. The system prompt (`RELEASE_FLOW`) and the `platform-formatting` skill stop the agent writing per-destination text. Scope: `apps/ai` only.

## Assumptions
- Base: `practices` at 8f3fc14. F-03 (`apps/ai/src/schemas/release.ts`), F-05 (`nextVersion` in `apps/ai/src/utils/version-bump.ts`), F-07 (`renderRelease`, `RELEASE_FORMATS` in `apps/ai/src/constants/release-formats.ts`) and F-08 (`renderReleaseEmail`) are all present.
- Confirmed with the user: `html-email` is added to `RELEASE_FORMATS`. The tool renders it with `renderReleaseEmail` and returns the `html` as `text` plus the `subject`.
- Confirmed with the user: only `apps/ai` changes in this ticket. `apps/web` (`ReleaseDraftCard`, `use-release-draft`, which read the old tool output) is left for another ticket.
- Confirmed with the user: hash = SHA-256 hex of the JSON of the release object (including `version` and `date`). Tool input = `openingLine`, `changes`, `format`, and optional `version` and `date` (a version or date the user stated in chat). `previousVersion` comes from `getLatestReleaseVersion(pool, userId)`, with `userId` read from `userContext`.
- Unconfirmed: limits are the ones already in `RELEASE_FORMAT_LIMITS` (Slack 35 000, App Store 4000, Google Play 500); `html-email` and `json` and `markdown` have none.
- Unconfirmed: asking for another format re-renders the same object because the agent copies `release` from the previous tool result (with its `version` and `date`) into the next call. The hash lets the result prove the object is the same. Code does not store the object between calls.
- Unconfirmed: the answer-quality evaluators (`draft-structure`, `grounded-items`) keep reading a `{platform, label, content}` draft. `agui/index.ts` maps the new tool result to that shape (`platform` = format id, `label` = format label, `content` = `text`) so they keep working. Rewriting the evaluators for the object is not part of this ticket.
- No test runner exists (`CLAUDE.md`). The Done check uses `typecheck` and `build`; behaviour is checked with a throwaway script run with `tsx`, not committed.

## Steps
1. Code: add `html-email` to the shared format list and its renderer.
   Files: `apps/ai/src/constants/release-formats.ts`, `apps/ai/src/utils/render-release.ts` - Change: add `"html-email"` to `RELEASE_FORMATS`, a label ("HTML email"), no limit; add a `RENDERERS` entry that returns `renderReleaseEmail(release).html`.
2. Code: new input schema for the tool.
   Files: `apps/ai/src/schemas/release-notes-preview.ts` (new), `apps/ai/src/schemas/index.ts`; remove `apps/ai/src/schemas/release-notes-draft.ts` and its export (its only user is the tool) - Change: `ReleaseNotesPreviewInputSchema` = `format` (free string, so an unknown name reaches the code and is refused with the list), `openingLine`, `changes` (from `ChangeSchema`), optional `version` (`RELEASE_VERSION_PATTERN`) and optional `date` (`RELEASE_NOTES_DATE_PATTERN`). Descriptions tell the agent when to set `version` and `date` (only when the user named them) and to copy `release` from the previous result when re-rendering.
3. Code: object hash helper.
   Files: `apps/ai/src/utils/hash-release.ts` (new), `apps/ai/src/utils/index.ts` - Change: `hashRelease(release)` = SHA-256 hex (`node:crypto`) of `JSON.stringify` of the release after `ReleaseSchema.parse`, so key order is fixed.
4. Code: rewrite the tool as a factory that takes the Pool.
   Files: `apps/ai/src/tools/release-notes-preview.ts`, `apps/ai/src/tools/index.ts`, `apps/ai/src/agent/index.ts`, `apps/ai/src/index.ts` - Change: `createRenderReleaseNotesPreview(pool)`; resolve `previousVersion` with `getLatestReleaseVersion(pool, userId)` (null when there is no user context), `version = nextVersion(previousVersion, changes, input.version)`, `date = input.date ?? formatReleaseDate()`; build and parse the release; unknown format returns `{ ok: false, error, supportedFormats }`; otherwise `renderRelease` (and `renderReleaseEmail` for the `subject`); over-limit returns `{ ok: false, error, release, hash }` with no text; success returns `{ ok: true, release, format, text, hash, subject? }`. `tools/index.ts` exports `createTools(pool)`; `createBaseAgent` takes `pool` and passes it; `index.ts` passes `pgPool`.
5. Code: keep the evaluators fed.
   Files: `apps/ai/src/agui/index.ts` - Change: where the tool result is parsed into `draft`, map an `ok: true` result to `{ platform: format, label: RELEASE_FORMAT_LABELS[format], content: text }`; any other result leaves `draft` unset.
6. Code: prompt, tool description, skill.
   Files: `apps/ai/src/constants/release-notes.ts` (`RELEASE_NOTES_PREVIEW_DESCRIPTION`), `apps/ai/src/constants/prompts.ts` (`RELEASE_FLOW`), `apps/ai/src/skills/platform-formatting.ts`, `apps/ai/src/skills/release-reporting.ts` (last line asks for a destination: ask for a format), `apps/ai/CLAUDE.md` if it describes the old tool - Change: the agent builds the release object once (opening line, typed changes with one-sentence descriptions and refs from the input), names the format, and calls the tool once; it never writes per-destination text or lists free-form destinations; on `ok: false` with `supportedFormats` it tells the user the supported list; for another format it copies `release` from the last result unchanged; the Slack section sends the `text` of a rendered `slack` result. `platform-formatting` documents the supported formats and the object fields instead of per-destination markup.

## Done check
- `pnpm --filter @training/ai typecheck` exits 0
- `pnpm --filter @training/ai build` exits 0
- `pnpm lint` exits 0 (if the root script reaches `apps/ai`; report if it does not)
- Throwaway `tsx` script (not committed) with a fixture release: every supported format renders and the same changes give the same hash for two formats; `"Discord"` returns `ok: false` with the supported list; a Google Play result over 500 characters returns `ok: false` and no text.
- UI touched: no.

## Deviations
- Step 4: `createBaseAgent` signature is `createBaseAgent(pool, options?)` (pool as first positional argument) instead of putting `pool` in the options object; it is required, not optional.
- Done check: worktree had no `node_modules`; ran `pnpm install --frozen-lockfile` (no dependency change). `pnpm lint` reports a cached run from the web app only (`apps/ai` has no lint script).
