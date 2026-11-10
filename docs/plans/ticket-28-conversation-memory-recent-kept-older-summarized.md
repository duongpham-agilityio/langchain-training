# Plan: ticket 28 conversation memory

Unconfirmed assumptions (analysis questions pending): trigger by tokens (4000), keep last 10 messages, summarizer = `config.model`.

## Steps
1. `apps/ai/src/constants/memory.ts`: `MEMORY_KEEP_MESSAGES = 10`, `MEMORY_SUMMARY_TRIGGER_TOKENS = 4000`; export from `constants/index.ts`.
2. `apps/ai/src/middlewares/summarization.ts`: build `summarizationMiddleware({ model, trigger: { tokens }, keep: { messages } })`; export from `middlewares/index.ts`.
3. Register it in `createBaseAgent` middleware list (after skills, before human-in-the-loop).
4. Run `pnpm typecheck`, `pnpm build`; a manual run if an API key is available.

## Out of scope
Postgres checkpointer (M-22), fallback model (M-26).
