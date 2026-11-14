import { createMiddleware } from "langchain";
import type { BaseStore } from "@langchain/langgraph";

// Db
import { getUserPreferences } from "@/db";

// Utils
import { buildUserTemplateBlock, userContext } from "@/utils";

/**
 * Reads the user's saved template (F-16 store) on every model call and appends it to the end of the
 * system message, so a change applies to the next generation in any thread. The static prompt is left
 * untouched and the block comes last, which keeps the cacheable prefix identical across users.
 * The owner comes from the verified request context. A missing user, an empty record or a store error
 * leaves the request as it is (a store outage must not break chat).
 */
export const createUserTemplateMiddleware = (store: BaseStore) =>
  createMiddleware({
    name: "UserTemplateMiddleware",
    wrapModelCall: async (request, handler) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) return handler(request);
      try {
        const block = buildUserTemplateBlock(await getUserPreferences(store, userId));
        if (!block) return handler(request);
        return handler({ ...request, systemMessage: request.systemMessage.concat(`\n\n${block}`) });
      } catch (error) {
        console.error(`[ai] user template read failed: ${error instanceof Error ? error.message : String(error)}`);
        return handler(request);
      }
    },
  });
