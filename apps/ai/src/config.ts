import {
  DEFAULT_CORS_ORIGIN,
  DEFAULT_EMAIL_FROM,
  DEFAULT_FALLBACK_MODEL,
  DEFAULT_GUARD_MODEL,
  DEFAULT_MODEL,
  DEFAULT_PORT,
  SCHEDULER_MAX_ATTEMPTS,
  SCHEDULER_POLL_INTERVAL_MS,
  SCHEDULER_STUCK_JOB_TIMEOUT_MS,
  RUNTIME_BASE_PATH,
} from "@/constants";

// Fail at startup, naming the variable, instead of deep inside a request.
// Positive integer from the environment, otherwise the default (a typo must not stop the poller).
const positiveInt = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.AI_PORT ?? DEFAULT_PORT),
  corsOrigin: (process.env.AI_CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN).split(","),
  model: process.env.AI_MODEL ?? DEFAULT_MODEL,
  fallbackModel: process.env.AI_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
  guardModel: process.env.AI_GUARD_MODEL ?? DEFAULT_GUARD_MODEL,
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    anonKey: requireEnv("SUPABASE_ANON_KEY"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  databaseUrl: requireEnv("DATABASE_URL"),
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  // Optional: empty string counts as unset, so the server starts without email.
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  emailFrom: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
  scheduler: {
    // SCHEDULER_ENABLED=false turns the poller off (for example on a second instance that only serves HTTP).
    enabled: process.env.SCHEDULER_ENABLED !== "false",
    pollIntervalMs: positiveInt("SCHEDULER_POLL_INTERVAL_MS", SCHEDULER_POLL_INTERVAL_MS),
    maxAttempts: positiveInt("SCHEDULER_MAX_ATTEMPTS", SCHEDULER_MAX_ATTEMPTS),
    stuckJobTimeoutMs: positiveInt("SCHEDULER_STUCK_JOB_TIMEOUT_MS", SCHEDULER_STUCK_JOB_TIMEOUT_MS),
  },
  langsmith: {
    apiKey: process.env.LANGSMITH_API_KEY,
    project: process.env.LANGSMITH_PROJECT,
  },
  runtimeBasePath: RUNTIME_BASE_PATH,
} as const;
