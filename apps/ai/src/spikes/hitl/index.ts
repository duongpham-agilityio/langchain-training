import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { createSpikeAgent, recordedActions, SPIKE_AGENT_ID } from "./agent";

// Spike entry (M-05): own port, no config.ts, no env, no keys. Throwaway.
const SPIKE_PORT = 4100;
const SPIKE_BASE_PATH = "/api/copilotkit";
const SPIKE_CORS_ORIGIN = "http://localhost:5173";

const runtime = new CopilotRuntime({
  agents: { [SPIKE_AGENT_ID]: createSpikeAgent() },
  runner: new InMemoryAgentRunner(),
});

const app = new Hono();
app.use(logger());
app.use("*", cors({ origin: SPIKE_CORS_ORIGIN }));

app.get("/spike/actions", (c) => c.json(recordedActions));
app.delete("/spike/actions", (c) => {
  recordedActions.length = 0;
  return c.json(recordedActions);
});

app.route(
  "/",
  createCopilotEndpoint({
    runtime,
    basePath: SPIKE_BASE_PATH,
    cors: { origin: SPIKE_CORS_ORIGIN },
  }),
);

serve({ fetch: app.fetch, port: SPIKE_PORT }, ({ port }) => {
  console.log(`[spike:hitl] http://localhost:${port}${SPIKE_BASE_PATH}`);
});
