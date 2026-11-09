import { createFrontendToolAgent } from "./frontend-tool-route";
import { ForwardingAgent } from "./forwarding-route";

/** SPIKE: prints the AG-UI events each route emits. `tsx src/spikes/tool-stream/events.ts` */
const base = {
  threadId: "t1",
  runId: "r1",
  state: {},
  context: [],
  forwardedProps: {},
  tools: [
    {
      name: "renderReleaseNotesPreview",
      description: "Render preview",
      parameters: { type: "object", properties: { platform: { type: "string" } }, required: ["platform"] },
    },
  ],
  messages: [{ id: "u1", role: "user", content: "write notes" }],
} as never;

for (const [name, agent] of [
  ["A frontend-tool", createFrontendToolAgent()],
  ["B forwarding", new ForwardingAgent()],
] as const) {
  console.log(`\n=== ${name}`);
  const t0 = Date.now();
  await new Promise<void>((resolve) =>
    (agent as { run: (i: never) => import("rxjs").Observable<Record<string, unknown>> }).run(base).subscribe({
      next: (e) => console.log(`+${String(Date.now() - t0).padStart(4)}ms`, e.type, JSON.stringify(e.delta ?? e.toolCallName ?? e.content ?? "")),
      complete: resolve,
      error: (err) => { console.log("ERR", String(err)); resolve(); },
    }),
  );
}
