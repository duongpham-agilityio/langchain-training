// Version-agnostic repro for GF-13 (#119) and GF-14 (#120). Run with SRC=<apps/ai/src> from apps/ai.
// Drives the real ReleaseNotesAguiAgent + title scheduler (+ thread gate when the code has one) over an
// in-memory fake Pool (no Postgres reachable). Prints what it OBSERVES; never asserts the fix exists.
process.env.OPENAI_API_KEY ??= "x";
process.env.SUPABASE_URL ??= "http://localhost";
process.env.SUPABASE_ANON_KEY ??= "x";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "x";
process.env.DATABASE_URL ??= "postgres://x";
const SRC = process.env.SRC!;

type Row = { id: string; owner_id: string; title: string; created_at: number; updated_at: number };
const rows = new Map<string, Row>();
let clock = 1_000_000;
const tick = () => (clock += 1000);
const fakePool = {
  async query(sql: string, params: unknown[] = []) {
    const s = sql.replace(/\s+/g, " ").trim().toLowerCase();
    if (s.startsWith("insert into") && s.includes("do nothing")) {
      const [id, owner, title = ""] = params as string[];
      if (!rows.has(id)) { const t = tick(); rows.set(id, { id, owner_id: owner, title, created_at: t, updated_at: t }); }
      return { rows: [], rowCount: 1 };
    }
    if (s.startsWith("insert into") && s.includes("do update set title")) {
      const [id, owner, title] = params as string[];
      const row = rows.get(id);
      if (!row) { const t = tick(); rows.set(id, { id, owner_id: owner, title, created_at: t, updated_at: t }); }
      else if (row.title === "" && row.owner_id === owner) row.title = title;
      return { rows: [], rowCount: 1 };
    }
    if (s.startsWith("update")) {
      const [owner, id] = params as string[];
      const row = rows.get(id);
      if (row && row.owner_id === owner) { row.updated_at = tick(); return { rows: [], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }
    if (s.startsWith("select owner_id from")) {
      const row = rows.get(params[0] as string);
      return { rows: row ? [{ owner_id: row.owner_id }] : [], rowCount: row ? 1 : 0 };
    }
    if (s.startsWith("select 1 from")) {
      const [owner, id] = params as string[];
      const row = rows.get(id);
      const hit = !!row && row.owner_id === owner && (!s.includes("title <> ''") || row.title !== "");
      return { rows: hit ? [{}] : [], rowCount: hit ? 1 : 0 };
    }
    throw new Error(`fake pool: unhandled query: ${s}`);
  },
};

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const { userContext } = await import(`${SRC}/utils/user-context.ts`);
  const { createThreadTitleScheduler } = await import(`${SRC}/utils/schedule-thread-title.ts`);
  const { createAguiAgent } = await import(`${SRC}/agui/index.ts`);
  const gateMod = await import(`${SRC}/utils/thread-gate.ts`).catch(() => null);
  const { AIMessageChunk } = await import("@langchain/core/messages");
  const pool = fakePool as never;
  const gate = gateMod ? gateMod.createThreadGate(pool) : undefined;
  console.log(`code under test: thread gate ${gate ? "present" : "ABSENT"}`);

  let titleFails = false;
  const model = { async invoke() { if (titleFails) throw new Error("title model down"); return { text: "A title" }; } };
  const scheduler = createThreadTitleScheduler(pool, model as never);

  let getStateCalls = 0;
  let release: (() => void) | null = null;
  let hold = false;
  const stub = {
    async getState() { getStateCalls += 1; return { values: { messages: [] } }; },
    async stream() {
      return (async function* () {
        if (hold) await new Promise<void>((r) => { release = r; });
        yield ["messages", [new AIMessageChunk({ content: "hello" })]];
      })();
    },
  };
  const agent = createAguiAgent(stub as never, scheduler, undefined, undefined, gate);
  const run = (userId: string, threadId: string) =>
    new Promise<string[]>((resolve) => {
      const types: string[] = [];
      userContext.run({ userId, timeZone: "UTC" }, () => {
        agent.run({ threadId, runId: "r", state: {}, tools: [], context: [], forwardedProps: {},
          messages: [{ id: "m1", role: "user", content: "hi" }] } as never).subscribe({
          next: (e: { type: string }) => types.push(e.type),
          error: () => resolve(types),
          complete: () => resolve(types),
        });
      });
    });
  const show = (r?: Row) => (r ? `row{owner=${r.owner_id.slice(-1)}, title=${JSON.stringify(r.title)}, updated>created=${r.updated_at > r.created_at}}` : "no row");

  console.log("\n== #119 case 1: B opens A's existing thread ==");
  console.log("A run t1:", (await run(A, "t1")).join(","));
  await sleep(30);
  console.log("after A:", show(rows.get("t1")));
  const calls = getStateCalls;
  const b1 = await run(B, "t1");
  console.log("B run t1:", b1.join(","), `| graph state read by B: ${getStateCalls - calls > 0}`);
  console.log(b1.includes("RUN_ERROR") ? "RESULT: refused" : "RESULT: BUG - B continued A's thread");

  console.log("\n== #119 case 2: B joins A's thread during A's first turn (before any title) ==");
  hold = true;
  const aRun = run(A, "t2");
  await sleep(30);
  console.log("while A's first turn is running:", show(rows.get("t2")));
  hold = false;
  const b2 = await run(B, "t2");
  console.log("B run t2:", b2.join(","));
  console.log(b2.includes("RUN_ERROR") ? "RESULT: refused" : "RESULT: BUG - first turn unprotected, B continued");
  release?.(); await aRun; await sleep(30);

  console.log("\n== #120 case 3: A uses an old thread again ==");
  await run(A, "t3"); await sleep(30);
  const afterFirst = rows.get("t3") && { ...rows.get("t3")! };
  await run(A, "t3"); await sleep(30);
  console.log("after turn 1:", show(afterFirst as Row | undefined), "| after turn 2:", show(rows.get("t3")));
  console.log(rows.get("t3") && rows.get("t3")!.updated_at > rows.get("t3")!.created_at
    ? "RESULT: updated_at moved" : "RESULT: BUG - updated_at === created_at after reuse (thread never moves)");

  console.log("\n== #120 case 4: title call fails on the first turn ==");
  titleFails = true;
  const t4 = await run(A, "t4"); await sleep(30);
  console.log("A run t4:", t4.join(","), "|", show(rows.get("t4")));
  console.log(rows.has("t4") ? "RESULT: row exists (titled later)" : "RESULT: BUG - no row at all after a completed turn");
  titleFails = false;
  await run(A, "t4"); await sleep(30);
  console.log("next turn, title works:", show(rows.get("t4")));
  process.exit(0);
};
main().catch((e) => { console.error("REPRO ERROR:", e instanceof Error ? e.message : e); process.exit(2); });
