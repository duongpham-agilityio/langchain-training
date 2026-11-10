import {
  DEFAULT_CORS_ORIGIN,
  DEFAULT_FALLBACK_MODEL,
  DEFAULT_GUARD_MODEL,
  DEFAULT_MODEL,
  DEFAULT_PORT,
  RUNTIME_BASE_PATH,
} from "@/constants";

// Fail at startup, naming the variable, instead of deep inside a request.
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
  langsmith: {
    apiKey: process.env.LANGSMITH_API_KEY,
    project: process.env.LANGSMITH_PROJECT,
  },
  runtimeBasePath: RUNTIME_BASE_PATH,
} as const;
