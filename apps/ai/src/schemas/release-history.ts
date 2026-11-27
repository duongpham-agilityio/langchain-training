import { z } from "zod";

// Constants
import {
  RELEASE_FORMATS,
  RELEASE_HISTORY_DEFAULT_FORMAT,
  RELEASE_HISTORY_DEFAULT_PAGE_SIZE,
  RELEASE_HISTORY_MAX_PAGE_SIZE,
  RELEASE_STATUSES,
} from "@/constants";

// Shared with the web client.
export {
  ListReleaseHistoryResponseSchema,
  ReleaseHistoryRecordSchema,
  SaveReleaseHistoryRequestSchema,
  type ListReleaseHistoryResponse,
  type ReleaseHistoryRecord,
  type SaveReleaseHistoryRequest,
} from "@training/contracts";

export const ListReleaseHistoryQuerySchema = z.object({
  projectId: z.uuid().optional(),
  q: z.string().trim().optional(),
  status: z.enum(RELEASE_STATUSES).optional(),
  format: z.enum(RELEASE_FORMATS).default(RELEASE_HISTORY_DEFAULT_FORMAT),
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(RELEASE_HISTORY_MAX_PAGE_SIZE)
    .default(RELEASE_HISTORY_DEFAULT_PAGE_SIZE),
});

/** Detail takes only the format; the owner and id come from auth and the path. */
export const GetReleaseHistoryQuerySchema = ListReleaseHistoryQuerySchema.pick({ format: true });

export type ListReleaseHistoryQuery = z.infer<typeof ListReleaseHistoryQuerySchema>;
