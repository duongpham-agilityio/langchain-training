import { z } from "zod";

/** Max length of one preference field, shared by the agent tool and the settings form. */
export const USER_PREFERENCE_MAX_LENGTH = 500;

/** The saved user template: every field is optional (an unset field is simply not applied). */
export const UserPreferencesRecordSchema = z.object({
  tone: z.string().optional(),
  writingStyle: z.string().optional(),
  openingLine: z.string().optional(),
});

export type UserPreferencesRecord = z.infer<typeof UserPreferencesRecordSchema>;

/** `PUT` body: the whole template. A blank or missing field is removed; all blank clears the record. */
export const UpdateUserPreferencesRequestSchema = z.object({
  tone: z.string().trim().max(USER_PREFERENCE_MAX_LENGTH).optional(),
  writingStyle: z.string().trim().max(USER_PREFERENCE_MAX_LENGTH).optional(),
  openingLine: z.string().trim().max(USER_PREFERENCE_MAX_LENGTH).optional(),
});

export type UpdateUserPreferencesRequest = z.infer<typeof UpdateUserPreferencesRequestSchema>;
