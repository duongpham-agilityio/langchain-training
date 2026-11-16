export { SLACK_MAX_CONTENT_LENGTH, SLACK_PUBLISH_PATH } from "@training/contracts";

export const SLACK_PATH_PATTERN = "/slack/*";
export const SLACK_WEBHOOK_TIMEOUT_MS = 10_000;

export const SLACK_ERROR_MESSAGES = {
  // Shown to users: no setup details. The env var name goes to the server log only.
  MISSING_WEBHOOK_URL: "Sending to Slack isn't set up yet. Ask an admin to connect a Slack channel.",
  INVALID_REQUEST: "Invalid publish request",
  RELEASE_NOT_FOUND: "Release not found",
  NOT_SIGNED_IN: "Could not tell who is signed in, so nothing was sent.",
  SLACK_REJECTED: "Slack rejected the message",
  WEBHOOK_TIMEOUT:
    "Slack did not answer in time. The message may or may not have been posted — check the channel before retrying.",
} as const;
