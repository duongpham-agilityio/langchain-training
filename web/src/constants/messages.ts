export const SLACK_ERROR_MESSAGES = {
  MISSING_WEBHOOK_URL:
    'Missing required env var: SLACK_WEBHOOK_URL. Set it in .env, then restart the Mastra server.',
  INVALID_REQUEST: 'Invalid publish request',
  SLACK_REJECTED: 'Slack rejected the message',
  WEBHOOK_TIMEOUT:
    'Slack did not answer in time. The message may or may not have been posted — check the channel before retrying.',
} as const;
