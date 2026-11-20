import type { Pool } from "pg";

// Constants
import { DB_SCHEMA, PROJECTS_TABLE, THREADS_TABLE } from "@/constants";

// Schemas
import type { ThreadSummary } from "@/schemas";

// The one place that knows the `threads` column names (`ensureThreadsTable` below creates the table).
type ThreadRow = {
  id: string;
  owner_id: string;
  project_id: string;
  title: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const toSummary = (row: ThreadRow): ThreadSummary => ({
  id: row.id,
  title: row.title,
  resourceId: row.owner_id,
  projectId: row.project_id,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

/** Always filtered by owner: this runs with the service role, which bypasses RLS. `projectId` narrows to one project. */
export const listThreads = async (
  pool: Pool,
  ownerId: string,
  projectId?: string,
): Promise<ThreadSummary[]> => {
  const params = projectId ? [ownerId, projectId] : [ownerId];
  const { rows } = await pool.query<ThreadRow>(
    `select id, owner_id, project_id, title, created_at, updated_at from ${THREADS_TABLE}
     where owner_id = $1${projectId ? " and project_id = $2" : ""}
     order by updated_at desc, id desc`,
    params,
  );
  return rows.map(toSummary);
};

/** Who and which project a thread row belongs to. */
export type ThreadOwner = { ownerId: string; projectId: string };

/** Owner and project of a thread row, or null when the id has no row yet. */
export const getThreadOwner = async (pool: Pool, id: string): Promise<ThreadOwner | null> => {
  const { rows } = await pool.query<Pick<ThreadRow, "owner_id" | "project_id">>(
    `select owner_id, project_id from ${THREADS_TABLE} where id = $1`,
    [id],
  );
  return rows[0] ? { ownerId: rows[0].owner_id, projectId: rows[0].project_id } : null;
};

/**
 * Creates the owner row in the project with an empty title (the title step fills it later) and returns the row's owner and project.
 * First writer wins: when the id already belongs to someone else (or to another project), that row comes back and nothing changes.
 */
export const claimThread = async (
  pool: Pool,
  ownerId: string,
  projectId: string,
  id: string,
): Promise<ThreadOwner | null> => {
  await pool.query(
    `insert into ${THREADS_TABLE} (id, owner_id, project_id) values ($1, $2, $3)
     on conflict (id) do nothing`,
    [id, ownerId, projectId],
  );
  return getThreadOwner(pool, id);
};

/** Moves a thread the owner just used to the top of the list. A row of another owner is never touched. */
export const touchThread = async (pool: Pool, ownerId: string, id: string): Promise<void> => {
  await pool.query(
    `update ${THREADS_TABLE} set updated_at = now() where owner_id = $1 and id = $2`,
    [ownerId, id],
  );
};

/**
 * Fills the title of the owner's row only while it is still empty (inserts the row when it is missing),
 * so a retry or a racing second attempt keeps the stored title and another owner's row is left alone.
 */
export const setThreadTitle = async (
  pool: Pool,
  ownerId: string,
  projectId: string,
  id: string,
  title: string,
): Promise<void> => {
  await pool.query(
    `insert into ${THREADS_TABLE} (id, owner_id, project_id, title) values ($1, $2, $3, $4)
     on conflict (id) do update set title = excluded.title
     where ${THREADS_TABLE}.title = ''
       and ${THREADS_TABLE}.owner_id = excluded.owner_id
       and ${THREADS_TABLE}.project_id = excluded.project_id`,
    [id, ownerId, projectId, title],
  );
};

/** True once the owner's row has a real title; an empty-title row still needs the title step. */
export const hasTitledThread = async (pool: Pool, ownerId: string, id: string): Promise<boolean> => {
  const { rowCount } = await pool.query(
    `select 1 from ${THREADS_TABLE} where owner_id = $1 and id = $2 and title <> ''`,
    [ownerId, id],
  );
  return (rowCount ?? 0) > 0;
};

/**
 * Creates the schema and `threads` table when missing, like the checkpointer's `setup()`: no manual migration.
 * Safe on every start. Never throws: with the database down the server still starts (see `/health`).
 */
export const ensureThreadsTable = async (pool: Pool): Promise<void> => {
  try {
    await pool.query(`create schema if not exists "${DB_SCHEMA}"`);
    await pool.query(
      `create table if not exists ${THREADS_TABLE} (
         id         text primary key check (length(id) > 0),
         owner_id   uuid not null references auth.users (id) on delete cascade,
         project_id uuid not null references ${PROJECTS_TABLE} (id) on delete cascade,
         title      text not null default '',
         created_at timestamptz not null default now(),
         updated_at timestamptz not null default now()
       )`,
    );
    // A table created before projects existed gets the column here; fails (logged) while it still has rows: clean it first.
    await pool.query(
      `alter table ${THREADS_TABLE}
         add column if not exists project_id uuid not null references ${PROJECTS_TABLE} (id) on delete cascade`,
    );
    await pool.query(
      `create index if not exists threads_owner_project_updated_idx
         on ${THREADS_TABLE} (owner_id, project_id, updated_at desc, id desc)`,
    );
    await pool.query(
      `create index if not exists threads_owner_updated_idx
         on ${THREADS_TABLE} (owner_id, updated_at desc, id desc)`,
    );
  } catch (error) {
    console.error(`[ai] threads table setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
