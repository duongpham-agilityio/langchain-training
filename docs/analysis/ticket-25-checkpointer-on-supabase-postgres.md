# Ticket 25: [M-22] Checkpointer on Supabase Postgres

## What it asks
Feature. Replace the in-memory `MemorySaver` with the LangGraph Postgres checkpointer on the Supabase database, create its tables once, and key conversations by the client `threadId`. Apply the spike C answer on duplicated history.
Done when: "restart the server, reload the thread in the browser, and continue the same conversation with no repeated messages."

## What's ambiguous
- "one-time setup of its tables": not stated whether at server startup or by a separate script. `PostgresSaver.setup()` is idempotent, so running it at startup is safe.
- "Replace `InMemoryAgentRunner` use where it keeps conversation state": CopilotKit runtime v2 has only `InMemoryAgentRunner` (and an Intelligence runner), and it only replays AG-UI events. Conversation state lives in the checkpointer; the runner stays.
- Behavior when the DB is down at startup is not stated (`/health` must not crash on bad credentials, per M-03).

## First step
Add a `createCheckpointer(pool)` in `apps/ai/src/db/` using `PostgresSaver` on the shared pg pool, and call `setup()` at startup.

## Clarifying questions
1. Where should the checkpoint tables live?
   Default assumption: the default `public` schema, created by `setup()` at startup. Correct?
   Answer: _(pending)_
2. If `setup()` fails at startup (DB unreachable), what should happen?
   Default assumption: log an error and fall back to `MemorySaver` so the server still starts and `/health` reports the DB state. Correct?
   Answer: _(pending)_
