import type { Pool } from "pg";

// Constants
import {
  PLATFORM_COLUMNS,
  RELEASE_HISTORY_CURSOR_SEPARATOR,
  RELEASE_HISTORY_TABLE,
  RELEASE_STATUS_ARCHIVED,
} from "@/constants";

// Schemas
import type {
  ListReleaseHistoryQuery,
  ListReleaseHistoryResponse,
  PlatformSlot,
  ReleaseHistoryRecord,
  SaveReleaseHistoryRequest,
} from "@/schemas";

// Utils
import { formatReleaseDate } from "@/utils";

// The one place that knows the `release_history` column names (M-17 / issue #20).
const COLUMNS = `id, version, title, release_date, title_override, status, github,
  app_store, google_play, platforms, entries, feat_count, fix_count, created_at`;

type ReleaseHistoryRow = {
  id: string;
  version: string;
  title: string;
  release_date: string;
  title_override: string | null;
  status: ReleaseHistoryRecord["status"];
  github: string | null;
  app_store: string | null;
  google_play: string | null;
  platforms: PlatformSlot[] | null;
  entries: unknown[] | null;
  feat_count: number | null;
  fix_count: number | null;
  created_at: Date | string;
};

const toRecord = (row: ReleaseHistoryRow): ReleaseHistoryRecord => ({
  id: row.id,
  version: row.version,
  title: row.title,
  releaseDate: row.release_date,
  titleOverride: row.title_override,
  status: row.status,
  github: row.github ?? "",
  appStore: row.app_store,
  googlePlay: row.google_play,
  platforms: row.platforms ?? [],
  entries: row.entries ?? [],
  featCount: row.feat_count ?? 0,
  fixCount: row.fix_count ?? 0,
  createdAt: new Date(row.created_at).toISOString(),
});

const encodeCursor = (row: ReleaseHistoryRow): string =>
  Buffer.from(
    `${new Date(row.created_at).toISOString()}${RELEASE_HISTORY_CURSOR_SEPARATOR}${row.id}`,
  ).toString("base64url");

/** Returns null for a malformed cursor so the route can answer 400. */
const decodeCursor = (cursor: string): [string, string] | null => {
  const [createdAt, id] = Buffer.from(cursor, "base64url")
    .toString()
    .split(RELEASE_HISTORY_CURSOR_SEPARATOR);
  return createdAt && id && !Number.isNaN(Date.parse(createdAt)) ? [createdAt, id] : null;
};

/** Escapes LIKE wildcards so a search for `100%` matches literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, "\\$&");

export class InvalidCursorError extends Error {}

export const listReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  { q, status, cursor, limit }: ListReleaseHistoryQuery,
): Promise<ListReleaseHistoryResponse> => {
  const params: unknown[] = [ownerId];
  const where = ["owner_id = $1"];

  if (q) {
    params.push(`%${escapeLike(q)}%`);
    where.push(`(version ilike $${params.length} or title ilike $${params.length})`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (cursor) {
    const decoded = decodeCursor(cursor);
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
    releases: page.map(toRecord),
    nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
  };
};

export const getReleaseHistory = async (
  pool: Pool,
  ownerId: string,
  id: string,
): Promise<ReleaseHistoryRecord | null> => {
  const { rows } = await pool.query<ReleaseHistoryRow>(
    `select ${COLUMNS} from ${RELEASE_HISTORY_TABLE} where owner_id = $1 and id = $2`,
    [ownerId, id],
  );
  return rows[0] ? toRecord(rows[0]) : null;
};

/** The owner's newest saved version (by created_at), or null when none is saved. */
export const getLatestReleaseVersion = async (
  pool: Pool,
  ownerId: string,
): Promise<string | null> => {
  const { rows } = await pool.query<{ version: string }>(
    `select version from ${RELEASE_HISTORY_TABLE}
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
  request: SaveReleaseHistoryRequest,
): Promise<{ id: string }> => {
  const { releaseDate, titleOverride, version, title, platform, label, content } = request;
  const column = PLATFORM_COLUMNS[platform as keyof typeof PLATFORM_COLUMNS];
  const extraPlatforms: PlatformSlot[] = column ? [] : [{ platform, label, content }];

  const { rows } = await pool.query<{ id: string }>(
    `insert into ${RELEASE_HISTORY_TABLE}
       (owner_id, version, title, release_date, title_override, status, github, app_store,
        google_play, platforms, entries, feat_count, fix_count)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, '[]'::jsonb, 0, 0)
     returning id`,
    [
      ownerId,
      version,
      title,
      releaseDate ?? formatReleaseDate(),
      titleOverride ?? null,
      RELEASE_STATUS_ARCHIVED,
      column === "github" ? content : "",
      column === "app_store" ? content : null,
      column === "google_play" ? content : null,
      JSON.stringify(extraPlatforms),
    ],
  );
  return { id: rows[0].id };
};
