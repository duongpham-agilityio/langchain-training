import type { Pool } from "pg";
import { Hono } from "hono";
import { z } from "zod";

// Constants
import { PROJECT_NOT_FOUND_MESSAGE, THREADS_PATH } from "@/constants";

// DB
import { findOwnedProject, listThreads } from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

/** Covered by the `/api/*` guard; every query is scoped to `c.get("userId")`. Optional `?projectId=` filters one project. */
export const createThreadsRoute = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.get(THREADS_PATH, async (c) => {
    const userId = c.get("userId");
    const projectId = c.req.query("projectId");
    if (projectId === undefined) return c.json({ threads: await listThreads(pool, userId) });

    // A malformed id would make Postgres throw on the cast; like a foreign one it can only be "not found".
    if (!z.uuid().safeParse(projectId).success || !(await findOwnedProject(pool, userId, projectId))) {
      return c.json({ error: PROJECT_NOT_FOUND_MESSAGE }, 404);
    }
    return c.json({ threads: await listThreads(pool, userId, projectId) });
  });

  return routes;
};
