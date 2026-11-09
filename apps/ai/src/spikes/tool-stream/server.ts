import { serve } from "@hono/node-server";
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createFrontendToolAgent } from "./frontend-tool-route";
import { ForwardingAgent } from "./forwarding-route";

/** SPIKE (M-04, throwaway): `pnpm --filter @training/ai exec tsx src/spikes/tool-stream/server.ts` */
const PORT = 4010;

const runtime = new CopilotRuntime({
  agents: { spikeFrontendTool: createFrontendToolAgent(), spikeForwarding: new ForwardingAgent() },
  runner: new InMemoryAgentRunner(),
});

const app = new Hono();
app.use("*", cors({ origin: ["http://localhost:5194"], allowHeaders: ["Authorization", "Content-Type"] }));
app.route("/", createCopilotEndpoint({ runtime, basePath: "/api/copilotkit", cors: { origin: ["http://localhost:5194"] } }));
serve({ fetch: app.fetch, port: PORT }, () => console.log(`[spike] http://localhost:${PORT}/api/copilotkit`));
