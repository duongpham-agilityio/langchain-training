# Ticket 28: [M-25] Conversation memory: recent kept, older summarized

## What it asks
Feature: add the prebuilt `summarizationMiddleware` to the agent so a long thread keeps the last N messages verbatim and replaces older ones with a summary. N and the trigger size live in `constants/`.
Done when: "a long thread still answers questions about early content through the summary; context sent to the model stays under the limit."

## What's ambiguous
- "Depends on: M-22" (Postgres checkpointer) is not merged yet; `apps/ai/src/index.ts` still uses `MemorySaver`. The middleware works with any checkpointer, so this does not block the change.
- "trigger size" has no unit (tokens or messages) and "N" no value.
- Which model summarizes is not stated.

## First step
Add `MEMORY_*` constants and register `summarizationMiddleware` in `createBaseAgent`.

## Clarifying questions
1. Should the trigger be counted in tokens (vs. messages)?
   Default assumption: tokens (trigger 4000 tokens), keep last 10 messages. Correct?
   Answer: _(pending)_
2. Should the summary use the same model as the agent?
   Default assumption: yes, `config.model`. Correct?
   Answer: _(pending)_
