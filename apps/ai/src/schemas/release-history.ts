import { z } from "zod";

// Constants
import {
  RELEASE_HISTORY_DEFAULT_PAGE_SIZE,
  RELEASE_HISTORY_MAX_PAGE_SIZE,
  RELEASE_STATUSES,
  RELEASE_VERSION_PATTERN,
} from "@/constants";

// Shared with the web client. `entries` are written as `[]` by `saveReleaseHistory` and returned as stored.
export {
  ListReleaseHistoryResponseSchema,
  PlatformSlotSchema,
  ReleaseHistoryRecordSchema,
  SaveReleaseHistoryRequestSchema,
  type ListReleaseHistoryResponse,
  type PlatformSlot,
  type ReleaseHistoryRecord,
  type SaveReleaseHistoryRequest,
} from "@training/contracts";

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

export const NextReleaseVersionRequestSchema = z.object({
  previousVersion: z.string().regex(RELEASE_VERSION_PATTERN).nullish(),
  changes: z.array(
    z.object({
      type: z.string().min(1),
      breaking: z.boolean(),
    }),
  ),
  statedVersion: z.string().min(1).nullish(),
});

export type NextReleaseVersionRequest = z.infer<typeof NextReleaseVersionRequestSchema>;
