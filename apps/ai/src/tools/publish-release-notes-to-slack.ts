import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION,
  SLACK_ERROR_MESSAGES,
  SLACK_TOOL_MESSAGES,
  TOOL_NAMES,
} from "@/constants";

// Db
import { findReleaseId, saveReleaseHistory } from "@/db";

// Schemas
import { PublishReleaseNotesToSlackInputSchema } from "@/schemas";

// Services
import { sendReleaseToSlack } from "@/services";

// Utils
import { userContext } from "@/utils";

/**
 * Factory because it saves to and records in the database. Runs only after `humanInTheLoopMiddleware`
 * got an approval, so a rejection never reaches this body and saves nothing.
 */
export const createPublishReleaseNotesToSlack = (pool: Pool) =>
  tool(
    async ({ release }) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) return SLACK_ERROR_MESSAGES.NOT_SIGNED_IN;

      // An unsaved draft is saved first, so the send always has a History record to attach to.
      const releaseId =
        (await findReleaseId(pool, userId, release)) ??
        (await saveReleaseHistory(pool, userId, { release })).id;

      const result = await sendReleaseToSlack(pool, userId, releaseId);
      return result.ok ? SLACK_TOOL_MESSAGES.PUBLISHED : result.error;
    },
    {
      name: TOOL_NAMES.publishReleaseNotesToSlack,
      description: PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION,
      schema: PublishReleaseNotesToSlackInputSchema,
    },
  );
