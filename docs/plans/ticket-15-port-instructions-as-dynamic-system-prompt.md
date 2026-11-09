# Plan: [M-12] Port instructions as the system prompt

## Goal
Agent uses the old app's instruction wording.

## Assumptions
- Changed after review: no middleware. The prompt is passed straight to `createAgent` as a static string, so the provider prompt cache stays valid. This overrides the ticket's "dynamic-prompt middleware" scope.
- The intro's "Right now" time block is dropped (it changes every hour and would break caching). Time comes from the `get_current_time` tool.
- No test runner; verify by typecheck, build and comparing against the old text with a throwaway script.

## Steps
1. `apps/ai/src/constants/prompts.ts`: replace the old `SYSTEM_PROMPT` with ported `TONE_AND_LANGUAGE`, `SECURITY`, `ASK_BEFORE_GUESSING`, `BASE_INSTRUCTIONS`, `INTRO`, `LOOP`, and the joined `SYSTEM_PROMPT`.
2. `apps/ai/src/agent/index.ts`: keep `systemPrompt: SYSTEM_PROMPT`.
3. `apps/ai/CLAUDE.md`: document it.

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0
- Throwaway script: new prompt equals the old joined prompt minus the "Right now" block.
