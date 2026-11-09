# Ticket 14: [M-11] Make the agent factory and AG-UI bridge extensible

## What it asks
Chore in `apps/ai`, no behavior change. `createBaseAgent` takes options (middleware list, checkpointer, system prompt source) and passes them to `createAgent`. The AG-UI `chainFn` forwards `threadId` into the agent call config as `configurable.thread_id`. Keep factory style, no module-level singletons.
Done when: "`pnpm typecheck` passes; chat still works exactly as before; a thread id reaches the agent call (visible in a log or trace)."

## What's ambiguous
- "system prompt source": string only, or also a function (dynamic prompt, M-12)? Not stated.
- "visible in a log or trace": which log? No logger convention exists in `apps/ai` besides `console.log` in `index.ts`.
- "Depends on: M-02": already merged (deps incl. `@langchain/langgraph-checkpoint-postgres` present).

## First step
Add an options type to `createBaseAgent` in `apps/ai/src/agent/index.ts` with defaults equal to today's values, then pass `threadId` from `chainFn` into `agent.stream` config.

## Clarifying questions
1. Does "system prompt source" need to accept more than a string?
   Default assumption: option is `systemPrompt?: string`, defaulting to `SYSTEM_PROMPT`; dynamic prompts are M-12's job. Correct?
   Answer: _(pending)_

2. How should the thread id be made visible?
   Default assumption: one `console.log` line with the thread id in the bridge per run. Correct?
   Answer: _(pending)_
