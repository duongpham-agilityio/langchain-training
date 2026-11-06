import {
  DEFAULT_CORS_ORIGIN,
  DEFAULT_MODEL,
  DEFAULT_PORT,
  RUNTIME_BASE_PATH,
} from "@/constants";

export const config = {
  port: Number(process.env.AI_PORT ?? DEFAULT_PORT),
  corsOrigin: (process.env.AI_CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN).split(","),
  model: process.env.AI_MODEL ?? DEFAULT_MODEL,
  runtimeBasePath: RUNTIME_BASE_PATH,
} as const;
