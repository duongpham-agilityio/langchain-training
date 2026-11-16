import { z } from "zod";
import { CHANGE_TYPES } from "@training/contracts";

// Constants
import {
  RELEASE_DATE_PATTERN,
  RELEASE_HISTORY_DEFAULT_PAGE_SIZE,
  RELEASE_HISTORY_MAX_PAGE_SIZE,
} from "@/constants";

export {
  ChangelogEntrySchema,
  ChangelogResponseSchema,
  type ChangelogEntry,
  type ChangelogResponse,
} from "@training/contracts";

const dateParam = z.string().regex(RELEASE_DATE_PATTERN, "must be YYYYMMDD");

/** Dates are inclusive `YYYYMMDD`. `changeType` keeps releases with such a change and only those changes. */
export const ChangelogQuerySchema = z
  .object({
    from: dateParam.optional(),
    to: dateParam.optional(),
    version: z.string().trim().min(1).optional(),
    changeType: z.enum(CHANGE_TYPES).optional(),
    cursor: z.string().optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(RELEASE_HISTORY_MAX_PAGE_SIZE)
      .default(RELEASE_HISTORY_DEFAULT_PAGE_SIZE),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "from must not be after to",
    path: ["from"],
  });

export type ChangelogQuery = z.infer<typeof ChangelogQuerySchema>;
