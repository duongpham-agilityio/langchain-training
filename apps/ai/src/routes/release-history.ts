import type { Pool } from "pg";
import { Hono } from "hono";
import { z } from "zod";

// Constants
import {
  LATEST_RELEASE_VERSION_PATH,
  NEXT_RELEASE_VERSION_PATH,
  RELEASE_HISTORY_PATH,
} from "@/constants";

// DB
import {
  getLatestReleaseVersion,
  getReleaseHistory,
  InvalidCursorError,
  listReleaseHistory,
  saveReleaseHistory,
} from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import {
  GetReleaseHistoryQuerySchema,
  ListReleaseHistoryQuerySchema,
  NextReleaseVersionRequestSchema,
  SaveReleaseHistoryRequestSchema,
} from "@/schemas";

// Utils
import { nextVersion } from "@/utils";

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

  // No web client calls this route.
  // Before `/:id`, or "latest-version" would be read as a record id and answer 404.
  routes.get(LATEST_RELEASE_VERSION_PATH, async (c) => {
    return c.json({ version: await getLatestReleaseVersion(pool, c.get("userId")) });
  });

  // No web client calls this route.
  routes.post(NEXT_RELEASE_VERSION_PATH, async (c) => {
    const body = NextReleaseVersionRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.message }, 400);
    const { previousVersion, changes, statedVersion } = body.data;
    return c.json({ version: nextVersion(previousVersion, changes, statedVersion) });
  });

  routes.get(`${RELEASE_HISTORY_PATH}/:id`, async (c) => {
    const id = c.req.param("id");
    // A non-uuid id would make Postgres throw on the cast; it can only be "not found".
    if (!z.uuid().safeParse(id).success) return c.json({ error: "Not found" }, 404);
    const query = GetReleaseHistoryQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.message }, 400);
    const record = await getReleaseHistory(pool, c.get("userId"), id, query.data.format);
    return record ? c.json(record) : c.json({ error: "Not found" }, 404);
  });

  routes.post(RELEASE_HISTORY_PATH, async (c) => {
    const body = SaveReleaseHistoryRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.message }, 400);
    return c.json(await saveReleaseHistory(pool, c.get("userId"), body.data), 201);
  });

  return routes;
};
