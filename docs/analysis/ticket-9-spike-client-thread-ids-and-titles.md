# Ticket 9: [M-06] Spike C: client-made thread ids and generated thread titles

## What it asks
Spike (type: task, research): prove or disprove that (1) the client's `?thread=<id>` reaches `chainFn` as `threadId` and can key a LangGraph checkpointer thread, (2) a reload with the same id continues the same conversation, (3) the server can generate a title after the first turn without blocking the run, and the client can read it, (4) AG-UI resending full history does not duplicate messages when a checkpointer already holds it.
Done when: "same id gives the same conversation after reload with no duplicated messages; title is generated and readable by the client; or fallback written down."

## What's ambiguous
- "title is generated and readable by the client": the web client already polls `GET /api/memory/threads?agentId&resourceId` for `{ threads: [{ id, title, resourceId, createdAt, updatedAt }] }` (`apps/web/src/services/list-threads.ts`, `types/thread.ts`). Not stated whether the spike must serve that route or only prove the title can be produced and stored.
- Checkpointer: ticket says "a checkpointer" but M-22 (Postgres on Supabase) is not built and needs credentials. Not stated whether the spike must run on Postgres.
- Where the spike result goes: M-07 owns `docs/spikes/migration-spike.md`; not stated whether M-06 writes its own section.

## First step
Read what `@ag-ui/langchain` passes to `chainFn` (done: `threadId`, `runId` and the FULL converted message list, ids dropped) and compare with a `createAgent` + checkpointer keyed by `thread_id`.

## Clarifying questions
1. Must the spike serve the `/api/memory/threads` route the client polls, or is proving title generation + storage + a readable lookup enough?
   Default assumption: prove it with a minimal in-spike lookup shaped like that route's response; the real route is M-24. Correct?
   Answer: _(pending)_
2. Is an in-memory checkpointer (`MemorySaver`, same `BaseCheckpointSaver` contract as the Postgres saver) acceptable for the spike, with Postgres noted as a follow-up in M-22?
   Default assumption: yes, a deterministic fake chat model and `MemorySaver`, run headless, no OpenAI key or database needed. Correct?
   Answer: _(pending)_
3. Should M-06 write its result to `docs/spikes/spike-c-threads.md` (M-07 later folds it into `migration-spike.md`)?
   Default assumption: yes. Correct?
   Answer: _(pending)_
