import { z } from "zod";

// Constants
import { RELEASE_NOTES_DATE_PATTERN, RELEASE_VERSION_PATTERN } from "@/constants";

// Utils
import { joinLines } from "@/utils";

// Schemas
import { ChangeSchema } from "./release";

export const ReleaseNotesPreviewInputSchema = z.object({
  format: z
    .string()
    .min(1)
    .describe(
      joinLines(
        "The output format the user asked for, copied from their words",
        '(e.g. "slack", "markdown", "app-store", "google-play", "json", "html-email").',
        "Never guess it and never default to a common one: when the user named",
        "none, do not call this tool, ask which format they want. An unsupported",
        "name is refused by the tool with the supported list.",
      ),
    ),
  openingLine: z
    .string()
    .trim()
    .min(1)
    .describe("One opening line summarising the release, in plain language."),
  changes: z
    .array(ChangeSchema)
    .describe(
      joinLines(
        "Every classified change of the release, typed, one sentence each.",
        "When re-rendering the same release in another format, copy the",
        "`changes` of the `release` from the previous tool result unchanged.",
      ),
    ),
  version: z
    .string()
    .regex(RELEASE_VERSION_PATTERN)
    .optional()
    .describe(
      joinLines(
        "MAJOR.MINOR.PATCH. Set it ONLY when the user named a version, or when",
        "re-rendering: copy `release.version` from the previous result. Omit it",
        "otherwise: the app computes the version itself.",
      ),
    ),
  date: z
    .string()
    .regex(RELEASE_NOTES_DATE_PATTERN)
    .optional()
    .describe(
      joinLines(
        "Release date as yyyymmdd (e.g. 20260901). Set it ONLY when the user",
        "named a date, or when re-rendering: copy `release.date` from the",
        "previous result. Omit it otherwise: the app fills in today's date.",
      ),
    ),
});

export type ReleaseNotesPreviewInput = z.infer<typeof ReleaseNotesPreviewInputSchema>;
