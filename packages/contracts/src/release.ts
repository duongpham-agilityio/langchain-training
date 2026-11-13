import { z } from "zod";
import { CHANGE_TYPES, RELEASE_DATE_PATTERN } from "./constants";

export const ChangeTypeSchema = z.enum(CHANGE_TYPES);

export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const ChangeSchema = z.object({
  id: z.string().min(1),
  type: ChangeTypeSchema,
  breaking: z.boolean(),
  description: z
    .string()
    .trim()
    .min(1)
    .regex(/^[^\n\r]+$/, "description must be one line"),
  refs: z.array(z.string().min(1)).optional(),
});

export type Change = z.infer<typeof ChangeSchema>;

export const ReleaseSchema = z.object({
  version: z.string().min(1),
  date: z.string().regex(RELEASE_DATE_PATTERN),
  openingLine: z.string().trim().min(1),
  changes: z.array(ChangeSchema),
});

export type Release = z.infer<typeof ReleaseSchema>;

/** One commit or PR the release was built from, as stored with a history record. */
export const ReleaseEntrySchema = z.object({
  source: z.enum(["commit", "pr"]),
  id: z.string().min(1),
  author: z.string().min(1),
  timestamp: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.string().min(1),
  breaking: z.boolean(),
});

export type ReleaseEntry = z.infer<typeof ReleaseEntrySchema>;

/**
 * The draft shown in the Live Preview, sent by the web as an AG-UI context entry and read by the
 * server to build an edit request: the release object, the format, its rendered text and the hash.
 */
export const DraftContextSchema = z.object({
  release: ReleaseSchema,
  format: z.string().min(1),
  text: z.string().min(1),
  hash: z.string(),
});

export type DraftContext = z.infer<typeof DraftContextSchema>;
