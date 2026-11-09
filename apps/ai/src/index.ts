import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { createBaseAgent } from "@/agent";
import { createAguiAgent } from "@/agui";
import { config } from "@/config";
import { CORS_ALLOWED_HEADERS, HEALTH_PATH, RELEASE_COPILOT_AGENT_ID } from "@/constants";
import { checkDatabase, createPgPool, createSupabaseAdminClient } from "@/db";

const runtime = new CopilotRuntime({
  agents: { [RELEASE_COPILOT_AGENT_ID]: createAguiAgent(createBaseAgent()) },
  runner: new InMemoryAgentRunner(),
});

// The pool connects lazily, so bad credentials surface in /health instead of crashing startup.
const pgPool = createPgPool();
// Not used yet; kept for upcoming tickets that need server-side Supabase access.
export const supabaseAdmin = createSupabaseAdminClient();

const app = new Hono();
app.use(logger());
// Global CORS so every route (not only CopilotKit's) accepts the Authorization header.
app.use("*", cors({ origin: config.corsOrigin, allowHeaders: CORS_ALLOWED_HEADERS }));

app.get(HEALTH_PATH, async (c) => {
  const db = await checkDatabase(pgPool);
  return c.json({ ok: db.reachable, db }, db.reachable ? 200 : 503);
});

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
