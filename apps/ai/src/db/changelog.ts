import type { Pool } from "pg";

// Constants
import { RELEASE_HISTORY_TABLE } from "@/constants/release-history";

// Schemas
import type { ChangelogQuery, ChangelogResponse } from "@/schemas";

// Utils
import { buildChangelogQuery, toChangelogEntry, type ChangelogRow } from "@/utils/changelog";
import { encodeReleaseCursor } from "@/utils/release-cursor";

/** The owner's saved releases, newest first, with the `sent` flag derived from `release_sends`. */
export const listChangelog = async (
  pool: Pool,
  ownerId: string,
  query: ChangelogQuery,
): Promise<ChangelogResponse> => {
  const { text, params } = buildChangelogQuery(ownerId, query);
  const { rows } = await pool.query<ChangelogRow>(text, params);
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    releases: page.flatMap((row) => toChangelogEntry(row, query.changeType) ?? []),
    nextCursor: rows.length > query.limit && last ? encodeReleaseCursor(last) : null,
  };
};

/** Every version the owner has saved; used to check that an answer names only real releases. */
export const listOwnerReleaseVersions = async (pool: Pool, ownerId: string): Promise<string[]> => {
  const { rows } = await pool.query<{ version: string }>(
    `select distinct release->>'version' as version from ${RELEASE_HISTORY_TABLE} where owner_id = $1`,
    [ownerId],
  );
  return rows.map((row) => row.version);
};
