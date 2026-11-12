import { Hono } from "hono";

// Constants
import { RELEASE_EMAIL_RENDER_PATH } from "@/constants";

// Schemas
import { ReleaseSchema } from "@/schemas";

// Utils
import { renderReleaseEmail } from "@/utils";

export const createReleaseEmailRoute = () => {
  const route = new Hono();

  route.post(RELEASE_EMAIL_RENDER_PATH, async (c) => {
    // A non-JSON body is treated like any other invalid body.
    const body = await c.req.json().catch(() => undefined);
    const parsed = ReleaseSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: "Invalid release" }, 400);

    return c.json(renderReleaseEmail(parsed.data));
  });

  return route;
};
