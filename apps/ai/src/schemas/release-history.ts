import { z } from "zod";

// Constants
import {
  RELEASE_HISTORY_DEFAULT_PAGE_SIZE,
  RELEASE_HISTORY_MAX_PAGE_SIZE,
  RELEASE_NOTES_DATE_PATTERN,
  RELEASE_STATUSES,
} from "@/constants";

// Mirrors apps/web `SaveReleaseHistoryRequestSchema`.
export const SaveReleaseHistoryRequestSchema = z.object({
  releaseDate: z.string().regex(RELEASE_NOTES_DATE_PATTERN).nullish(),
  titleOverride: z.string().min(1).nullish(),
  version: z.string().min(1),
  title: z.string().min(1),
  platform: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1),
});

export type SaveReleaseHistoryRequest = z.infer<typeof SaveReleaseHistoryRequestSchema>;

export const PlatformSlotSchema = z.object({
  platform: z.string(),
  label: z.string(),
  content: z.string(),
});

export type PlatformSlot = z.infer<typeof PlatformSlotSchema>;

// Mirrors apps/web `ReleaseHistoryRecordSchema`; `entries` are stored and returned as-is.
export const ReleaseHistoryRecordSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  releaseDate: z.string().regex(RELEASE_NOTES_DATE_PATTERN),
  titleOverride: z.string().nullable(),
  status: z.enum(RELEASE_STATUSES),
  github: z.string(),
  appStore: z.string().nullable(),
  googlePlay: z.string().nullable(),
  platforms: z.array(PlatformSlotSchema),
  entries: z.array(z.unknown()),
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

export const ListReleaseHistoryQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(RELEASE_STATUSES).optional(),
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(RELEASE_HISTORY_MAX_PAGE_SIZE)
    .default(RELEASE_HISTORY_DEFAULT_PAGE_SIZE),
});

export type ListReleaseHistoryQuery = z.infer<typeof ListReleaseHistoryQuerySchema>;
