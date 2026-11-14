import {
  CHANGELOG_PATH,
  ChangelogResponseSchema,
  type ChangelogResponse,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const listChangelog = async (
  queryParams: Record<string, string> = {},
): Promise<ChangelogResponse> => {
  const body = await releaseCopilotHttpClient.get(CHANGELOG_PATH, {
    query: queryParams,
    target: 'the changelog',
  });

  const parsed = ChangelogResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The changelog route returned an unexpected shape: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};
