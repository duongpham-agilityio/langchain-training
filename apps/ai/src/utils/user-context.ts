import { AsyncLocalStorage } from "node:async_hooks";

// Constants
import { DEFAULT_TIME_ZONE } from "@/constants";

/**
 * The CopilotKit runtime hands the agent only AG-UI input, not the Hono context, so the
 * verified user id and the browser time zone travel beside the request here (set in `userContextMiddleware`).
 */
export const userContext = new AsyncLocalStorage<{ userId: string; timeZone: string }>();

/** Browser zone of the current request, or the default outside a request. */
export const getUserTimeZone = (): string => userContext.getStore()?.timeZone ?? DEFAULT_TIME_ZONE;
