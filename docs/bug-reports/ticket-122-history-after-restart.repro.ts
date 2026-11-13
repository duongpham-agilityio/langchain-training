// Repro for GF-16 (#122). Bare imports must resolve from apps/ai: cp this file to apps/ai/repro-122.ts,
// run `SRC=$PWD/src pnpm exec tsx repro-122.ts` from apps/ai, then delete the copy.
// "Postgres" is a MemorySaver that outlives the "restart"; the runner store is the process-level
// in-memory store of a runtime that has served no run yet (= a fresh process). Prints what it OBSERVES.
process.env.OPENAI_API_KEY ??= "x";
process.env.SUPABASE_URL ??= "http://localhost";
process.env.SUPABASE_ANON_KEY ??= "x";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "x";
process.env.DATABASE_URL ??= "postgres://x";
const SRC = process.env.SRC!;

const OWNER = "00000000-0000-0000-0000-00000000000a";
const OTHER = "00000000-0000-0000-0000-00000000000b";
const THREAD = "11111111-1111-1111-1111-111111111111";

const collect = (obs: { subscribe: (o: object) => unknown }) =>
  new Promise<{ type: string; messages?: { role: string; toolCalls?: unknown[] }[] }[]>((resolve) => {
    const events: never[] = [];
    obs.subscribe({ next: (e: never) => events.push(e), complete: () => resolve(events), error: () => resolve(events) });
  });

const main = async () => {
  const { MemorySaver } = await import("@langchain/langgraph");
  const { AIMessage, HumanMessage, ToolMessage } = await import("@langchain/core/messages");
  const { createBaseAgent } = await import(`${SRC}/agent/index.ts`);
  const { InMemoryAgentRunner } = await import("@copilotkit/runtime/v2");

  // Process 1 left this checkpoint behind: a draft turn with a tool call and its result.
  const checkpointer = new MemorySaver();
  const agent = createBaseAgent({ query: async () => ({ rows: [] }) } as never, { checkpointer });
  await agent.updateState({ configurable: { thread_id: THREAD } }, {
    messages: [
      new HumanMessage({ id: "u1", content: "release 1.0: fix login" }),
      new AIMessage({ id: "a1", content: "", tool_calls: [{ id: "call_1", name: "renderReleaseNotesPreview", args: { format: "markdown" } }] }),
      new ToolMessage({ id: "t1", tool_call_id: "call_1", content: '{"ok":true,"text":"# 1.0"}' }),
      new AIMessage({ id: "a2", content: "Here is your draft." }),
    ],
  });
  const state = (await agent.getState({ configurable: { thread_id: THREAD } })) as { values: { messages: unknown[] } };
  console.log("checkpoint messages:", state.values.messages.length);

  // Process 2: the runner the server really uses. Look for the fix's runner; otherwise the stock one.
  let runner: InstanceType<typeof InMemoryAgentRunner> = new InMemoryAgentRunner();
  const mod = await import(`${SRC}/runner/index.ts`).catch(() => null);
  if (mod?.createCheckpointAgentRunner) runner = mod.createCheckpointAgentRunner(agent, { query: async () => ({ rows: [{ owner_id: OWNER }] }) });
  console.log("runner:", runner.constructor.name);

  for (const [label, ownerId] of [["owner", OWNER], ["other user", OTHER]] as const) {
    const events = await collect(runner.connect({ threadId: THREAD, ownerId }));
    const snap = events.find((e) => e.type === "MESSAGES_SNAPSHOT");
    console.log(`connect as ${label}: events=${events.length} types=${events.map((e) => e.type).join(",") || "-"}`);
    if (snap) console.log("  snapshot roles:", snap.messages?.map((m) => m.role + (m.toolCalls?.length ? "(toolCalls)" : "")).join(" "));
  }
};
main().then(() => process.exit(0));
