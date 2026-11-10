# Plan: ticket 30 prompt-injection guard middleware

Unconfirmed assumptions: rules are a standard set, not the old Mastra list; refusal is one fixed English message.

## Steps
1. `constants/guardrails.ts`: `PROMPT_INJECTION_PATTERNS` (phrase-anchored regexes) and `PROMPT_INJECTION_REFUSAL`; export from the barrel.
2. `middlewares/prompt-injection.ts`: `promptInjectionMiddleware` (`beforeAgent`, jumps to `end`). Checks only the latest human message; on a match returns the refusal as the reply so the model never runs.
3. Wire it into `createBaseAgent` (always on, after model fallback, before skills/memory).
4. Document in `apps/ai/CLAUDE.md`.
5. Verify: typecheck, build; with a fake model, injection samples get the refusal and the model is not called; a git log with "ignore" in a commit passes; check the AG-UI stream emits the refusal.

## Out of scope
PII redaction (M-28), web changes, LLM-based classification.

## Revision (review on PR #64)
The fixed rule list is replaced by a small classifier model (`AI_GUARD_MODEL`) returning a structured verdict (`safe` | `injection`). Classifier errors are fail-closed. Analysis question 1 (old rules) no longer applies.
