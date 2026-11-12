# Ticket 78: [F-09] Draft tool takes a release object and a format

## What it asks
Feature. Change `renderReleaseNotesPreview` from a free-text `content` input to a release object plus a requested format. The tool computes the version, fills the date, renders only the requested format, and returns the object, the rendered text and a hash of the object. Update the system prompt (`RELEASE_FLOW`) and the `platform-formatting` skill so the agent stops writing per-destination text and free-form destinations are removed.

Done when: paste a log, name a format, get a preview for that format; asking for a second format keeps every description identical; "Discord" is refused with the supported list; an over-limit result shows the error.

## What's ambiguous
- "Depends on: F-03, F-05, F-07, F-08" names requirement IDs that do not appear in `docs/intents/new-features.md` or `docs/practice-plan/README.md`. The ticket cannot be checked against those IDs as written.
- "A format with no renderer is refused with the list of supported formats." The supported list is not named in the ticket. `docs/intents/new-features.md` names six: Markdown (GitHub), HTML email, App Store text, Google Play text, JSON, Slack.
- "an over-limit result shows the error." Limits are named only in the intent (App Store 4000 characters, Google Play 500). The ticket does not say which formats are limited.
- "a hash of the object." The ticket does not say what the hash covers, for example whether `version` and `date` are included.

## First step
Read `apps/ai/src/schemas/release.ts`, `apps/ai/src/tools/release-notes-preview.ts`, `apps/ai/src/constants/prompts.ts` (`RELEASE_FLOW`) and `apps/ai/src/skills/platform-formatting.ts` to confirm the current tool, prompt and skill contracts before writing the plan.

## Clarifying questions
1. Are the F-03, F-05, F-07 and F-08 items already done in this codebase? Which ticket or PR delivered each one?
   Default assumption: F-03, F-05, F-07 and F-08 are the Phase 2 items in `docs/intents/new-features.md` (release object, version by code, format renderers, JSON) and are already merged on this base. Correct?
   Answer: Checked on `practices` at 8f3fc14: all four are present. F-03 `apps/ai/src/schemas/release.ts`, F-05 `apps/ai/src/utils/version-bump.ts` (`nextVersion`), F-07 `apps/ai/src/utils/render-release.ts` (`renderRelease`, formats in `apps/ai/src/constants/release-formats.ts`), F-08 `apps/ai/src/utils/render-release-email.ts` (`renderReleaseEmail`). Note: an earlier check on 3e55e1b found them missing; that was before #104–#107 merged.

2. Is the supported format list exactly the six formats in `docs/intents/new-features.md` (Markdown, HTML email, App Store text, Google Play text, JSON, Slack)?
   Default assumption: Yes, exactly those six, and nothing else. Correct?
   Answer: _(pending)_

3. Which formats have a character limit that shows an error when exceeded? Is it only App Store (4000) and Google Play (500)?
   Default assumption: Only App Store (4000 characters) and Google Play (500 characters), as the intent says. Correct?
   Answer: _(pending)_

4. What does the hash of the object cover? Does it include `version` and `date`, or only the change list?
   Default assumption: The whole release object as returned (including `version` and `date`), so asking for a second format leaves the hash unchanged. Correct?
   Answer: _(pending)_
