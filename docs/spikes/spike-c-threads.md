# Spike C: client-made thread ids and generated thread titles (M-06)

Headless, isolated spike. Code: `apps/ai/src/spikes/thread-ids/` (throwaway). Run:

```bash
pnpm --filter @training/ai exec tsx src/spikes/thread-ids/run.ts
```

## Setup and limits

- Real `@ag-ui/langchain@0.0.4` `LangChainAgent` driven through `run()` with a `RunAgentInput`, wrapping a real `createAgent` with a `MemorySaver`.
- A scripted fake chat model (`RecordingModel`, extends `BaseChatModel`) replaces OpenAI. No `.env`, API key or database is read.
- Not exercised: `PostgresSaver` (same `BaseCheckpointSaver` contract; verify in M-22) and CopilotKit `InMemoryAgentRunner` replay on reload (the runner may also replay stored events to the client; not tested here).
- The `/api/memory/threads` route is not built (M-24). The spike only proves title generation, storage and a lookup shaped like that route's response.

## Result per question

| Question | Result |
| --- | --- |
| Does the client's thread id reach `chainFn` as `threadId`? | Works. `chainFn` saw exactly the id sent in `RunAgentInput.threadId`. |
| Does it key a checkpointer conversation? | Works, when passed as `configurable.thread_id` to `agent.stream`. A fresh agent instance on the same saver (a "reload") continued the same conversation. |
| Does AG-UI resending full history duplicate messages? | Yes with naive pass-through (FAIL, see below). Needs the trimming fallback; with it, no duplicates. |
| Is another thread isolated? | Works. A different id got its own state; the first thread was untouched. |
| Can a title be generated after the first turn without blocking the run? | Works with a fire-and-forget promise. |
| Can the client read it? | Works via a route-shaped lookup (`{ threads: [{ id, title, resourceId, createdAt, updatedAt }] }`); the real route is M-24. |

## Evidence (script output, observed)

```
PASS (a) chainFn threadId equals client id | saw t-naive
   naive state: ["human:hello","ai:A1","human:hello","ai:A1","human:again","ai:A2"]
   naive no-duplicates property: FAIL ('hello' x2, 6 messages, clean would be 4)
PASS (b) naive pass-through duplicates history (risk confirmed)
   trimmed state: ["human:hello","ai:A1","human:again","ai:A2"]
PASS (c) trimmed input: exactly the expected messages after reload
PASS (c) model on run 2 saw prior turns | [["human:hello","ai:A1","human:again"]]
PASS (d) other thread id isolated | ["human:other","ai:A3"]
PASS (e) RUN_FINISHED arrives before the title resolves | run took 3ms, title delay 300ms, rows at finish 0
   lookup: {"threads":[{"id":"t-title","title":"Greeting chat", ...}]}
PASS (e) route-shaped lookup returns the title afterwards
PASS (e) failing title generator does not fail the run

RESULT: all PASS
```

Note on scenario (b): the script reports PASS when the duplication is observed. The property "naive pass-through does not duplicate history" itself FAILED. That is the expected and documented risk, not a script bug.

## Why the naive pass-through duplicates

`@ag-ui/langchain` converts the full AG-UI message list to LangChain messages and drops the AG-UI message ids (`HumanMessage` / `AIMessage` are built from content only). The messages reducer therefore cannot match them to stored ones and appends them all. Run 2 with `[user1, assistant1, user2]` on top of a stored `[user1, assistant1]` produced 6 messages instead of 4.

## Dedupe rule (the fallback)

The checkpoint already holds everything up to and including the last assistant reply, so pass only the messages after the last assistant message (`trimToNewMessages` in `history.ts`) and set `configurable.thread_id = threadId`.

Edge cases to keep in mind when this moves to `agui/index.ts`:
- Several user messages after the last assistant message are all new, so they are all kept.
- Tool messages and assistant tool calls: this server drops server tool calls from AG-UI history on purpose (see `apps/ai/CLAUDE.md`), so the "last assistant" cut is safe here. Revisit if frontend tools are added.
- If the client history and the checkpoint ever diverge (history edited or truncated client side), the checkpoint wins; this was not tested.

## Title approach

- Generated in a promise started after the first turn's stream ends (`generateTitleInBackground`) and never awaited, so `RUN_FINISHED` is not delayed. Observed: the run finished while the 300 ms title step was still pending, and the lookup was empty at that moment, then returned the title afterwards.
- The helper never rejects. A failing title model did not fail the run and wrote no row.
- The client keeps polling the thread list for a limited time: `THREAD_TITLE_POLL_INTERVAL_MS = 1_500` and `THREAD_TITLE_POLL_WINDOW_MS = 15_000` in `apps/web/src/constants/threads.ts`. A title step slower than 15 s will not show until the next list load.
- Only the first turn triggers a title (no assistant message in the received history yet). With a real store, use "no row for this thread" as the condition instead, so a failed first attempt can retry.

## What it changes in the next tickets

- M-20 (wire agent): pass `threadId` from `chainFn` as `configurable.thread_id`, apply `trimToNewMessages` before `agent.stream`, create the title promise after the stream ends.
- M-22 (Postgres checkpointer): swap `MemorySaver` for `PostgresSaver`, rerun this script against it (scenarios c, d), and check the reload case with the CopilotKit runner.
- M-24 (threads route): serve `{ threads: [...] }` from a real table; the title writer here is the producer. Order rows so a title written after `RUN_FINISHED` is visible to the poll.

## Deleting the spike

The spike is self-contained and not imported by `src/index.ts`. Remove it with:

```bash
rm -r apps/ai/src/spikes/thread-ids
```

Keep this document. Move `trimToNewMessages` and the title helper into their real folders (`agui/`, a titles module) when M-20 starts.
