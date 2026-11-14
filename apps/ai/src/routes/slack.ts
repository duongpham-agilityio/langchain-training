import type { Pool } from "pg";
import { Hono } from "hono";

// Constants
import { SLACK_ERROR_MESSAGES, SLACK_PUBLISH_PATH } from "@/constants";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import { SlackPublishRequestSchema } from "@/schemas";

// Services
import { sendReleaseToSlack } from "@/services";

/** Mounted behind `createRequireAuth`. Sends the Slack rendering of one of the caller's stored releases. */
export const createSlackRoute = (pool: Pool) => {
  const route = new Hono<AuthEnv>();

  route.post(SLACK_PUBLISH_PATH, async (c) => {
    // A non-JSON body is treated like any other invalid body.
    const body = await c.req.json().catch(() => undefined);
    const parsed = SlackPublishRequestSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: SLACK_ERROR_MESSAGES.INVALID_REQUEST }, 400);

    const result = await sendReleaseToSlack(pool, c.get("userId"), parsed.data.releaseId);
    return result.ok ? c.json({ ok: true }) : c.json({ error: result.error }, result.status);
  });

  return route;
};
