import type { Pool } from "pg";
import { Hono } from "hono";

// Constants
import { THREADS_PATH } from "@/constants";

// DB
import { listThreads } from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

/** Covered by the `/api/*` guard; every query is scoped to `c.get("userId")`. */
export const createThreadsRoute = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.get(THREADS_PATH, async (c) => c.json({ threads: await listThreads(pool, c.get("userId")) }));

  return routes;
};
