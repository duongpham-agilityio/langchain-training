import type { ReleaseFormat } from "@training/contracts";
import type { Pool } from "pg";

// Constants
import {
  PROJECTS_TABLE,
  RELEASE_HISTORY_TABLE,
  RELEASE_SENDS_TABLE,
  RELEASE_STATUS_ARCHIVED,
} from "@/constants";

// Schemas
import type {
  ListReleaseHistoryQuery,
  ListReleaseHistoryResponse,
  ReleaseHistoryRecord,
  SaveReleaseHistoryRequest,
} from "@/schemas";

// Utils
import {
  decodeReleaseCursor,
  encodeReleaseCursor,
  toReleaseHistoryRecord,
  type ReleaseHistoryRow,
} from "@/utils";

// The one place that knows the `release_history` column names (F-06): the version, date, title
// and changes all live inside the `release` object.
// `email_recipients` = distinct recipients of successful email sends (F-13), for the detail view.
// `project_name` comes from the join with `projects` (every row has a project: NOT NULL foreign key).
const COLUMNS = `h.id, h.release, h.status, h.created_at, h.project_id, p.name as project_name,
  coalesce((
    select array_agg(distinct s.recipient order by s.recipient)
    from ${RELEASE_SENDS_TABLE} s
    where s.release_id = h.id and s.channel = 'email' and s.status = 'sent'
  ), '{}') as email_recipients`;
const FROM = `${RELEASE_HISTORY_TABLE} h join ${PROJECTS_TABLE} p on p.id = h.project_id`;

/** Escapes LIKE wildcards so a search for `100%` matches literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, "\\$&");

export class InvalidCursorError extends Error {}

export const listReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  { q, status, format, cursor, limit, projectId }: ListReleaseHistoryQuery,
): Promise<ListReleaseHistoryResponse> => {
  const params: unknown[] = [ownerId];
  const where = ["h.owner_id = $1"];

  // The route has already checked that the project is the owner's.
  if (projectId) {
    params.push(projectId);
    where.push(`h.project_id = $${params.length}`);
  }

  if (q) {
    params.push(`%${escapeLike(q)}%`);
    // Version and title (the opening line) both live in the release object.
    const n = params.length;
    where.push(`(h.release->>'version' ilike $${n} or h.release->>'openingLine' ilike $${n})`);
  }
  if (status) {
    params.push(status);
    where.push(`h.status = $${params.length}`);
  }
  if (cursor) {
    const decoded = decodeReleaseCursor(cursor);
    if (!decoded) throw new InvalidCursorError("Invalid cursor");
    params.push(decoded[0], decoded[1]);
    where.push(`(h.created_at, h.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }
  // One extra row tells us whether another page exists.
  params.push(limit + 1);

  const { rows } = await pool.query<ReleaseHistoryRow>(
    `select ${COLUMNS} from ${FROM}
     where ${where.join(" and ")}
     order by h.created_at desc, h.id desc
     limit $${params.length}`,
    params,
  );

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    releases: page.flatMap((row) => toReleaseHistoryRecord(row, format) ?? []),
    nextCursor: rows.length > limit && last ? encodeReleaseCursor(last) : null,
  };
};

export const getReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  id: string,
  format: ReleaseFormat,
): Promise<ReleaseHistoryRecord | null> => {
  const { rows } = await pool.query<ReleaseHistoryRow>(
    `select ${COLUMNS} from ${FROM} where h.owner_id = $1 and h.id = $2`,
    [ownerId, id],
  );
  return rows[0] ? toReleaseHistoryRecord(rows[0], format) : null;
};

/** The newest saved version (by created_at) of one of the owner's projects, or null when that project has none: versions count per project. */
export const getLatestReleaseVersion = async (
  pool: Pool,
  ownerId: string,
  projectId: string,
): Promise<string | null> => {
  // The version lives inside the stored release object (F-06 dropped the `version` column).
  const { rows } = await pool.query<{ version: string | null }>(
    `select release->>'version' as version from ${RELEASE_HISTORY_TABLE}
     where owner_id = $1 and project_id = $2
     order by created_at desc, id desc
     limit 1`,
    [ownerId, projectId],
  );
  return rows[0]?.version ?? null;
};

/**
 * Saving the same version again creates a new record, as the web expects. The caller has already
 * checked that `projectId` is the owner's (the column is NOT NULL and has no default).
 */
export const saveReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  projectId: string,
  { release }: Pick<SaveReleaseHistoryRequest, "release">,
): Promise<{ id: string }> => {
  const { rows } = await pool.query<{ id: string }>(
    `insert into ${RELEASE_HISTORY_TABLE} (owner_id, project_id, status, release)
     values ($1, $2, $3, $4::jsonb)
     returning id`,
    [ownerId, projectId, RELEASE_STATUS_ARCHIVED, JSON.stringify(release)],
  );
  return { id: rows[0].id };
};
