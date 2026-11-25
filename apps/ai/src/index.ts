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
import { type AuthEnv, createIdentifyRunUser, createIdentifyUser, createRequireAuth } from "@/middlewares";
import { startScheduler } from "@/services";
import {
  createChangelogRoute,
  createCronRoute,
  createReleaseEmailRoute,
  createProjectsRoute,
  createReleaseHistoryRoutes,
  createSharedPagesRoute,
  createSlackRoute,
  createThreadsRoute,
} from "@/routes";
import {
  configureTracing,
  createAnswerEvaluationScheduler,
  createProjectGate,
  createPromptInjectionGuard,
  createThreadGate,
  createThreadTitleScheduler,
} from "@/utils";

// The pool connects lazily, so bad credentials surface in /health instead of crashing startup.
const pgPool = createPgPool();

// Agent state and pending approvals live in Postgres, so they survive a restart. The chat replay does not: the default in-memory runner keeps it in RAM and loses it on restart (accepted for this practice app).
const checkpointer = await createCheckpointer(pgPool);
await ensureThreadsTable(pgPool);
// Per-user long-term memory (tone, style, opening line); created after the schema exists, survives restarts.
const userMemoryStore = await createUserMemoryStore();

// Tracing follows the key: set = traces (tagged with thread and user id), empty = off.
const tracingEnabled = configureTracing(config.langsmith);
console.log(`[ai] LangSmith tracing ${tracingEnabled ? "on" : "off"}`);

// Which models the app is configured for, and which host they are called on (host only, never the key).
const modelHost = (() => {
  if (!config.openaiBaseUrl) return "OpenAI default";
  try {
    return new URL(config.openaiBaseUrl).host;
  } catch {
    return "invalid OPENAI_BASE_URL";
  }
})();
console.log(
  `[ai] models: main=${config.model} fallback=${config.fallbackModel} guard=${config.guardModel} (host: ${modelHost})`,
);

// No key, no client: the evaluation scheduler is then a no-op.
const langsmithClient = config.langsmith.apiKey
  ? new Client({ apiKey: config.langsmith.apiKey })
  : undefined;

export const supabaseAdmin = createSupabaseAdminClient();

// Built once; the AG-UI agent runs it with the Postgres checkpointer.
const baseAgent = createBaseAgent(pgPool, { checkpointer, store: userMemoryStore });

const runtime = new CopilotRuntime({
  agents: {
    [RELEASE_COPILOT_AGENT_ID]: createAguiAgent(
      baseAgent,
      createThreadTitleScheduler(pgPool, new ChatOpenAI({ model: config.model })),
      createPromptInjectionGuard(new ChatOpenAI({ model: config.guardModel, temperature: 0 })),
      createAnswerEvaluationScheduler(langsmithClient),
      createThreadGate(pgPool),
      createIdentifyRunUser(supabaseAdmin),
      createProjectGate(pgPool),
    ),
  },
  // Scopes every runtime thread operation to the verified caller (a thread id alone is no longer enough).
  identifyUser: createIdentifyUser(supabaseAdmin),
});

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
app.route("/", createSlackRoute(pgPool));
app.route("/", createProjectsRoute(pgPool));
app.route("/", createThreadsRoute(pgPool));
app.route("/", createChangelogRoute(pgPool));
app.route("/", createReleaseEmailRoute());
// Public, unlike the routes above: a shared changelog page opens from a link with no session.
app.route("/", createSharedPagesRoute(pgPool));
// Not behind requireAuth: Vercel Cron has no user session; the route checks CRON_SECRET itself.
app.route("/", createCronRoute(pgPool));

app.get(HEALTH_PATH, async (c) => {
  const db = await checkDatabase(pgPool);
  // Model names only (dev aid: which model createAgent really got); never keys or the base URL.
  const models = { main: config.model, fallback: config.fallbackModel, guard: config.guardModel };
  return c.json({ ok: db.reachable, db, models }, db.reachable ? 200 : 503);
});

app.route(
  "/",
  createCopilotEndpoint({
    runtime,
    basePath: config.runtimeBasePath,
    cors: { origin: config.corsOrigin },
  }),
);

// Vercel runs this file as a function: it needs the default-exported app, not a listening server,
// and a setInterval poller does not survive between invocations there.
if (!process.env.VERCEL) {
  // Sends due scheduled jobs with or without a browser; several instances are safe (atomic claim).
  const stopScheduler = startScheduler(pgPool);
  process.once("SIGTERM", stopScheduler);

  serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
    console.log(`[ai] CopilotKit runtime on http://localhost:${port}${config.runtimeBasePath}`);
  });
}

export default app;
