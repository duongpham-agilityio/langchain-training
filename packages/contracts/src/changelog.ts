import { z } from "zod";
import { ChangeSchema, ReleaseSchema } from "./release";

/** One saved release in the changelog: version, date, changes and whether it was sent. */
export const ChangelogEntrySchema = z.object({
  id: z.string().min(1),
  version: ReleaseSchema.shape.version,
  date: ReleaseSchema.shape.date,
  changes: z.array(ChangeSchema),
  sent: z.boolean(),
});

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

export const ChangelogResponseSchema = z.object({
  releases: z.array(ChangelogEntrySchema),
  nextCursor: z.string().nullable(),
});

export type ChangelogResponse = z.infer<typeof ChangelogResponseSchema>;

/** Longest Markdown answer the Live Preview takes; the tool refuses more. */
export const CHANGELOG_ANSWER_MAX_LENGTH = 20_000;

/** What `showChangelogAnswer` returns on success: a Markdown answer, not a release draft. */
export const ChangelogAnswerResultSchema = z.object({
  ok: z.literal(true),
  title: z.string().min(1),
  markdown: z.string().min(1),
});

export type ChangelogAnswerResult = z.infer<typeof ChangelogAnswerResultSchema>;
