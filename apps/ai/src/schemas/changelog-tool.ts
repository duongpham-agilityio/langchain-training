import { z } from "zod";
import { CHANGE_TYPES } from "@training/contracts";

// Constants
import { CHANGELOG_PERIODS } from "@/constants";

/** Time range is the only filter (F-28); the refine-free shape keeps the tool JSON schema simple. */
export const getChangelogSchema = z.object({
  period: z
    .enum(CHANGELOG_PERIODS)
    .optional()
    .describe("Relative range in the user's time zone, e.g. last_month."),
  month: z
    .string()
    .optional()
    .describe(
      "A calendar month as YYYY-MM (2026-09), or just MM (09) when the user gave no year: the most recent such month that is not in the future is used.",
    ),
  changeType: z
    .enum(CHANGE_TYPES)
    .optional()
    .describe("Only releases with this type of change, and only those changes (e.g. fix for 'what fixes ...')."),
  from: z.string().optional().describe("First day, YYYY-MM-DD, inclusive. Without `to` it is a single day."),
  to: z.string().optional().describe("Last day, YYYY-MM-DD, inclusive."),
});
