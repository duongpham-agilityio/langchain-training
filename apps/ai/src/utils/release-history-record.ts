import { ReleaseSchema, type ReleaseFormat } from "@training/contracts";

// Schemas
import type { ReleaseHistoryRecord } from "@/schemas";

// Utils
import { renderRelease } from "./render-release";

export type ReleaseHistoryRow = {
  id: string;
  release: unknown;
  status: ReleaseHistoryRecord["status"];
  created_at: Date | string;
};

/**
 * Text is rendered on read, never stored. An over-limit release gets `text: null` rather than a
 * truncated body. A row whose object no longer matches the schema returns null, so one bad row
 * does not fail the whole list.
 */
export const toReleaseHistoryRecord = (
  row: ReleaseHistoryRow,
  format: ReleaseFormat,
): ReleaseHistoryRecord | null => {
  const parsed = ReleaseSchema.safeParse(row.release);
  if (!parsed.success) return null;
  const rendered = renderRelease(parsed.data, format);
  return {
    id: row.id,
    release: parsed.data,
    status: row.status,
    format,
    text: rendered.ok ? rendered.text : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
};
