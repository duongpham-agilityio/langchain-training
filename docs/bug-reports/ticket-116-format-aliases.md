# Bug: Preview tool refuses format names users actually say ("GitHub", "App Store")
Status: REPRODUCED

## Environment
- Branch / commit: fix/gf-09-format-aliases @ c89c3d5 (practices, includes PR #114 ignore-case)
- Versions: Node 22.22.2, tsx via pnpm, macOS
- Source: GitHub issue #116 (GF-09, gap G-08)

## Setup
1. `pnpm install --frozen-lockfile`
2. No `launch.json` entry starts the AI server (only `dev` = web, `storybook`), and the server needs Supabase/OpenAI env. The tool is a pure function over the format string, so the repro calls `createRenderReleaseNotesPreview` directly with `tsx` and dummy env vars (`OPENAI_API_KEY`, `SUPABASE_*`, `DATABASE_URL`) and a null pool (no user context, so no DB read).
Setup notes: no AI server entry in `.claude/launch.json`; repro ran as a script, not through the UI. `docs/reports/` (G-08 repro / `ai-contract`) does not exist in this checkout.

## Steps to reproduce
1. From `apps/ai`, run a script that invokes the tool with one change and each of these `format` values: `github`, `GitHub`, `App Store`, `google play`, `gh`, `email`, `html_email`, `discord`, `Slack`.

Reproduced: always (2 runs).

## Expected
`github`, `GitHub`, `App Store`, `google play` render (`ok=true`). `discord` stays refused with `supportedFormats`.

## Actual
```
"github" ok=false Unsupported format "github".
"GitHub" ok=false Unsupported format "GitHub".
"App Store" ok=false Unsupported format "App Store".
"google play" ok=false Unsupported format "google play".
"gh" ok=false ...   "email" ok=false ...   "html_email" ok=false ...
"discord" ok=false Unsupported format "discord".
"Slack" ok=true slack
```
Only exact names (case-insensitive since PR #114) pass.

## Evidence
See Actual. `LOOP` prompt (`apps/ai/src/constants/prompts.ts:271`) also says "GitHub, App Store, Slack, or anything else", so the model is told any platform is fine and passes those words to the tool.

## Suspected area
Failing step: 1
Files:
```ts
// apps/ai/src/tools/release-notes-preview.ts:35
const requestedFormat = input.format.trim().toLowerCase();
if (!isReleaseFormat(requestedFormat)) { ...refuse... }
```
Why: normalization stops at trim + lower-case; no space/underscore handling and no alias map. Prompt wording at `prompts.ts:271` and a stale "use the time tool" sentence at `prompts.ts:347`. This is a suspicion, not a proven root cause.

## Questions for the reporter
- Should `json` / `slack` get aliases too (e.g. `plain json`)? Assumption: no, only the aliases listed in the issue.
- Should the result echo the canonical format? Assumption: yes, `format` in the result is the canonical name (already the case).
