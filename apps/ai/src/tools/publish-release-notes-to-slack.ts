import { getCurrentTaskInput } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { tool } from "langchain";

// Configs
import { config } from "@/config";

// Constants
import {
  PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION,
  SLACK_ERROR_MESSAGES,
  SLACK_TOOL_MESSAGES,
  TOOL_NAMES,
} from "@/constants";

// Schemas
import { SlackPublishRequestSchema } from "@/schemas";

// Utils
import { findApprovedPublish, postToSlackWebhook, SlackWebhookError } from "@/utils";

export const publishReleaseNotesToSlack = tool(
  async (request) => {
    const { messages } = getCurrentTaskInput<{ messages: BaseMessage[] }>();
    if (!findApprovedPublish(messages, request)) return SLACK_TOOL_MESSAGES.NOT_APPROVED;

    const webhookUrl = config.slackWebhookUrl;
    if (!webhookUrl) return SLACK_ERROR_MESSAGES.MISSING_WEBHOOK_URL;

    try {
      await postToSlackWebhook(webhookUrl, request);
      return SLACK_TOOL_MESSAGES.PUBLISHED;
    } catch (error) {
      if (error instanceof SlackWebhookError) return error.message;
      throw error;
    }
  },
  {
    name: TOOL_NAMES.publishReleaseNotesToSlack,
    description: PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION,
    schema: SlackPublishRequestSchema,
  },
);
