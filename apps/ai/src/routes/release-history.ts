import type { Pool } from "pg";
import { Hono } from "hono";
import { z } from "zod";

// Constants
import {
  PROJECT_NOT_FOUND_MESSAGE,
  RELEASE_HISTORY_PATH,
  SCHEDULED_SENDS_PATH,
} from "@/constants";

// DB
import {
  findOwnedProject,
  cancelScheduledSend,
  getReleaseHistory,
  listReleaseSendRows,
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
  SaveReleaseHistoryRequestSchema,
} from "@/schemas";

// Utils
import { buildReleaseSendEntries } from "@/utils";

/** Mounted behind `createRequireAuth`; every query is scoped to `c.get("userId")`. */
export const createReleaseHistoryRoutes = (pool: Pool) => {
  const routes = new Hono<AuthEnv>();

  routes.get(RELEASE_HISTORY_PATH, async (c) => {
    const query = ListReleaseHistoryQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.message }, 400);
    // A project filter must be one of the caller's own projects.
    if (query.data.projectId && !(await findOwnedProject(pool, c.get("userId"), query.data.projectId))) {
      return c.json({ error: PROJECT_NOT_FOUND_MESSAGE }, 404);
    }
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
    const query = GetReleaseHistoryQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.message }, 400);
    const record = await getReleaseHistory(pool, c.get("userId"), id, query.data.format);
    return record ? c.json(record) : c.json({ error: "Not found" }, 404);
  });

  routes.get(`${RELEASE_HISTORY_PATH}/:id/sends`, async (c) => {
    const id = c.req.param("id");
    if (!z.uuid().safeParse(id).success) return c.json({ error: "Not found" }, 404);
    const { sends, jobs } = await listReleaseSendRows(pool, c.get("userId"), id);
    return c.json({ sends: buildReleaseSendEntries(sends, jobs) });
  });

  routes.post(`${SCHEDULED_SENDS_PATH}/:id/cancel`, async (c) => {
    const id = c.req.param("id");
    if (!z.uuid().safeParse(id).success) return c.json({ error: "Not found" }, 404);
    const result = await cancelScheduledSend(pool, c.get("userId"), id);
    if (result === "not_found") return c.json({ error: "Not found" }, 404);
    if (result === "not_pending") {
      return c.json({ error: "Only a pending send can be cancelled. This one is already sending or finished." }, 409);
    }
    return c.json({ id, status: "cancelled" as const });
  });

  routes.post(RELEASE_HISTORY_PATH, async (c) => {
    const body = SaveReleaseHistoryRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.message }, 400);
    const userId = c.get("userId");
    // Without this check a caller could file a release under someone else's project id.
    if (!(await findOwnedProject(pool, userId, body.data.projectId))) {
      return c.json({ error: PROJECT_NOT_FOUND_MESSAGE }, 404);
    }
    return c.json(await saveReleaseHistory(pool, userId, body.data.projectId, body.data), 201);
  });

  return routes;
};
