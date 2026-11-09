import { Hono } from "hono";

// Config
import { config } from "@/config";

// Constants
import { SLACK_ERROR_MESSAGES, SLACK_PUBLISH_PATH } from "@/constants";

// Schemas
import { SlackPublishRequestSchema } from "@/schemas";

// Utils
import { postToSlackWebhook, SlackWebhookError } from "@/utils";

export const createSlackRoute = () => {
  const route = new Hono();

  route.post(SLACK_PUBLISH_PATH, async (c) => {
    // A non-JSON body is treated like any other invalid body.
    const body = await c.req.json().catch(() => undefined);
    const parsed = SlackPublishRequestSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: SLACK_ERROR_MESSAGES.INVALID_REQUEST }, 400);

    const webhookUrl = config.slackWebhookUrl;
    if (!webhookUrl) return c.json({ error: SLACK_ERROR_MESSAGES.MISSING_WEBHOOK_URL }, 500);

    try {
      await postToSlackWebhook(webhookUrl, parsed.data);
      return c.json({ ok: true });
    } catch (error) {
      if (error instanceof SlackWebhookError) return c.json({ error: error.message }, error.status);
      throw error;
    }
  });

  return route;
};
