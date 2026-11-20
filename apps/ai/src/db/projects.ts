import type { Pool } from "pg";

// Constants
import { PROJECTS_TABLE } from "@/constants";

// Schemas
import type { Project } from "@/schemas";

// The one place that knows the `projects` column names (migration `20261120000000_create_projects.sql`).
type ProjectRow = {
  id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const COLUMNS = "id, name, created_at, updated_at";

const toProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

/** Always filtered by owner: this runs with the service role, which bypasses RLS. Newest first. */
export const listProjects = async (pool: Pool, ownerId: string): Promise<Project[]> => {
  const { rows } = await pool.query<ProjectRow>(
    `select ${COLUMNS} from ${PROJECTS_TABLE}
     where owner_id = $1
     order by created_at desc, id desc`,
    [ownerId],
  );
  return rows.map(toProject);
};

/** The owner is set explicitly: the column default `auth.uid()` is null for the service role. */
export const createProject = async (pool: Pool, ownerId: string, name: string): Promise<Project> => {
  const { rows } = await pool.query<ProjectRow>(
    `insert into ${PROJECTS_TABLE} (owner_id, name) values ($1, $2)
     returning ${COLUMNS}`,
    [ownerId, name],
  );
  return toProject(rows[0]);
};

/**
 * The project when it exists and belongs to the owner, else null (one answer for "not yours" and "missing").
 * A non-uuid id would make Postgres throw on the cast, so callers validate the shape first.
 */
export const findOwnedProject = async (
  pool: Pool,
  ownerId: string,
  projectId: string,
): Promise<Project | null> => {
  const { rows } = await pool.query<ProjectRow>(
    `select ${COLUMNS} from ${PROJECTS_TABLE} where owner_id = $1 and id = $2`,
    [ownerId, projectId],
  );
  return rows[0] ? toProject(rows[0]) : null;
};
