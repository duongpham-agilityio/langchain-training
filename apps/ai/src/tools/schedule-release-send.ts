import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  CURRENT_DATE_TIME_DESCRIPTION,
  SCHEDULE_RELEASE_SEND_DESCRIPTION,
  SCHEDULE_TOOL_MESSAGES,
  TOOL_NAMES,
} from "@/constants";

// Db
import { findReleaseId, insertScheduledSend, saveReleaseHistory } from "@/db";

// Schemas
import { ScheduleReleaseSendInputSchema } from "@/schemas";

// Utils
import {
  buildSlackMessage,
  describeNow,
  formatScheduledTime,
  getUserTimeZone,
  resolveScheduleRequest,
  userContext,
} from "@/utils";

/** Today's date in the user's zone. A tool, not a prompt block, so the system prompt stays cacheable. */
export const createGetCurrentDateTime = () =>
  tool(async () => JSON.stringify(describeNow(new Date(), getUserTimeZone())), {
    name: TOOL_NAMES.getCurrentDateTime,
    description: CURRENT_DATE_TIME_DESCRIPTION,
  });

/**
 * Runs only after `humanInTheLoopMiddleware` got an approval (a rejection never reaches this body).
 * The time is checked again here: the approval may have taken long enough to pass it.
 */
export const createScheduleReleaseSend = (pool: Pool) =>
  tool(
    async ({ release, localDateTime }) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) return SCHEDULE_TOOL_MESSAGES.NOT_SIGNED_IN;

      const timeZone = getUserTimeZone();
      const request = resolveScheduleRequest(localDateTime, timeZone);
      if (!request.ok) return request.error;

      const built = buildSlackMessage(release);
      if (!built.ok) return built.error;

      const releaseId =
        (await findReleaseId(pool, userId, release)) ??
        (await saveReleaseHistory(pool, userId, { release })).id;

      await insertScheduledSend(pool, {
        ownerId: userId,
        releaseId,
        content: built.message.content,
        runAt: request.runAt,
        timeZone,
      });
      return `Scheduled for ${formatScheduledTime(request.runAt, timeZone)}.`;
    },
    {
      name: TOOL_NAMES.scheduleReleaseSend,
      description: SCHEDULE_RELEASE_SEND_DESCRIPTION,
      schema: ScheduleReleaseSendInputSchema,
    },
  );
