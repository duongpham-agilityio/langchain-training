import {
  ListReleaseHistoryResponseSchema,
  RELEASE_HISTORY_PATH,
  type ListReleaseHistoryResponse,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const listReleaseHistory = async (
  queryParams: Record<string, string> = {},
): Promise<ListReleaseHistoryResponse> => {
  const body = await releaseCopilotHttpClient.get(RELEASE_HISTORY_PATH, {
    query: queryParams,
    target: 'the release history list',
  });

  const parsed = ListReleaseHistoryResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The release history route returned an unexpected shape: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};
