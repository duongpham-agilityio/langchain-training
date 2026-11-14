import type { Pool } from "pg";

// Utils
import type { ReleaseSendRow, ScheduledSendRow } from "@/utils/release-send-entries";

// Constants
import {
  RELEASE_HISTORY_TABLE,
  RELEASE_SENDS_TABLE,
  RELEASE_STATUS_PUBLISHED,
  SCHEDULED_SENDS_TABLE,
} from "@/constants";

export type ReleaseSendOutcome = { status: "sent" } | { status: "failed"; error: string };

/** The owner's newest saved row holding exactly this release object (jsonb equality), or null. */
export const findReleaseId = async (
  pool: Pool,
  ownerId: string,
  release: unknown,
): Promise<string | null> => {
  const { rows } = await pool.query<{ id: string }>(
    `select id from ${RELEASE_HISTORY_TABLE}
     where owner_id = $1 and release = $2::jsonb
     order by created_at desc, id desc
     limit 1`,
    [ownerId, JSON.stringify(release)],
  );
  return rows[0]?.id ?? null;
};

/** The stored release object of one of the owner's rows, or null when there is none. */
export const getStoredRelease = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
): Promise<unknown | null> => {
  const { rows } = await pool.query<{ release: unknown }>(
    `select release from ${RELEASE_HISTORY_TABLE} where owner_id = $1 and id = $2`,
    [ownerId, releaseId],
  );
  return rows[0]?.release ?? null;
};

type SendChannel = "slack" | "email";

/** Writes one `release_sends` row; a successful send also marks the release `published`, in one transaction. */
const recordSend = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
  channel: SendChannel,
  recipient: string,
  outcome: ReleaseSendOutcome,
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into ${RELEASE_SENDS_TABLE} (release_id, owner_id, channel, recipient, status, sent_at, error)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        releaseId,
        ownerId,
        channel,
        recipient,
        outcome.status,
        outcome.status === "sent" ? new Date() : null,
        outcome.status === "failed" ? outcome.error : null,
      ],
    );
    if (outcome.status === "sent") {
      await client.query(
        `update ${RELEASE_HISTORY_TABLE} set status = $3 where owner_id = $1 and id = $2`,
        [ownerId, releaseId, RELEASE_STATUS_PUBLISHED],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
};

/** One Slack send. */
export const recordSlackSend = (
  pool: Pool,
  ownerId: string,
  releaseId: string,
  outcome: ReleaseSendOutcome,
): Promise<void> => recordSend(pool, ownerId, releaseId, "slack", "", outcome);

/** One email send, with its recipient (F-13). */
export const recordEmailSend = (
  pool: Pool,
  ownerId: string,
  releaseId: string,
  recipient: string,
  outcome: ReleaseSendOutcome,
): Promise<void> => recordSend(pool, ownerId, releaseId, "email", recipient, outcome);

/** The owner's sends and scheduled jobs of one release (both scoped by `owner_id`). */
export const listReleaseSendRows = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
): Promise<{ sends: ReleaseSendRow[]; jobs: ScheduledSendRow[] }> => {
  const [sends, jobs] = await Promise.all([
    pool.query<ReleaseSendRow>(
      `select id, channel, recipient, status, sent_at, created_at, error from ${RELEASE_SENDS_TABLE}
       where owner_id = $1 and release_id = $2`,
      [ownerId, releaseId],
    ),
    pool.query<ScheduledSendRow>(
      `select id, status, run_at, time_zone, error from ${SCHEDULED_SENDS_TABLE}
       where owner_id = $1 and release_id = $2`,
      [ownerId, releaseId],
    ),
  ]);
  return { sends: sends.rows, jobs: jobs.rows };
};
