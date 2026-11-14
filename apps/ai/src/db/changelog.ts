import type { Pool } from "pg";

// Schemas
import type { ChangelogQuery, ChangelogResponse } from "@/schemas";

// Utils
import {
  buildChangelogQuery,
  encodeReleaseCursor,
  toChangelogEntry,
  type ChangelogRow,
} from "@/utils";

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
    releases: page.flatMap((row) => toChangelogEntry(row) ?? []),
    nextCursor: rows.length > query.limit && last ? encodeReleaseCursor(last) : null,
  };
};
