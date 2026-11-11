export const SCHEDULER_POLL_INTERVAL_MS = 60_000;
export const SCHEDULER_MAX_ATTEMPTS = 3;
// A job still "running" after this long is treated as stuck and picked up again.
export const SCHEDULER_STUCK_JOB_TIMEOUT_MS = 10 * 60_000;
