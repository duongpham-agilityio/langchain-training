import { z } from "zod";
import { RELEASE_FORMATS, RELEASE_STATUSES } from "./constants";
import { ReleaseSchema } from "./release";

/** One rendered format of a release: `{platform, label, content}`. The draft slot the preview and Slack share. */
export const PlatformSlotSchema = z.object({
  platform: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1),
});

export type PlatformSlot = z.infer<typeof PlatformSlotSchema>;

/** One archive = one release object. Archiving the same version again creates a new record. */
export const SaveReleaseHistoryRequestSchema = z.object({
  release: ReleaseSchema,
});

export type SaveReleaseHistoryRequest = z.infer<typeof SaveReleaseHistoryRequestSchema>;

/**
 * One stored release. `text` is rendered on read from `release` in `format`
 * (null when the release is over that format's length limit); it is never stored.
 */
export const ReleaseHistoryRecordSchema = z.object({
  id: z.string().min(1),
  release: ReleaseSchema,
  status: z.enum(RELEASE_STATUSES),
  format: z.enum(RELEASE_FORMATS),
  text: z.string().nullable(),
  createdAt: z.string(),
});

export type ReleaseHistoryRecord = z.infer<typeof ReleaseHistoryRecordSchema>;

export const ListReleaseHistoryResponseSchema = z.object({
  releases: z.array(ReleaseHistoryRecordSchema),
  nextCursor: z.string().nullable(),
});

export type ListReleaseHistoryResponse = z.infer<typeof ListReleaseHistoryResponseSchema>;
