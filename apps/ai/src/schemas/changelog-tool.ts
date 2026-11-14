import { z } from "zod";

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
    .describe("A calendar month as YYYY-MM, e.g. 2026-09 for September 2026."),
  from: z.string().optional().describe("First day, YYYY-MM-DD, inclusive. Without `to` it is a single day."),
  to: z.string().optional().describe("Last day, YYYY-MM-DD, inclusive."),
});
