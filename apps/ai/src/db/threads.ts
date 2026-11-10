import type { Pool } from "pg";

// Constants
import { THREADS_TABLE } from "@/constants";

// Schemas
import type { ThreadSummary } from "@/schemas";

// The one place that knows the `threads` column names (supabase/migrations/*_create_threads.sql).
type ThreadRow = {
  id: string;
  owner_id: string;
  title: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const toSummary = (row: ThreadRow): ThreadSummary => ({
  id: row.id,
  title: row.title,
  resourceId: row.owner_id,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

/** Always filtered by owner: this runs with the service role, which bypasses RLS. */
export const listThreads = async (pool: Pool, ownerId: string): Promise<ThreadSummary[]> => {
  const { rows } = await pool.query<ThreadRow>(
    `select id, owner_id, title, created_at, updated_at from ${THREADS_TABLE}
     where owner_id = $1
     order by updated_at desc, id desc`,
    [ownerId],
  );
  return rows.map(toSummary);
};

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
