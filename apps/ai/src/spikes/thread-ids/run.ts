import { EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/client";
import type { BaseMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { lastValueFrom, toArray } from "rxjs";

// Siblings
import {
  RecordingModel,
  createCheckpointedAgent,
  createSpikeBridge,
  type BridgeMode,
} from "./agent";
import { createTitleStore } from "./titles";

const RESOURCE_ID = "user-1";
const TITLE_DELAY_MS = 300;

let failed = false;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` | ${detail}` : ""}`);
  if (!ok) failed = true;
};

type Msg = { id: string; role: "user" | "assistant"; content: string };
const input = (threadId: string, runId: string, messages: Msg[]) =>
  ({ threadId, runId, messages, tools: [], context: [], state: {}, forwardedProps: {} }) as RunAgentInput;

const user = (id: string, content: string): Msg => ({ id, role: "user", content });
const assistant = (id: string, content: string): Msg => ({ id, role: "assistant", content });

// Reads the stored checkpoint straight from the saver (what a reload would load).
const stateOf = async (saver: MemorySaver, threadId: string) => {
  const tuple = await saver.getTuple({ configurable: { thread_id: threadId } });
  const messages = (tuple?.checkpoint.channel_values.messages ?? []) as BaseMessage[];
  return messages.map((m) => `${m.type}:${m.text}`);
};

const makeBridge = (saver: MemorySaver, model: RecordingModel, mode: BridgeMode, seenIds: string[] = [], title?: Parameters<typeof createSpikeBridge>[0]["title"]) =>
  createSpikeBridge({
    // fresh agent per run = "reload", shared checkpointer
    getAgent: () => createCheckpointedAgent(model, saver),
    mode,
    onThreadId: (id) => seenIds.push(id),
    title,
  });

const runOnce = (bridge: ReturnType<typeof makeBridge>, i: RunAgentInput) =>
  lastValueFrom(bridge.run(i).pipe(toArray()));

const main = async () => {
  // (a) + (b) naive pass-through
  {
    const saver = new MemorySaver();
    const model = new RecordingModel(["A1", "A2"]);
    const ids: string[] = [];
    const bridge = makeBridge(saver, model, "naive", ids);
    await runOnce(bridge, input("t-naive", "r1", [user("u1", "hello")]));
    check("(a) chainFn threadId equals client id", ids[0] === "t-naive", `saw ${ids[0]}`);
    // run 2: client resends full history + new user turn
    await runOnce(bridge, input("t-naive", "r2", [user("u1", "hello"), assistant("a1", "A1"), user("u2", "again")]));
    const msgs = await stateOf(saver, "t-naive");
    console.log("   naive state:", JSON.stringify(msgs));
    const humanHello = msgs.filter((m: string) => m === "human:hello").length;
    // The naive pass-through is EXPECTED to duplicate. PASS here means the risk
    // is confirmed (the "no duplicates" property FAILs for the naive approach).
    console.log(`   naive no-duplicates property: ${humanHello === 1 ? "PASS" : "FAIL"} ('hello' x${humanHello}, ${msgs.length} messages, clean would be 4)`);
    check("(b) naive pass-through duplicates history (risk confirmed)", humanHello > 1);
  }

  // (c) mitigation + reload, (d) isolation
  {
    const saver = new MemorySaver();
    const m1 = new RecordingModel(["A1"]);
    await runOnce(makeBridge(saver, m1, "trimmed"), input("t-1", "r1", [user("u1", "hello")]));
    const m2 = new RecordingModel(["A2"]);
    await runOnce(makeBridge(saver, m2, "trimmed"), input("t-1", "r2", [user("u1", "hello"), assistant("a1", "A1"), user("u2", "again")]));
    const msgs = await stateOf(saver, "t-1");
    console.log("   trimmed state:", JSON.stringify(msgs));
    check(
      "(c) trimmed input: exactly the expected messages after reload",
      JSON.stringify(msgs) === JSON.stringify(["human:hello", "ai:A1", "human:again", "ai:A2"]),
    );
    check(
      "(c) model on run 2 saw prior turns",
      JSON.stringify(m2.calls[0]) === JSON.stringify(["human:hello", "ai:A1", "human:again"]),
      JSON.stringify(m2.calls),
    );
    // re-sending the same run (reload resending identical history) must not add messages
    const m3 = new RecordingModel(["A3"]);
    await runOnce(makeBridge(saver, m3, "trimmed"), input("t-other", "r1", [user("x1", "other")]));
    const other = await stateOf(saver, "t-other");
    const first = await stateOf(saver, "t-1");
    check("(d) other thread id isolated", other.length === 2 && first.length === 4 && !other.includes("human:hello"), JSON.stringify(other));
  }

  // (e) title: non-blocking, readable via route-shaped lookup, failure-tolerant
  {
    const saver = new MemorySaver();
    const store = createTitleStore();
    const log: string[] = [];
    const model = new RecordingModel(["A1"]);
    const bridge = makeBridge(saver, model, "trimmed", [], {
      model: new RecordingModel(["Greeting chat"]),
      store,
      resourceId: RESOURCE_ID,
      delayMs: TITLE_DELAY_MS,
    });
    const events: BaseEvent[] = [];
    const started = Date.now();
    await new Promise<void>((resolve, reject) =>
      bridge.run(input("t-title", "r1", [user("u1", "hello")])).subscribe({
        next: (e) => { events.push(e); if (e.type === EventType.RUN_FINISHED) log.push("RUN_FINISHED"); },
        error: reject,
        complete: resolve,
      }),
    );
    const finishedAfter = Date.now() - started;
    const before = store.listThreads(RESOURCE_ID).threads.length;
    check("(e) RUN_FINISHED arrives before the title resolves", events.at(-1)?.type === EventType.RUN_FINISHED && before === 0, `run took ${finishedAfter}ms, title delay ${TITLE_DELAY_MS}ms, rows at finish ${before}`);
    await new Promise((r) => setTimeout(r, TITLE_DELAY_MS + 200));
    const after = store.listThreads(RESOURCE_ID);
    console.log("   lookup:", JSON.stringify(after));
    check("(e) route-shaped lookup returns the title afterwards", after.threads[0]?.id === "t-title" && after.threads[0]?.title === "Greeting chat");

    const errors: unknown[] = [];
    const failing = makeBridge(saver, new RecordingModel(["A1"]), "trimmed", [], {
      model: new (class extends RecordingModel { async _generate(): Promise<never> { throw new Error("title boom"); } })([]),
      store,
      resourceId: RESOURCE_ID,
      delayMs: 10,
      onError: (e) => errors.push(e),
    });
    const evs = await runOnce(failing, input("t-fail", "r1", [user("u1", "hi")]));
    await new Promise((r) => setTimeout(r, 100));
    check("(e) failing title generator does not fail the run", evs.at(-1)?.type === EventType.RUN_FINISHED && errors.length === 1 && !store.has("t-fail"));
  }

  console.log(failed ? "\nRESULT: at least one FAIL" : "\nRESULT: all PASS");
  process.exit(failed ? 1 : 0);
};

main().catch((e) => { console.error(e); process.exit(1); });
