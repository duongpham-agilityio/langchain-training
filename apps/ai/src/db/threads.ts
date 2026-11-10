import type { Pool } from "pg";

// Constants
import { THREADS_TABLE } from "@/constants";

export const hasThread = async (pool: Pool, ownerId: string, id: string): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `select 1 from ${THREADS_TABLE} where owner_id = $1 and id = $2`,
    [ownerId, id],
  );
  return (rowCount ?? 0) > 0;
};

/** First writer wins: a racing second attempt (or a retry) leaves the stored title alone. */
export const createThread = async (
  pool: Pool,
  ownerId: string,
  id: string,
  title: string,
): Promise<void> => {
  await pool.query(
    `insert into ${THREADS_TABLE} (id, owner_id, title) values ($1, $2, $3)
     on conflict (id) do nothing`,
    [id, ownerId, title],
  );
};
