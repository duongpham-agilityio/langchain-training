# Ticket 17: [M-14] Preview tool `renderReleaseNotesPreview`

## What it asks
Feature (server). Add the `renderReleaseNotesPreview` tool to `apps/ai`: name in `TOOL_NAMES`, zod v4 schema, `tool(...)`, registered in `tools/index.ts`. Input is the web `ReleaseNotesDraftSchema` shape. Title and date are filled automatically by reusing the existing helpers. Remove the sample `get_current_time` tool and its schema.
Done when: the tool returns a valid draft; invalid input is rejected by the schema with a clear error; sample tool is gone.

## What's ambiguous
- "reusing the existing helpers": the helpers (`formatReleaseDate`, `buildReleaseTitle` in `apps/web/src/lib/release-notes/release-title.ts`) live in the web app; `apps/ai` cannot import them (no shared package).
- "Input shape is what the web `release-notes-draft` type expects": web uses `.nullish()` fields; the spike (docs/spikes/migration-spike.md, A) says the stock bridge rejects them, but Route B keeps the server tool with the full schema.
- "returns a valid draft": the return format is not stated (object vs JSON string vs title line).
- "Depends on M-12": M-12 (dynamic prompt) is not merged; the tool does not need it to exist.

## First step
Port the web schema and the title/date helpers into `apps/ai` (constants, schema, small util), then build the tool on them.

## Clarifying questions
1. Can the web helpers be copied into `apps/ai` instead of extracted to a shared package?
   Default assumption: yes, copy (minimal port, same behaviour, same `America/New_York` zone and `Release Notes - #` prefix). Correct?
   Answer: _(pending)_
2. What should the tool return?
   Default assumption: a JSON string of the draft with `releaseDate` resolved (given value or today) plus `heading` (the composed title line); no side effects. Correct?
   Answer: _(pending)_
