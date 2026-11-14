// Constants
import { RELEASE_HISTORY_CURSOR_SEPARATOR } from "@/constants";

/** Cursor over `(created_at, id)`, shared by the History list and the changelog. */
export const encodeReleaseCursor = (row: { created_at: Date | string; id: string }): string =>
  Buffer.from(
    `${new Date(row.created_at).toISOString()}${RELEASE_HISTORY_CURSOR_SEPARATOR}${row.id}`,
  ).toString("base64url");

/** Returns null for a malformed cursor so the route can answer 400. */
export const decodeReleaseCursor = (cursor: string): [string, string] | null => {
  const [createdAt, id] = Buffer.from(cursor, "base64url")
    .toString()
    .split(RELEASE_HISTORY_CURSOR_SEPARATOR);
  return createdAt && id && !Number.isNaN(Date.parse(createdAt)) ? [createdAt, id] : null;
};
