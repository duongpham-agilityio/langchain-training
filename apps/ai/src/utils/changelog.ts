import { ReleaseSchema } from "@training/contracts";

// Constants
import { PROJECTS_TABLE, RELEASE_HISTORY_TABLE, RELEASE_SENDS_TABLE, RELEASE_SEND_STATUS_SENT } from "@/constants";

// Schemas
import type { ChangelogEntry } from "@/schemas";

// Utils
import { decodeReleaseCursor } from "./release-cursor";

export interface ChangelogFilters {
  from?: string;
  to?: string;
  projectId?: string;
  cursor?: string;
  limit: number;
}

export class InvalidChangelogCursorError extends Error {}

/**
 * Builds the changelog SQL and params. Pure so filters and cursor are unit-tested without a
 * database. `$1` is always the owner; the optional `projectId` is verified by the route. Only releases with a `sent` row in `release_sends` (any
 * channel, independent of how those rows are written, F-12) are listed, so `sent` is always true:
 * the changelog records submitted releases, History lists everything saved.
 */
export const buildChangelogQuery = (
  ownerId: string,
  { from, to, projectId, cursor, limit }: ChangelogFilters,
): { text: string; params: unknown[] } => {
  const params: unknown[] = [ownerId];
  const where = ["h.owner_id = $1"];

  // The release date is the YYYYMMDD string inside the release object, so string order = date order.
  if (from) {
    params.push(from);
    where.push(`h.release->>'date' >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`h.release->>'date' <= $${params.length}`);
  }
  if (projectId) {
    params.push(projectId);
    where.push(`h.project_id = $${params.length}`);
  }
  if (cursor) {
    const decoded = decodeReleaseCursor(cursor);
    if (!decoded) throw new InvalidChangelogCursorError("Invalid cursor");
    params.push(decoded[0], decoded[1]);
    where.push(
      `(h.created_at, h.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }
  params.push(RELEASE_SEND_STATUS_SENT);
  const sentParam = params.length;
  // One extra row tells us whether another page exists.
  params.push(limit + 1);

  const sentExists = `exists (
         select 1 from ${RELEASE_SENDS_TABLE} s
         where s.release_id = h.id and s.owner_id = h.owner_id and s.status = $${sentParam}
       )`;
  const text = `select h.id, h.release, h.created_at, h.project_id, p.name as project_name,
       ${sentExists} as sent
     from ${RELEASE_HISTORY_TABLE} h join ${PROJECTS_TABLE} p on p.id = h.project_id
     where ${where.join(" and ")} and ${sentExists}
     order by h.created_at desc, h.id desc
     limit $${params.length}`;
  return { text, params };
};

export type ChangelogRow = {
  id: string;
  release: unknown;
  created_at: Date | string;
  project_id: string;
  project_name: string;
  sent: boolean;
};

/** A row whose object no longer matches the schema returns null, so one bad row does not fail the page. */
export const toChangelogEntry = (row: ChangelogRow): ChangelogEntry | null => {
  const parsed = ReleaseSchema.safeParse(row.release);
  if (!parsed.success) return null;
  const { date, openingLine, changes } = parsed.data;
  return { id: row.id, projectId: row.project_id, projectName: row.project_name, date, openingLine, changes, sent: row.sent };
};
