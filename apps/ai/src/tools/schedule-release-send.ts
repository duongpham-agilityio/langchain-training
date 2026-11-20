import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  CURRENT_DATE_TIME_DESCRIPTION,
  DEFAULT_TIME_ZONE,
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
  resolveScheduleRequest,
} from "@/utils";

// Context
import { readAgentContext } from "@/agent/context";

/** Today's date in the user's zone. A tool, not a prompt block, so the system prompt stays cacheable. */
export const createGetCurrentDateTime = () =>
  tool(async (_input, runtime) => JSON.stringify(describeNow(new Date(), readAgentContext(runtime)?.timeZone ?? DEFAULT_TIME_ZONE)), {
    name: TOOL_NAMES.getCurrentDateTime,
    description: CURRENT_DATE_TIME_DESCRIPTION,
  });

/**
 * Runs only after `humanInTheLoopMiddleware` got an approval (a rejection never reaches this body).
 * The time is checked again here: the approval may have taken long enough to pass it.
 */
export const createScheduleReleaseSend = (pool: Pool) =>
  tool(
    async ({ release, localDateTime }, runtime) => {
      const context = readAgentContext(runtime);
      const userId = context?.userId;
      if (!context || !userId) return SCHEDULE_TOOL_MESSAGES.NOT_SIGNED_IN;

      const { timeZone } = context;
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
