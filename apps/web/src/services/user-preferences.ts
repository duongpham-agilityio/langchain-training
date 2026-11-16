import {
  PREFERENCES_PATH,
  UserPreferencesRecordSchema,
  type UpdateUserPreferencesRequest,
  type UserPreferencesRecord,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

const parse = (body: unknown): UserPreferencesRecord => {
  const parsed = UserPreferencesRecordSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The preferences route returned an unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
};

export const getUserPreferences = async (): Promise<UserPreferencesRecord> =>
  parse(
    await releaseCopilotHttpClient.get(PREFERENCES_PATH, {
      target: 'your template',
    }),
  );

export const saveUserPreferences = async (
  request: UpdateUserPreferencesRequest,
): Promise<UserPreferencesRecord> =>
  parse(
    await releaseCopilotHttpClient.put(PREFERENCES_PATH, request, {
      target: 'your template',
    }),
  );
