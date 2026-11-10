import { createMiddleware } from "hono/factory";

// Utils
import { userContext } from "@/utils";

import type { AuthEnv } from "./auth";

/** Must run after `createRequireAuth`: keeps the user id readable for the whole request, agent run included. */
export const userContextMiddleware = createMiddleware<AuthEnv>((c, next) =>
  userContext.run({ userId: c.get("userId") }, next),
);
