import type { Pool } from "pg";
import { tool } from "langchain";

// Constants
import {
  CHANGELOG_TOOL_LIMIT,
  CHANGELOG_TOOL_MESSAGES,
  GET_CHANGELOG_DESCRIPTION,
  TOOL_NAMES,
} from "@/constants";

// Db
import { listChangelog } from "@/db";

// Schemas
import { getChangelogSchema } from "@/schemas";

// Utils
import { ChangelogRangeError, getUserTimeZone, resolveChangelogRange, userContext } from "@/utils";

/**
 * Read-only changelog for the agent (F-28). The owner and the time zone come from the verified
 * request context, never from model arguments, so another user's releases cannot be asked for.
 */
export const createGetChangelog = (pool: Pool) =>
  tool(
    async (input) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) return JSON.stringify({ ok: false, error: CHANGELOG_TOOL_MESSAGES.NO_USER });
      try {
        const range = resolveChangelogRange(input, new Date(), getUserTimeZone());
        const { releases, nextCursor } = await listChangelog(pool, userId, {
          ...range,
          limit: CHANGELOG_TOOL_LIMIT,
        });
        return JSON.stringify({ ok: true, range, releases, truncated: nextCursor !== null });
      } catch (error) {
        if (error instanceof ChangelogRangeError) {
          return JSON.stringify({ ok: false, error: error.message });
        }
        throw error;
      }
    },
    {
      name: TOOL_NAMES.getChangelog,
      description: GET_CHANGELOG_DESCRIPTION,
      schema: getChangelogSchema,
    },
  );
