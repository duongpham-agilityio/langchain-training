/** What to do with a claimed job after a failed attempt. */
export type FailureDecision = { action: "retry"; runAt: Date } | { action: "fail" };

/**
 * `attempts` already counts the attempt that just failed (the claim increments it).
 * Under the limit the job goes back to `pending` for a later run; at the limit it is failed.
 */
export const decideAfterFailure = (
  attempts: number,
  maxAttempts: number,
  now: Date,
  retryDelayMs: number,
): FailureDecision =>
  attempts >= maxAttempts
    ? { action: "fail" }
    : { action: "retry", runAt: new Date(now.getTime() + retryDelayMs * attempts) };

/** A `sending` job whose last update is older than the timeout is stuck. */
export const isStuck = (updatedAt: Date, now: Date, timeoutMs: number): boolean =>
  now.getTime() - updatedAt.getTime() > timeoutMs;

/** A job is due when it is pending and its instant has come. A cancelled (or any other) status never is. */
export const isDue = (status: string, runAt: Date, now: Date): boolean =>
  status === "pending" && runAt.getTime() <= now.getTime();
