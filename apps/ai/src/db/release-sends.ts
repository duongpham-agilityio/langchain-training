import type { Pool } from "pg";

// Constants
import {
  RELEASE_HISTORY_TABLE,
  RELEASE_SENDS_TABLE,
  RELEASE_STATUS_PUBLISHED,
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

/** Writes one Slack `release_sends` row; a successful send also marks the release `published`, in one transaction. */
export const recordSlackSend = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
  outcome: ReleaseSendOutcome,
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into ${RELEASE_SENDS_TABLE} (release_id, owner_id, channel, status, sent_at, error)
       values ($1, $2, 'slack', $3, $4, $5)`,
      [
        releaseId,
        ownerId,
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
