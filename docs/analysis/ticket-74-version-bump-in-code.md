# Ticket 74: [F-05] Version bump in code

## What it asks
Feature (pure logic + query). Build a pure function that takes the previous version and the changes and returns the next version. Also add a query that returns the user's most recent saved release version. The LLM no longer decides the version.

Done when: unit tests cover major, minor, patch, first release and a user-stated version.

## What's ambiguous
- "Any breaking change = major, else any feature = minor, else patch." The ticket does not say how changes are represented. Two developers would build different input types (free text, typed change list, flags).
- "A version the user stated in chat is used as is." Not stated whether it is validated as semver, and whether it wins over a previous version and the change list in every case.
- "The user's most recent saved release version." Not stated whether "most recent" is by creation time or by version order, and whether the query is scoped per user or global.

Depends on F-01 and F-04 (listed in ticket body). Their state is not checked here.

## First step
Read the existing release-history code (`apps/ai/src/db/release-history.ts`, `apps/ai/src/schemas/release-history.ts`, `apps/ai/src/utils/release-title.ts`) and the intent `docs/intents/new-features.md` to confirm the change shape and what F-01 and F-04 already provide.

## Clarifying questions
1. What form do the changes take for the version function: a typed list where each entry has a `type` (breaking, feature, fix)?
   Default assumption: a list of change entries, each with a `type` of `breaking`, `feature` or `fix`. Correct?
   Answer: _(pending)_

2. For a user-stated version: is it validated as semver, and does it override the computed bump in every case?
   Default assumption: used verbatim with no validation, and it overrides the computed bump. Correct?
   Answer: _(pending)_

3. For "most recent saved release": ordered by creation time, and global across users?
   Default assumption: latest row by creation time in the release history table, not scoped per user. Correct?
   Answer: _(pending)_
