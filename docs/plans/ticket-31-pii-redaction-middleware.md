# Plan: ticket 31 PII redaction middleware

Unconfirmed assumption: only email and phone are redacted.

## Steps
1. `src/constants/pii.ts`: phone patterns (international `+`, US `ddd-ddd-dddd`, local `0dd...`), exported via `constants/index.ts`.
2. `src/utils/pii.ts`: `detectPhone(content): PIIMatch[]` (pure helper), exported via barrel.
3. `src/middlewares/pii.ts`: `piiRedactionMiddlewares` = `piiMiddleware("email", redact)` + `piiMiddleware("phone", {detector: detectPhone, redact})`, applied to input; the redacted messages replace the stored state.
4. Register in `createBaseAgent` after the fixed middleware, before caller extras (placement is the only touch point shared with the injection guard ticket).
5. Update `apps/ai/CLAUDE.md`.

## Verify
`pnpm --filter @training/ai typecheck` and `build`; a tsx script runs the middleware's `beforeModel` on a sample log: email/phone redacted, SHAs/dates/versions unchanged.
