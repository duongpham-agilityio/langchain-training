import type { Pool } from "pg";
import { Hono } from "hono";

// Constants
import { PROJECTS_PATH } from "@/constants";

// DB
import { createProject, listProjects } from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import { CreateProjectRequestSchema } from "@/schemas";

/** Covered by the `/api/*` guard; every query is scoped to `c.get("userId")`. */
export const createProjectsRoute = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.post(PROJECTS_PATH, async (c) => {
    const body = CreateProjectRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.message }, 400);
    return c.json(await createProject(pool, c.get("userId"), body.data.name), 201);
  });

  routes.get(PROJECTS_PATH, async (c) => c.json({ projects: await listProjects(pool, c.get("userId")) }));

  return routes;
};
