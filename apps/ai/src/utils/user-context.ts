import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The CopilotKit runtime hands the agent only AG-UI input, not the Hono context, so the
 * verified user id travels beside the request here (set in `userContextMiddleware`).
 */
export const userContext = new AsyncLocalStorage<{ userId: string }>();
