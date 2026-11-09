import { tool } from "langchain";

// Constants
import {
  CONFIRM_SLACK_PUBLISH_DESCRIPTION,
  SLACK_TOOL_MESSAGES,
  TOOL_NAMES,
} from "@/constants";

// Schemas
import { SlackPublishRequestSchema } from "@/schemas";

/**
 * Stub: the web renders the Approve/Reject card and answers the call. The
 * `confirmationMiddleware` ends the run when the model calls it, so this body only runs by mistake.
 */
export const confirmSlackPublish = tool(async () => SLACK_TOOL_MESSAGES.STUB_CALLED, {
  name: TOOL_NAMES.confirmSlackPublish,
  description: CONFIRM_SLACK_PUBLISH_DESCRIPTION,
  schema: SlackPublishRequestSchema,
});
