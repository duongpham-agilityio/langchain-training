export const SCHEDULER_POLL_INTERVAL_MS = 60_000;
export const SCHEDULER_MAX_ATTEMPTS = 3;
// A job still "running" after this long is treated as stuck and picked up again.
export const SCHEDULER_STUCK_JOB_TIMEOUT_MS = 10 * 60_000;

export const SCHEDULED_SENDS_TABLE = "scheduled_sends";

export const SCHEDULE_APPROVAL_DESCRIPTION = "Schedule this Slack send?";

export const SCHEDULE_TOOL_MESSAGES = {
  NOT_SIGNED_IN: "Could not tell who is signed in, so nothing was scheduled.",
  REJECTED: "The user rejected scheduling. Nothing was scheduled.",
  /** Sent to the model for the other tool calls of a turn when one schedule call is refused. */
  SKIPPED: "Not run because another call in the same turn was refused. Call again if still needed.",
} as const;

export const CURRENT_DATE_TIME_DESCRIPTION =
  "Get the current date, weekday and time in the user's time zone. Call it before scheduling a send, to resolve words like 'today', 'tomorrow' or 'Monday'.";

export const SCHEDULE_RELEASE_SEND_DESCRIPTION =
  "Schedule a Slack send of release notes for a later local date-time. Give the time as the user's local date-time without offset or zone (for example 2026-11-16T09:00); the server converts it with the user's time zone. The user is asked to approve every call; if they reject, nothing is stored.";
