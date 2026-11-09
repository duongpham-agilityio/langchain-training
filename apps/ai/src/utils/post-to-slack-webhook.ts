// Constants
import { SLACK_ERROR_MESSAGES, SLACK_WEBHOOK_TIMEOUT_MS } from "@/constants";

export type SlackWebhookErrorStatus = 502 | 504;

export class SlackWebhookError extends Error {
  constructor(
    message: string,
    readonly status: SlackWebhookErrorStatus,
  ) {
    super(message);
    this.name = "SlackWebhookError";
  }
}

/** Posts `*<label>*` then the content to a Slack incoming webhook; throws `SlackWebhookError` on failure. */
export const postToSlackWebhook = async (
  url: string,
  { label, content }: { label: string; content: string },
): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${label}*\n${content}` }),
      signal: AbortSignal.timeout(SLACK_WEBHOOK_TIMEOUT_MS),
    });
  } catch (error) {
    // AbortSignal.timeout rejects with a TimeoutError; anything else is a network failure.
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new SlackWebhookError(SLACK_ERROR_MESSAGES.WEBHOOK_TIMEOUT, 504);
    }
    throw new SlackWebhookError(SLACK_ERROR_MESSAGES.SLACK_REJECTED, 502);
  }
  if (!response.ok) {
    throw new SlackWebhookError(SLACK_ERROR_MESSAGES.SLACK_REJECTED, 502);
  }
};
