import { serve } from "@hono/node-server";
import { MemorySaver } from "@langchain/langgraph";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { createBaseAgent } from "@/agent";
import { createAguiAgent } from "@/agui";
import { config } from "@/config";
import {
  API_PATH_PATTERN,
  CORS_ALLOWED_HEADERS,
  HEALTH_PATH,
  RELEASE_HISTORY_PATH,
  RELEASE_HISTORY_PATH_PATTERN,
  RELEASE_COPILOT_AGENT_ID,
  SLACK_PATH_PATTERN,
} from "@/constants";
import { checkDatabase, createPgPool, createSupabaseAdminClient } from "@/db";
import { type AuthEnv, createRequireAuth } from "@/middlewares";
import { createReleaseHistoryRoutes, createSlackRoute } from "@/routes";

// In memory for now: a pending approval survives only while the server runs (Postgres checkpointer comes with M-22).
const checkpointer = new MemorySaver();

const runtime = new CopilotRuntime({
  agents: { [RELEASE_COPILOT_AGENT_ID]: createAguiAgent(createBaseAgent({ checkpointer })) },
  runner: new InMemoryAgentRunner(),
});

// The pool connects lazily, so bad credentials surface in /health instead of crashing startup.
const pgPool = createPgPool();
export const supabaseAdmin = createSupabaseAdminClient();

const app = new Hono<AuthEnv>();
app.use(logger());
// Global CORS so every route (not only CopilotKit's) accepts the Authorization header.
app.use("*", cors({ origin: config.corsOrigin, allowHeaders: CORS_ALLOWED_HEADERS }));
// Every /api route needs a valid Supabase session; /health is registered outside it and stays public.
const requireAuth = createRequireAuth(supabaseAdmin);
app.use(API_PATH_PATTERN, requireAuth);
// The web client calls History at /release-history (no /api prefix), so it needs its own guard.
app.use(RELEASE_HISTORY_PATH, requireAuth);
app.use(RELEASE_HISTORY_PATH_PATTERN, requireAuth);
app.route("/", createReleaseHistoryRoutes(pgPool));
app.use(SLACK_PATH_PATTERN, requireAuth);
app.route("/", createSlackRoute());

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
