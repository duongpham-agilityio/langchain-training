import { createMiddleware } from "hono/factory";

// Constants
import { TIME_ZONE_HEADER } from "@/constants";

// Utils
import { resolveTimeZone, userContext } from "@/utils";

import type { AuthEnv } from "./auth";

/** Must run after `createRequireAuth`: keeps the user id and browser time zone readable for the whole request, agent run included. */
export const userContextMiddleware = createMiddleware<AuthEnv>((c, next) =>
  userContext.run(
    { userId: c.get("userId"), timeZone: resolveTimeZone(c.req.header(TIME_ZONE_HEADER)) },
    next,
  ),
);
