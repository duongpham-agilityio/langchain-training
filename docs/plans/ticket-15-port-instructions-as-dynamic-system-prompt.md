# Plan: [M-12] Port instructions as a dynamic system prompt

## Goal
Agent uses the old app's instruction wording, built per model call by a dynamic-prompt middleware.

## Assumptions
- Unconfirmed (Q1): keep the intro time block (current hour UTC, default zone `America/New_York`, today's date).
- Unconfirmed (Q2): `createBaseAgent` wires the middleware directly; M-11 not merged.
- No test runner; verify by typecheck, build and comparing against the old text with a throwaway script.

## Steps
1. `apps/ai/src/constants/prompts.ts`: replace `SYSTEM_PROMPT` with ported `TONE_AND_LANGUAGE`, `SECURITY`, `ASK_BEFORE_GUESSING`, `BASE_INSTRUCTIONS`, `buildIntro`, `LOOP`, `buildSystemPrompt`, plus time zone and separator constants.
2. `apps/ai/src/middlewares/system-prompt.ts` + barrel: `createSystemPromptMiddleware(now?)` using `dynamicSystemPromptMiddleware`.
3. `apps/ai/src/agent/index.ts`: drop `systemPrompt`, add `middleware`.
4. `apps/ai/CLAUDE.md`: document it.

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0
- Throwaway script: new prompt string equals old `[intro, ...BASE, LOOP].join("\n\n---\n\n")` for a fixed time (done: identical)
