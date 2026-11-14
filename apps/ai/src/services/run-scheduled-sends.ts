import type { Pool } from "pg";

// Configs
import { config } from "@/config";

// Constants
import {
  RELEASE_FORMAT_LABELS,
  SCHEDULER_ERROR_MESSAGES,
  SCHEDULER_RETRY_DELAY_MS,
} from "@/constants";

// Db
import {
  type ClaimedSend,
  claimDueScheduledSend,
  failStuckScheduledSends,
  markScheduledSendFailed,
  markScheduledSendSent,
  recordSlackSend,
  retryScheduledSend,
} from "@/db";

// Utils
import { decideAfterFailure, postToSlackWebhook } from "@/utils";

/** Everything the runner touches outside itself, so the flow is testable without a database or Slack. */
export type SchedulerDeps = {
  claim: () => Promise<ClaimedSend | null>;
  post: (content: string) => Promise<void>;
  markSent: (job: ClaimedSend) => Promise<void>;
  retry: (job: ClaimedSend, runAt: Date, error: string) => Promise<void>;
  fail: (job: ClaimedSend, error: string) => Promise<void>;
  maxAttempts: number;
  retryDelayMs: number;
  now: () => Date;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : SCHEDULER_ERROR_MESSAGES.UNKNOWN;

/** Claims and handles one due job. Returns false when nothing was due. Never throws for a send error. */
export const runNextScheduledSend = async (deps: SchedulerDeps): Promise<boolean> => {
  const job = await deps.claim();
  if (!job) return false;

  try {
    await deps.post(job.content);
  } catch (error) {
    const message = errorMessage(error);
    const decision = decideAfterFailure(job.attempts, deps.maxAttempts, deps.now(), deps.retryDelayMs);
    if (decision.action === "retry") await deps.retry(job, decision.runAt, message);
    else await deps.fail(job, message);
    return true;
  }
  await deps.markSent(job);
  return true;
};

/** Production wiring: Postgres claim, the existing Slack webhook client, `release_sends` bookkeeping. */
export const createSchedulerDeps = (pool: Pool): SchedulerDeps => ({
  claim: () => claimDueScheduledSend(pool),
  post: async (content) => {
    const url = config.slackWebhookUrl;
    if (!url) throw new Error(SCHEDULER_ERROR_MESSAGES.MISSING_WEBHOOK_URL);
    await postToSlackWebhook(url, { label: RELEASE_FORMAT_LABELS.slack, content });
  },
  markSent: async (job) => {
    await markScheduledSendSent(pool, job.id);
    // The message is out: a bookkeeping failure must not turn the job into a retry.
    await recordSlackSend(pool, job.ownerId, job.releaseId, { status: "sent" }).catch((e) =>
      console.error(`[scheduler] sent ${job.id} but could not record it: ${String(e)}`),
    );
  },
  retry: (job, runAt, error) => retryScheduledSend(pool, job.id, runAt, error),
  fail: async (job, error) => {
    await markScheduledSendFailed(pool, job.id, error);
    await recordSlackSend(pool, job.ownerId, job.releaseId, { status: "failed", error }).catch((e) =>
      console.error(`[scheduler] failed ${job.id} but could not record it: ${String(e)}`),
    );
  },
  maxAttempts: config.scheduler.maxAttempts,
  retryDelayMs: SCHEDULER_RETRY_DELAY_MS,
  now: () => new Date(),
});

/** One poll: fail stuck jobs, then send every due job (one at a time) until none is left. */
export const pollScheduledSends = async (pool: Pool, deps: SchedulerDeps): Promise<void> => {
  const stuck = await failStuckScheduledSends(
    pool,
    config.scheduler.stuckJobTimeoutMs,
    SCHEDULER_ERROR_MESSAGES.STUCK,
  );
  for (const job of stuck) {
    await recordSlackSend(pool, job.ownerId, job.releaseId, {
      status: "failed",
      error: SCHEDULER_ERROR_MESSAGES.STUCK,
    }).catch((e) => console.error(`[scheduler] could not record stuck ${job.id}: ${String(e)}`));
  }
  while (await runNextScheduledSend(deps)) {
    // keep draining
  }
};

/**
 * Starts the loop at boot. A tick that is still running is not overlapped, and an error in one tick
 * is logged and the next tick still runs. Returns a stop function.
 */
export const startScheduler = (pool: Pool): (() => void) => {
  if (!config.scheduler.enabled) {
    console.log("[scheduler] disabled (SCHEDULER_ENABLED=false)");
    return () => undefined;
  }
  const deps = createSchedulerDeps(pool);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await pollScheduledSends(pool, deps);
    } catch (error) {
      console.error(`[scheduler] poll failed: ${String(error)}`);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, config.scheduler.pollIntervalMs);
  void tick();
  console.log(`[scheduler] polling every ${config.scheduler.pollIntervalMs} ms`);
  return () => clearInterval(timer);
};
