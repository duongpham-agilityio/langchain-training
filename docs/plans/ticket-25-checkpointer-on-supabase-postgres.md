# Plan: [M-22] Checkpointer on Supabase Postgres

## Goal
Conversation state survives a server restart: same `threadId` continues the same thread with no repeated messages.

## Assumptions
- Unconfirmed (Q1): tables in `public`, created by `PostgresSaver.setup()` (idempotent) at startup.
- Unconfirmed (Q2): setup failure logs an error and falls back to `MemorySaver`; server still starts.
- `@langchain/langgraph-checkpoint-postgres` and `pg` are already dependencies; reuse the shared pool.
- `InMemoryAgentRunner` stays (only event replay; state is in the checkpointer).
- No test runner: scripted check for the history trim, typecheck and build.

## Steps
1. `db/checkpointer.ts`: `createCheckpointer(pool)` returns a set-up `PostgresSaver`, or `MemorySaver` with an error log on failure. Export from `db/index.ts`.
2. `index.ts`: create the pool first, `await createCheckpointer(pgPool)`, pass to `createBaseAgent`; drop the in-memory comment.
3. `agui/index.ts`: `trimToNewMessages` (spike C rule): with saved state, send only the human messages after the last assistant message instead of just the last message.
4. Update `apps/ai/CLAUDE.md`.

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0
- trim helper checked with a scratch script
- manual restart check needs a live DB: noted as not run if no credentials
