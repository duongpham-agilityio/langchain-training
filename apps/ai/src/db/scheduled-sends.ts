import type { Pool } from "pg";

// Constants
import { SCHEDULED_SENDS_TABLE } from "@/constants";

export type NewScheduledSend = {
  ownerId: string;
  releaseId: string;
  /** Snapshot of the Slack message text at scheduling time; the poller sends this, not a re-render. */
  content: string;
  runAt: Date;
  timeZone: string;
};

/** Inserts one `pending` job (the table defaults give status and attempts) and returns its id. */
export const insertScheduledSend = async (pool: Pool, job: NewScheduledSend): Promise<string> => {
  const { rows } = await pool.query<{ id: string }>(
    `insert into ${SCHEDULED_SENDS_TABLE} (owner_id, release_id, content, run_at, time_zone)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [job.ownerId, job.releaseId, job.content, job.runAt, job.timeZone],
  );
  return rows[0].id;
};

export type ClaimedSend = {
  id: string;
  ownerId: string;
  releaseId: string;
  content: string;
  /** Includes the attempt this claim starts. */
  attempts: number;
};

/**
 * Claims the oldest due `pending` job in one statement: `for update skip locked` makes a second server
 * instance skip a row the first is claiming, so a job is claimed by exactly one poller. The claim moves it
 * to `sending` and counts the attempt. Cancelled jobs are not `pending`, so they are never claimed.
 */
export const claimDueScheduledSend = async (pool: Pool): Promise<ClaimedSend | null> => {
  const { rows } = await pool.query<{
    id: string;
    owner_id: string;
    release_id: string;
    content: string;
    attempts: number;
  }>(
    `update ${SCHEDULED_SENDS_TABLE}
     set status = 'sending', attempts = attempts + 1
     where id = (
       select id from ${SCHEDULED_SENDS_TABLE}
       where status = 'pending' and run_at <= now()
       order by run_at
       limit 1
       for update skip locked
     )
     returning id, owner_id, release_id, content, attempts`,
  );
  const row = rows[0];
  return row
    ? {
        id: row.id,
        ownerId: row.owner_id,
        releaseId: row.release_id,
        content: row.content,
        attempts: row.attempts,
      }
    : null;
};

/** `sending` -> `sent`. Guarded on the status so a finished job is never rewritten. */
export const markScheduledSendSent = async (pool: Pool, id: string): Promise<void> => {
  await pool.query(
    `update ${SCHEDULED_SENDS_TABLE} set status = 'sent', error = null
     where id = $1 and status = 'sending'`,
    [id],
  );
};

/** `sending` -> `pending` for a later run, keeping the last error. */
export const retryScheduledSend = async (
  pool: Pool,
  id: string,
  runAt: Date,
  error: string,
): Promise<void> => {
  await pool.query(
    `update ${SCHEDULED_SENDS_TABLE} set status = 'pending', run_at = $2, error = $3
     where id = $1 and status = 'sending'`,
    [id, runAt, error],
  );
};

/** `sending` -> `failed` with the stored error. */
export const markScheduledSendFailed = async (
  pool: Pool,
  id: string,
  error: string,
): Promise<void> => {
  await pool.query(
    `update ${SCHEDULED_SENDS_TABLE} set status = 'failed', error = $2
     where id = $1 and status = 'sending'`,
    [id, error],
  );
};

/**
 * Fails every job stuck in `sending` past the timeout (the process died mid-send). It is not retried:
 * the message may already be in Slack. Returns the failed jobs so the caller can record them.
 */
export const failStuckScheduledSends = async (
  pool: Pool,
  timeoutMs: number,
  error: string,
): Promise<Array<{ id: string; ownerId: string; releaseId: string }>> => {
  const { rows } = await pool.query<{ id: string; owner_id: string; release_id: string }>(
    `update ${SCHEDULED_SENDS_TABLE} set status = 'failed', error = $2
     where status = 'sending' and updated_at < now() - make_interval(secs => $1::double precision / 1000)
     returning id, owner_id, release_id`,
    [timeoutMs, error],
  );
  return rows.map((r) => ({ id: r.id, ownerId: r.owner_id, releaseId: r.release_id }));
};
