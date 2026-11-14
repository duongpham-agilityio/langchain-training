import type { ReleaseFormat } from "@training/contracts";
import type { Pool } from "pg";

// Constants
import {
  RELEASE_HISTORY_TABLE,
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
const COLUMNS = "id, release, status, created_at";

/** Escapes LIKE wildcards so a search for `100%` matches literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, "\\$&");

export class InvalidCursorError extends Error {}

export const listReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  { q, status, format, cursor, limit }: ListReleaseHistoryQuery,
): Promise<ListReleaseHistoryResponse> => {
  const params: unknown[] = [ownerId];
  const where = ["owner_id = $1"];

  if (q) {
    params.push(`%${escapeLike(q)}%`);
    // Version and title (the opening line) both live in the release object.
    const n = params.length;
    where.push(`(release->>'version' ilike $${n} or release->>'openingLine' ilike $${n})`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (cursor) {
    const decoded = decodeReleaseCursor(cursor);
    if (!decoded) throw new InvalidCursorError("Invalid cursor");
    params.push(decoded[0], decoded[1]);
    where.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }
  // One extra row tells us whether another page exists.
  params.push(limit + 1);

  const { rows } = await pool.query<ReleaseHistoryRow>(
    `select ${COLUMNS} from ${RELEASE_HISTORY_TABLE}
     where ${where.join(" and ")}
     order by created_at desc, id desc
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
    `select ${COLUMNS} from ${RELEASE_HISTORY_TABLE} where owner_id = $1 and id = $2`,
    [ownerId, id],
  );
  return rows[0] ? toReleaseHistoryRecord(rows[0], format) : null;
};

/** The owner's newest saved version (by created_at), or null when none is saved. */
export const getLatestReleaseVersion = async (
  pool: Pool,
  ownerId: string,
): Promise<string | null> => {
  // The version lives inside the stored release object (F-06 dropped the `version` column).
  const { rows } = await pool.query<{ version: string | null }>(
    `select release->>'version' as version from ${RELEASE_HISTORY_TABLE}
     where owner_id = $1
     order by created_at desc, id desc
     limit 1`,
    [ownerId],
  );
  return rows[0]?.version ?? null;
};

/** Saving the same version again creates a new record, as the web expects. */
export const saveReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  { release }: SaveReleaseHistoryRequest,
): Promise<{ id: string }> => {
  const { rows } = await pool.query<{ id: string }>(
    `insert into ${RELEASE_HISTORY_TABLE} (owner_id, status, release)
     values ($1, $2, $3::jsonb)
     returning id`,
    [ownerId, RELEASE_STATUS_ARCHIVED, JSON.stringify(release)],
  );
  return { id: rows[0].id };
};
