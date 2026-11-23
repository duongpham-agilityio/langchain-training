import { z } from "zod";

// Constants
import { USER_MEMORY_FIELDS, USER_MEMORY_SCOPES } from "@/constants";

const preferenceField = (what: string) => z.string().trim().min(1).max(500).describe(what);

export const UserPreferencesSchema = z.object({
  tone: preferenceField("Tone of the release notes, e.g. friendly, formal."),
  writingStyle: preferenceField("Writing style, e.g. short bullet points, no jargon."),
  openingLine: preferenceField("Fixed opening line to start release notes with."),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

const scopeField = z.enum(USER_MEMORY_SCOPES).describe('"project" for the current project only, "global" for all projects.');

export type UserMemoryScope = z.infer<typeof scopeField>;

/** Any subset; `.refine` keeps an empty save call from reaching the store. */
export const saveUserPreferencesSchema = UserPreferencesSchema.partial().extend({ scope: scopeField.default("global") }).refine(
  (value) => USER_MEMORY_FIELDS.some((field) => value[field] !== undefined),
  { message: "Give at least one of tone, writingStyle, openingLine." },
);

export const getUserPreferencesSchema = z.object({ scope: scopeField.optional() });

export const clearUserPreferencesSchema = z.object({
  scope: scopeField.default("global"),
  fields: z
    .array(z.enum(USER_MEMORY_FIELDS))
    .optional()
    .describe("Fields to forget. Omit to forget all."),
});
