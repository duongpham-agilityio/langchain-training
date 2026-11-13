import { z } from "zod";
import { RELEASE_DATE_PATTERN, RELEASE_STATUSES } from "./constants";
import { ReleaseEntrySchema } from "./release";

/** One rendered format of a release: `{platform, label, content}`. */
export const PlatformSlotSchema = z.object({
  platform: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1),
});

export type PlatformSlot = z.infer<typeof PlatformSlotSchema>;

// One archive = one platform slot. Archiving the same version again creates a new record.
export const SaveReleaseHistoryRequestSchema = z.object({
  releaseDate: z.string().regex(RELEASE_DATE_PATTERN).nullish(),
  titleOverride: z.string().min(1).nullish(),
  version: z.string().min(1),
  title: z.string().min(1),
  ...PlatformSlotSchema.shape,
});

export type SaveReleaseHistoryRequest = z.infer<typeof SaveReleaseHistoryRequestSchema>;

export const ReleaseHistoryRecordSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  releaseDate: z.string().regex(RELEASE_DATE_PATTERN),
  titleOverride: z.string().nullable(),
  status: z.enum(RELEASE_STATUSES),
  github: z.string(),
  appStore: z.string().nullable(),
  googlePlay: z.string().nullable(),
  platforms: z.array(PlatformSlotSchema),
  entries: z.array(ReleaseEntrySchema),
  featCount: z.number().int(),
  fixCount: z.number().int(),
  createdAt: z.string(),
});

export type ReleaseHistoryRecord = z.infer<typeof ReleaseHistoryRecordSchema>;

export const ListReleaseHistoryResponseSchema = z.object({
  releases: z.array(ReleaseHistoryRecordSchema),
  nextCursor: z.string().nullable(),
});

export type ListReleaseHistoryResponse = z.infer<typeof ListReleaseHistoryResponseSchema>;
