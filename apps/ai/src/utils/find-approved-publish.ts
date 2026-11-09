import { AIMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";

// Constants
import { CONFIRMATION_ANSWERS, TOOL_NAMES } from "@/constants";

// Schemas
import type { SlackPublishRequest } from "@/schemas";

const isSameRequest = (a: Partial<SlackPublishRequest>, b: SlackPublishRequest) =>
  a.platformId === b.platformId && a.label === b.label && a.content === b.content;

/** Answers arrive as a free string (maybe JSON-quoted); normalise before comparing. */
const normaliseAnswer = (content: unknown) => String(content).trim().replace(/^"|"$/g, "");

/**
 * True when the history holds an approved `confirmSlackPublish` answer for exactly
 * this request that no later `publishReleaseNotesToSlack` result has consumed.
 * The gate is code on purpose: Reject must not publish even if the model misbehaves.
 */
export const findApprovedPublish = (
  messages: readonly BaseMessage[],
  request: SlackPublishRequest,
): boolean => {
  const confirmCalls = new Map<string, Partial<SlackPublishRequest>>();
  let approved = false;

  for (const message of messages) {
    if (AIMessage.isInstance(message)) {
      for (const call of message.tool_calls ?? []) {
        if (call.name === TOOL_NAMES.confirmSlackPublish && call.id) {
          confirmCalls.set(call.id, call.args as Partial<SlackPublishRequest>);
        }
      }
    } else if (ToolMessage.isInstance(message)) {
      const confirmed = confirmCalls.get(message.tool_call_id);
      if (confirmed) {
        approved =
          isSameRequest(confirmed, request) &&
          normaliseAnswer(message.content) === CONFIRMATION_ANSWERS.approved;
      } else if (message.name === TOOL_NAMES.publishReleaseNotesToSlack) {
        approved = false;
      }
    }
  }
  return approved;
};
