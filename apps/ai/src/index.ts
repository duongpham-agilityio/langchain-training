import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { createBaseAgent } from "@/agent";
import { createAguiAgent } from "@/agui";
import { config } from "@/config";
import { RELEASE_COPILOT_AGENT_ID } from "@/constants";

const runtime = new CopilotRuntime({
  agents: { [RELEASE_COPILOT_AGENT_ID]: createAguiAgent(createBaseAgent()) },
  runner: new InMemoryAgentRunner(),
});

const app = new Hono();
app.use(logger());

app.get("/health", (c) => c.json({ ok: true }));

app.route(
  "/",
  createCopilotEndpoint({
    runtime,
    basePath: config.runtimeBasePath,
    cors: { origin: config.corsOrigin },
  }),
);

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`[ai] CopilotKit runtime on http://localhost:${port}${config.runtimeBasePath}`);
});
