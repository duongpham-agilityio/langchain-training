export const SLACK_PUBLISH_PATH = "/slack/publish";
export const SLACK_PATH_PATTERN = "/slack/*";
export const SLACK_WEBHOOK_TIMEOUT_MS = 10_000;
// Slack truncates message text past roughly 40 000 characters; stay below it to leave room for the label line.
export const SLACK_MAX_CONTENT_LENGTH = 35_000;

export const SLACK_ERROR_MESSAGES = {
  MISSING_WEBHOOK_URL:
    "Missing required env var: SLACK_WEBHOOK_URL. Set it in .env, then restart the server.",
  INVALID_REQUEST: "Invalid publish request",
  SLACK_REJECTED: "Slack rejected the message",
  WEBHOOK_TIMEOUT:
    "Slack did not answer in time. The message may or may not have been posted — check the channel before retrying.",
} as const;
