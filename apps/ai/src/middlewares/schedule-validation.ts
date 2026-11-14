import { createMiddleware } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";

// Constants
import { SCHEDULE_TOOL_MESSAGES, TOOL_NAMES } from "@/constants";

// Utils
// Deep imports: the `@/utils` barrel reaches `config.ts` (env vars at import), which a unit test should not need.
import { resolveScheduleRequest } from "@/utils/schedule-request";
import { getUserTimeZone } from "@/utils/user-context";

/**
 * Refuses a bad schedule time BEFORE the approval card: a past or impossible time never reaches the user.
 * It must come AFTER `humanInTheLoopMiddleware` in the middleware list, because `afterModel` hooks run
 * in reverse order, so this one runs first and its jump back to the model skips the approval.
 * Every tool call of the refused message gets a ToolMessage so the history stays well formed.
 */
export const createScheduleValidationMiddleware = (now: () => Date = () => new Date()) =>
  createMiddleware({
    name: "ScheduleValidationMiddleware",
    afterModel: {
      canJumpTo: ["model"],
      hook: (state) => {
        const last = state.messages.at(-1);
        if (!AIMessage.isInstance(last) || !last.tool_calls?.length) return;

        const refusals = new Map<string, string>();
        for (const call of last.tool_calls) {
          if (call.name !== TOOL_NAMES.scheduleReleaseSend || !call.id) continue;
          const localDateTime = (call.args as { localDateTime?: unknown }).localDateTime;
          const result = resolveScheduleRequest(String(localDateTime), getUserTimeZone(), now());
          if (!result.ok) refusals.set(call.id, result.error);
        }
        if (refusals.size === 0) return;

        return {
          jumpTo: "model" as const,
          messages: last.tool_calls.map(
            (call) =>
              new ToolMessage({
                tool_call_id: call.id ?? "",
                name: call.name,
                status: refusals.has(call.id ?? "") ? "error" : "success",
                content: refusals.get(call.id ?? "") ?? SCHEDULE_TOOL_MESSAGES.SKIPPED,
              }),
          ),
        };
      },
    },
  });
