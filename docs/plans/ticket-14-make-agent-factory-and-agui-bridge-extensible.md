# Plan: Ticket 14 make agent factory and AG-UI bridge extensible

Source: [analysis](../analysis/ticket-14-make-agent-factory-and-agui-bridge-extensible.md)

## Assumptions (unconfirmed)
- `systemPrompt` option is a string, default `SYSTEM_PROMPT`.
- Thread id is made visible with one `console.log` per run.

## Steps
1. `apps/ai/src/agent/index.ts`: add `CreateBaseAgentOptions` (`middleware?`, `checkpointer?`, `systemPrompt?`) typed from `createAgent` params; `createBaseAgent(options = {})` passes them through. Defaults: no middleware, no checkpointer, `SYSTEM_PROMPT`. No singletons.
2. `apps/ai/src/agui/index.ts`: `streamTextChunks` takes `threadId` and calls `agent.stream({ messages }, { streamMode: "messages", configurable: { thread_id: threadId } })`; `chainFn` destructures `threadId` and logs it.
3. Update `apps/ai/CLAUDE.md` architecture lines for agent/agui.

## Verify
- `pnpm --filter @training/ai typecheck` and `build` pass.
- Run server, send a chat request, see the thread id log line; reply streams as before.

## Out of scope
Checkpointer wiring (M-22), dynamic prompt (M-12), middleware (M-13+).
