import type { Pool } from "pg";
import { Hono } from "hono";

// Constants
import { CHANGELOG_PATH } from "@/constants";

// DB
import { listChangelog } from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import { ChangelogQuerySchema } from "@/schemas";

// Utils
import { InvalidChangelogCursorError } from "@/utils";

/** `GET /api/changelog`: covered by the `/api/*` guard; every query is scoped to `c.get("userId")`. */
export const createChangelogRoute = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.get(CHANGELOG_PATH, async (c) => {
    const query = ChangelogQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.message }, 400);
    try {
      return c.json(await listChangelog(pool, c.get("userId"), query.data));
    } catch (error) {
      if (error instanceof InvalidChangelogCursorError) return c.json({ error: error.message }, 400);
      throw error;
    }
  });

  return routes;
};
