# Plan: ticket 29 model fallback middleware

## Steps
1. Add `apps/ai/src/middlewares/model-fallback.ts`: `createModelFallbackMiddleware()` wraps `modelFallbackMiddleware(new ChatOpenAI({ model: config.fallbackModel }))`; export from the barrel.
2. Put it first in the `createBaseAgent` middleware list (`agent/index.ts`).
3. Document it in `apps/ai/CLAUDE.md`.
4. Verify: typecheck; with a fake always-failing primary model the agent answers from the fallback, and without the middleware it throws.

## Out of scope
Chains of more than one fallback model; web changes.
