# Ticket 76: [F-07] Renderers: Markdown, Slack, store text, JSON, with limits

## What it asks
Feature. Add pure render functions that turn one release object into five outputs: GitHub Markdown, Slack text, App Store text, Google Play text, and JSON. Each output is checked against its size limit. Over-limit input returns an error result, never truncated text. One shared list of supported formats is used by both the tool and the UI.

Done when: unit tests render one fixture object in every format; no `refs` appear outside the JSON output; an object too long for Google Play returns an error and no text.

## What's ambiguous
- "release object" is not defined in this repo. The ticket depends on F-01 (which the worktree does not contain). Shape of the object, including field names and `refs`, is unknown here.
- "Slack's existing `SLACK_MAX_CONTENT_LENGTH`" is referenced as existing, but no such constant is in this repo.
- Limits are given for App Store (4000) and Google Play (500). No limit is stated for Markdown or JSON.
- The ticket says "One list of supported formats that the tool and the UI both use" but does not say where that list lives.
- Ticket cites `docs/intents/new-features.md` and `docs/practice-plan/README.md`. Neither is in this worktree (only `README.md` is tracked), so the source intent cannot be checked here.

## First step
Confirm the release object shape: check whether F-01 and F-04 are merged into the base branch. Until then, define a fixture type locally from the ticket only.

## Clarifying questions
1. Which fields does the release object have, and which ones are `refs`? Ticket depends on F-01, but F-01 is not in this worktree.
   Default assumption: use the F-01 type once merged; until then a local fixture type with a `refs` field. Correct?
   Answer: _(pending)_
2. Where is `SLACK_MAX_CONTENT_LENGTH` defined, and what is its value?
   Default assumption: an existing constant in the Slack integration; read it, do not redefine. Correct?
   Answer: _(pending)_
3. Should Markdown and JSON have no size limit at all?
   Default assumption: no limit for Markdown and JSON; only App Store, Google Play and Slack are checked. Correct?
   Answer: _(pending)_
4. Where should the single format list live (shared module, both tool and UI import it)?
   Default assumption: one exported constant in a shared module imported by both. Correct?
   Answer: _(pending)_
