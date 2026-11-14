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
