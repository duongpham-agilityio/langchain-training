# Plan: [M-14] Preview tool `renderReleaseNotesPreview`

## Goal
`apps/ai` has a `renderReleaseNotesPreview` tool taking the web draft shape, returning the draft with date and title filled automatically; bad input fails the schema with a clear error; `get_current_time` and its schema are gone.

## Assumptions
- Unconfirmed (Q1): web helpers are copied into `apps/ai`; same time zone `America/New_York` and title prefix `Release Notes - #`.
- Unconfirmed (Q2): returns a JSON string `{ ...draft, releaseDate, heading }`; `releaseDate` = given value or today (yyyymmdd); `heading` = `titleOverride` or `Release Notes - #<releaseDate>`.
- Schema is a zod v4 port of `ReleaseNotesDraftSchema` (apps/web/src/types/release-notes-draft.ts), descriptions kept verbatim via a `joinLines` util.
- Repo has no test runner; "Test" step is a scripted check in the scratchpad (not committed).
- M-12 not merged; not needed. `SYSTEM_PROMPT` untouched.

## Steps
1. Test: scratchpad `tsx` script that imports the tool: valid input returns JSON with `releaseDate` (8 digits) and `heading`; explicit `releaseDate` and `titleOverride` are honoured; empty `content` and bad `releaseDate` (`2026-09-01`) are rejected with a zod error naming the field. Must fail before step 2-4.
   Files: scratchpad only.
2. Code: constants + util.
   Files: `apps/ai/src/constants/release-notes.ts` (+ barrel export) - `RELEASE_NOTES_TITLE_PREFIX`, `RELEASE_NOTES_TIME_ZONE`, tool description; `apps/ai/src/utils/text.ts`, `apps/ai/src/utils/release-title.ts`, `apps/ai/src/utils/index.ts` - `joinLines`, `formatReleaseDate`, `buildReleaseTitle`.
3. Code: schema and tool.
   Files: `apps/ai/src/schemas/release-notes-draft.ts` (+ barrel); `apps/ai/src/constants/tools.ts` - replace `getCurrentTime` with `renderReleaseNotesPreview`; `apps/ai/src/tools/release-notes-preview.ts`; `apps/ai/src/tools/index.ts` - register.
4. Code: remove sample tool.
   Files: delete `apps/ai/src/tools/time.ts`, `apps/ai/src/schemas/time.ts`; drop from barrels.
5. Docs: update `apps/ai/CLAUDE.md` if it mentions the sample tool or the layout (add `utils/`).

## Done check
- `pnpm --filter @training/ai typecheck` and `pnpm --filter @training/ai build` exit 0 (`pnpm test` does not exist; no lint in `apps/ai`)
- Step 1 script passes
- `git grep -n "getCurrentTime\|get_current_time" apps` returns nothing
