# Ticket 15: [M-12] Port instructions as a dynamic system prompt

## What it asks
Move the old app's instruction text into `constants/prompts.ts` as-is, replacing "You are a helpful assistant.", and build the prompt through a dynamic-prompt middleware in `src/middlewares/` (feature).
Done when: the agent answers using the old wording; diff against the old text shows only mechanical changes.

## What's ambiguous
- "Depends on: M-11" (factory options) is not merged yet; this ticket must not wait on it.
- "release-notes: intro, loop": the old intro has a "Right now" time block built at call time.

## First step
Copy the old text from `copilotkit-training/release-copilot/src/mastra/instructions/v2` into `constants/prompts.ts`.

## Clarifying questions
1. Should the "Right now" time block of the intro be kept?
   Default assumption: yes, as a function of the current time; this is what makes the prompt dynamic. Correct?
   Answer: _(pending)_
2. Wire the middleware directly in `createBaseAgent` (M-11 not merged)?
   Default assumption: yes, `middleware: [createSystemPromptMiddleware()]`; M-11 can later pass it via options. Correct?
   Answer: _(pending)_
