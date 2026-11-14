import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  EMAIL_ERROR_MESSAGES,
  EMAIL_RECIPIENT_CONFIG_KEY,
  EMAIL_TOOL_MESSAGES,
  SEND_RELEASE_EMAIL_DESCRIPTION,
  TOOL_NAMES,
} from "@/constants";

// Db
import { findReleaseId, saveReleaseHistory } from "@/db";

// Schemas
import { isValidEmailAddress, SendReleaseEmailInputSchema } from "@/schemas";

// Services
import { sendReleaseEmail } from "@/services";

// Utils
import { userContext } from "@/utils";

/**
 * Runs only after `humanInTheLoopMiddleware` got an approval. The recipient is not an argument: it
 * arrives in `configurable` from the approval answer (an object value, so it is not copied into
 * checkpoint metadata or traces), which keeps it away from the model, the thread and the model trace.
 */
export const createSendReleaseEmail = (pool: Pool) =>
  tool(
    async ({ release }, config) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) return EMAIL_ERROR_MESSAGES.NOT_SIGNED_IN;

      const recipient = (config?.configurable?.[EMAIL_RECIPIENT_CONFIG_KEY] as { address?: unknown } | undefined)
        ?.address;

      // Refused before anything is saved, so a bad address leaves no History row behind.
      if (!isValidEmailAddress(recipient)) return EMAIL_ERROR_MESSAGES.INVALID_RECIPIENT;

      const releaseId =
        (await findReleaseId(pool, userId, release)) ??
        (await saveReleaseHistory(pool, userId, { release })).id;

      const result = await sendReleaseEmail(pool, userId, releaseId, recipient);
      return result.ok ? EMAIL_TOOL_MESSAGES.SENT : result.error;
    },
    {
      name: TOOL_NAMES.sendReleaseEmail,
      description: SEND_RELEASE_EMAIL_DESCRIPTION,
      schema: SendReleaseEmailInputSchema,
    },
  );
