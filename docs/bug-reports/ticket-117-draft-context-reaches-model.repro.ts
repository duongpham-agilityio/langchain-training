// Check for ticket 117 (G-06): the draft on screen (AG-UI `input.context`) reaches the model for that
// turn only, as a delimited read-only block on the latest human message, and is never checkpointed.
// Runs the real `ReleaseNotesAguiAgent` over a real `createAgent` graph (MemorySaver) with a fake model
// that records what it receives. Prints one line per case and a final true/false.
// Copy to apps/ai/repro.tmp.ts, run from apps/ai, then delete the copy:
//   OPENAI_API_KEY=x SUPABASE_URL=http://x SUPABASE_ANON_KEY=x SUPABASE_SERVICE_ROLE_KEY=x DATABASE_URL=postgres://x \
//     node_modules/.bin/tsx repro.tmp.ts
import { createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { createAguiAgent } from "@/agui";
import { createDraftContextMiddleware } from "@/middlewares/draft-context";

const SYSTEM = "SYSTEM-PROMPT";
const seen: BaseMessage[][] = [];

// Innermost middleware: records exactly what the model call receives (system message first, then the
// messages). createAgent does not call a fake model through the usual hooks, so this is the reliable spot.
const recorder = createMiddleware({
  name: "Recorder",
  wrapModelCall: (request, handler) => {
    seen.push([request.systemMessage, ...request.messages]);
    return handler(request);
  },
});

const checkpointer = new MemorySaver();
const graph = createAgent({
  model: new FakeListChatModel({ responses: ["ok"] }),
  tools: [],
  systemPrompt: SYSTEM,
  middleware: [createDraftContextMiddleware(), recorder],
  checkpointer,
});
const agent = createAguiAgent(graph as never);

const send = (threadId: string, id: string, text: string, context?: unknown[]) =>
  new Promise<void>((resolve, reject) =>
    agent
      .run({
        threadId,
        runId: `run-${id}`,
        state: {},
        tools: [],
        forwardedProps: {},
        messages: [{ id, role: "user", content: text }],
        ...(context ? { context } : {}),
      } as never)
      .subscribe({ complete: resolve, error: reject }),
  );

const text = (m: BaseMessage) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content));
const lastHuman = (messages: BaseMessage[]) => text(messages.filter((m) => m.type === "human").at(-1)!);
const system = (messages: BaseMessage[]) => text(messages.filter((m) => m.type === "system")[0]!);

const draft = (name: string, hash: string) => ({
  description: "draft on screen",
  value: JSON.stringify({ release: { version: "1.0.0", date: "20261113", openingLine: `${name} draft`, changes: [] }, format: "markdown", text: `${name}-DRAFT-TEXT`, hash }),
});
const stored = async (threadId: string) =>
  JSON.stringify(((await graph.getState({ configurable: { thread_id: threadId } })).values.messages as BaseMessage[]).map(text));
const wholeCheckpoint = async (threadId: string) => {
  const out: unknown[] = [];
  for await (const tuple of checkpointer.list({ configurable: { thread_id: threadId } })) out.push(tuple);
  return JSON.stringify(out);
};

const results: Record<string, boolean> = {};

// 1. Older draft in context (last of several entries; a foreign entry is ignored).
await send("t1", "m1", "make this shorter", [
  { description: "something else", value: "not json" },
  draft("NEWER", "h2"),
  draft("OLDER", "h1"),
]);
const call1 = seen.at(-1)!;
results["block on latest human message, older draft wins"] =
  lastHuman(call1).startsWith("make this shorter") && lastHuman(call1).includes("OLDER-DRAFT-TEXT") && !lastHuman(call1).includes("NEWER-DRAFT-TEXT");
results["block is delimited and read-only"] = /BEGIN|<draft/i.test(lastHuman(call1)) && /read-only/i.test(lastHuman(call1));
results["system prompt untouched"] = system(call1).includes(SYSTEM) && !system(call1).includes("DRAFT-TEXT");
results["checkpoint messages hold the plain user text"] = (await stored("t1")).includes('"make this shorter"') && !(await stored("t1")).includes("DRAFT-TEXT");
results["no draft text anywhere in the checkpoint (state + metadata)"] = !(await wholeCheckpoint("t1")).includes("DRAFT-TEXT");

// 2. Next turn without context: history is clean, no block.
await send("t1", "m2", "thanks");
const call2 = seen.at(-1)!;
results["next turn without context: no block anywhere"] = !call2.some((m) => text(m).includes("DRAFT-TEXT"));

// 3. value null: unchanged.
await send("t2", "m3", "hello", [{ description: "draft on screen", value: "null" }]);
results["value null: message unchanged"] = lastHuman(seen.at(-1)!) === "hello";

// 4. No context at all: unchanged.
await send("t3", "m4", "hello again");
results["no context: message unchanged"] = lastHuman(seen.at(-1)!) === "hello again";

for (const [name, ok] of Object.entries(results)) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
console.log(Object.values(results).every(Boolean));
