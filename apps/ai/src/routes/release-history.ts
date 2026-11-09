import type { Pool } from "pg";
import { Hono } from "hono";
import { z } from "zod";

// Constants
import { RELEASE_HISTORY_PATH } from "@/constants";

// DB
import {
  getReleaseHistory,
  InvalidCursorError,
  listReleaseHistory,
  saveReleaseHistory,
} from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import { ListReleaseHistoryQuerySchema, SaveReleaseHistoryRequestSchema } from "@/schemas";

/** Mounted behind `createRequireAuth`; every query is scoped to `c.get("userId")`. */
export const createReleaseHistoryRoutes = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.get(RELEASE_HISTORY_PATH, async (c) => {
    const query = ListReleaseHistoryQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.message }, 400);
    try {
      return c.json(await listReleaseHistory(pool, c.get("userId"), query.data));
    } catch (error) {
      if (error instanceof InvalidCursorError) return c.json({ error: error.message }, 400);
      throw error;
    }
  });

  routes.get(`${RELEASE_HISTORY_PATH}/:id`, async (c) => {
    const id = c.req.param("id");
    // A non-uuid id would make Postgres throw on the cast; it can only be "not found".
    if (!z.uuid().safeParse(id).success) return c.json({ error: "Not found" }, 404);
    const record = await getReleaseHistory(pool, c.get("userId"), id);
    return record ? c.json(record) : c.json({ error: "Not found" }, 404);
  });

  routes.post(RELEASE_HISTORY_PATH, async (c) => {
    const body = SaveReleaseHistoryRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.message }, 400);
    return c.json(await saveReleaseHistory(pool, c.get("userId"), body.data), 201);
  });

  return routes;
};
