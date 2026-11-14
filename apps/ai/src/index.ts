import { serve } from "@hono/node-server";
import { ChatOpenAI } from "@langchain/openai";
import { Client } from "langsmith";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { CopilotRuntime, createCopilotEndpoint } from "@copilotkit/runtime/v2";
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
import {
  checkDatabase,
  createCheckpointer,
  createPgPool,
  createSupabaseAdminClient,
  createUserMemoryStore,
  ensureThreadsTable,
} from "@/db";
import { type AuthEnv, createIdentifyUser, createRequireAuth, userContextMiddleware } from "@/middlewares";
import { createCheckpointAgentRunner } from "@/runner";
import {
  createChangelogRoute,
  createReleaseEmailRoute,
  createReleaseHistoryRoutes,
  createSlackRoute,
  createThreadsRoute,
} from "@/routes";
import {
  configureTracing,
  createAnswerEvaluationScheduler,
  createPromptInjectionGuard,
  createThreadGate,
  createThreadTitleScheduler,
} from "@/utils";

// The pool connects lazily, so bad credentials surface in /health instead of crashing startup.
const pgPool = createPgPool();

// Threads and pending approvals live in Postgres, so they survive a restart. The runner below replays a thread from the checkpoint after a restart.
const checkpointer = await createCheckpointer(pgPool);
await ensureThreadsTable(pgPool);
// Per-user long-term memory (tone, style, opening line); created after the schema exists, survives restarts.
const userMemoryStore = await createUserMemoryStore();

// Tracing follows the key: set = traces (tagged with thread and user id), empty = off.
const tracingEnabled = configureTracing(config.langsmith);
console.log(`[ai] LangSmith tracing ${tracingEnabled ? "on" : "off"}`);

// No key, no client: the evaluation scheduler is then a no-op.
const langsmithClient = config.langsmith.apiKey
  ? new Client({ apiKey: config.langsmith.apiKey })
  : undefined;

export const supabaseAdmin = createSupabaseAdminClient();

// One agent for both: the AG-UI agent runs it, the runner reads its checkpoint to replay a thread after a restart.
const baseAgent = createBaseAgent(pgPool, { checkpointer, store: userMemoryStore });

const runtime = new CopilotRuntime({
  agents: {
    [RELEASE_COPILOT_AGENT_ID]: createAguiAgent(
      baseAgent,
      createThreadTitleScheduler(pgPool, new ChatOpenAI({ model: config.model })),
      createPromptInjectionGuard(new ChatOpenAI({ model: config.guardModel, temperature: 0 })),
      createAnswerEvaluationScheduler(langsmithClient),
      createThreadGate(pgPool),
    ),
  },
  // Scopes every runtime thread operation to the verified caller (a thread id alone is no longer enough).
  identifyUser: createIdentifyUser(supabaseAdmin),
  runner: createCheckpointAgentRunner(baseAgent, pgPool),
});

const app = new Hono<AuthEnv>();
app.use(logger());
// Global CORS so every route (not only CopilotKit's) accepts the Authorization header.
app.use("*", cors({ origin: config.corsOrigin, allowHeaders: CORS_ALLOWED_HEADERS }));
// Every /api route needs a valid Supabase session; /health is registered outside it and stays public.
const requireAuth = createRequireAuth(supabaseAdmin);
app.use(API_PATH_PATTERN, requireAuth);
// Lets the agent run (which only sees AG-UI input) know the verified owner for the thread row.
app.use(API_PATH_PATTERN, userContextMiddleware);
// The web client calls History at /release-history (no /api prefix), so it needs its own guard.
app.use(RELEASE_HISTORY_PATH, requireAuth);
app.use(RELEASE_HISTORY_PATH_PATTERN, requireAuth);
// Outside /api too, so the default release date follows the browser zone on these routes.
app.use(RELEASE_HISTORY_PATH, userContextMiddleware);
app.use(RELEASE_HISTORY_PATH_PATTERN, userContextMiddleware);
app.route("/", createReleaseHistoryRoutes(pgPool));
app.use(SLACK_PATH_PATTERN, requireAuth);
app.use(SLACK_PATH_PATTERN, userContextMiddleware);
app.route("/", createSlackRoute(pgPool));
app.route("/", createThreadsRoute(pgPool));
app.route("/", createChangelogRoute(pgPool));
app.route("/", createReleaseEmailRoute());

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
