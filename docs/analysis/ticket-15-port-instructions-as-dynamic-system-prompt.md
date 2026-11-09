# Ticket 15: [M-12] Port instructions as a dynamic system prompt

## What it asks
Move the old app's instruction text into `constants/prompts.ts` as-is, replacing "You are a helpful assistant.", and build the prompt through a dynamic-prompt middleware in `src/middlewares/` (feature).
Done when: the agent answers using the old wording; diff against the old text shows only mechanical changes.

## What's ambiguous
- "Depends on: M-11" (factory options) is not merged yet; this ticket must not wait on it.
- The old intro has a "Right now" time block built at call time; it conflicts with a cacheable static prompt.

## First step
Copy the old text from `copilotkit-training/release-copilot/src/mastra/instructions/v2` into `constants/prompts.ts`.

## Clarifying questions
No ambiguity left: the user decided to pass the prompt straight to `createAgent` (no middleware, no time block) to keep prompt caching effective.
