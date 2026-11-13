# Bug: A retry after a failed reply stores the user message twice
Status: REPRODUCED

## Environment
- Branch / commit: fix/gf-12-retry-dedupe @ c89c3d5 (practices)
- Versions: Node 22.22.2, `@langchain/core` 1.3.5, `@langchain/langgraph` 1.7.1, `langchain` 1.6.2, macOS
- Source: GitHub issue #118 (GF-12, gap G-14)

## Setup
1. `pnpm install --frozen-lockfile`
2. Run a headless script (no web, no real model) with `tsx` in `apps/ai`: a real `createAgent` graph, `MemorySaver` checkpointer, and a fake chat model that throws on its first call and answers "ok" afterwards. Placeholder env vars (`OPENAI_API_KEY`, `SUPABASE_*`, `DATABASE_URL`) are set only because `config.ts` requires them on import.
Setup notes: `.claude/launch.json` has only web `dev` and `storybook` entries, and the web needs a live model, Supabase and a failing network. The script feeds the exact server path instead (`toLangChainMessages` -> `trimToNewMessages` -> `agent.invoke` on one `thread_id`). The web client and the real model were not run.

## Steps to reproduce
1. Build the AG-UI history `[{ id: "msg-1", role: "user", content: "git log: a b c" }]`.
2. Send it as the server does: `trimToNewMessages(toLangChainMessages(input))` into `agent.invoke` on thread `t`. The model throws ("model down").
3. Send the same history again (the web retry).
4. Read `agent.getState` for thread `t`.

Reproduced: always (3 runs).

## Expected
The thread holds the user message once: `[human, ai]`. The model sees one message on the retry.

## Actual
```
model sees 1 messages
attempt 1 failed: model down
model sees 2 messages
[ 'human:git log: a b c', 'human:git log: a b c', 'ai:ok' ]
```

## Evidence
The checkpoint keeps the input of the failed attempt, so the retry sees one earlier human message plus the resent one; the model sees the pasted text twice.

## Suspected area
Failing step: 3
Files:
```ts
// apps/ai/src/agui/index.ts:56-60
export const toLangChainMessages = (input: RunAgentInput): BaseMessage[] =>
  input.messages.flatMap((message): BaseMessage[] => {
    switch (message.role) {
      case "user":
        return [new HumanMessage(toText(message.content))];
```
Why: the `HumanMessage` is built without the AG-UI `message.id`, so LangGraph's message reducer gives it a fresh id and appends instead of replacing the stored message. This is a suspicion, not a proven root cause; the fix will confirm it.

## Questions for the reporter
- The issue says "failed reply" without the failure kind. Assumption: any failure after the input is checkpointed (model error, network drop) leaves the user message in the thread. Other failure points were not run.
- Should assistant and tool messages also keep their AG-UI ids? Assumption: no, the issue scopes the fix to `HumanMessage`; `trimToNewMessages` keeps only human messages after the last assistant message.
