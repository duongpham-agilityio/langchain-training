import { RELEASE_HISTORY_ROUTE_PATH } from '@/constants/endpoints.ts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';
import {
  ListReleaseHistoryResponseSchema,
  type ListReleaseHistoryResponse,
} from '@/types/release-history-record.ts';

export const listReleaseHistory = async (
  queryParams: Record<string, string> = {},
): Promise<ListReleaseHistoryResponse> => {
  const body = await releaseCopilotHttpClient.get(RELEASE_HISTORY_ROUTE_PATH, {
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
