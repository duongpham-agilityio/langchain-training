import { z } from "zod";

// Constants
import { CHANGE_TYPES, RELEASE_NOTES_DATE_PATTERN } from "@/constants";

// Utils
import { joinLines } from "@/utils";

export const ChangeTypeSchema = z.enum(CHANGE_TYPES);

export type ChangeType = z.infer<typeof ChangeTypeSchema>;

// Mirrors apps/web `ReleaseChangeSchema`.
export const ChangeSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      joinLines(
        "Stable identifier of this change within the release. Keep the same id",
        "when the change is edited or the release is re-rendered.",
      ),
    ),
  type: ChangeTypeSchema.describe(
    "Exactly one type. A breaking feature is still a feature.",
  ),
  breaking: z
    .boolean()
    .describe("Whether this change breaks existing behaviour, whatever its type."),
  description: z
    .string()
    .trim()
    .min(1)
    .regex(/^[^\n\r]+$/, "description must be one line")
    .describe("One sentence in plain language describing the change."),
  refs: z
    .array(z.string().min(1))
    .optional()
    .describe(
      joinLines(
        "PR numbers and commit hashes copied from the pasted input, as written.",
        "Never invent one; omit the field when the input has none.",
      ),
    ),
});

export type Change = z.infer<typeof ChangeSchema>;

// Mirrors apps/web `ReleaseSchema`.
export const ReleaseSchema = z.object({
  version: z.string().min(1),
  date: z.string().regex(RELEASE_NOTES_DATE_PATTERN).describe("Release date as yyyymmdd."),
  openingLine: z.string().trim().min(1).describe("One opening line summarising the release."),
  changes: z.array(ChangeSchema),
});

export type Release = z.infer<typeof ReleaseSchema>;
