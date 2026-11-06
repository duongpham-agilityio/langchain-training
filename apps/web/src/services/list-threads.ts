import { MEMORY_THREADS_ROUTE_PATH } from '@/constants/endpoints.ts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';
import {
  ListThreadsResponseSchema,
  type ThreadSummary,
} from '@/types/thread.ts';

export const listThreads = async (
  queryParams: Record<string, string> = {},
): Promise<ThreadSummary[]> => {
  const body = await releaseCopilotHttpClient.get(MEMORY_THREADS_ROUTE_PATH, {
    query: queryParams,
    target: 'the threads list',
  });

  const parsed = ListThreadsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The threads route returned an unexpected shape: ${parsed.error.message}`,
    );
  }

  return parsed.data.threads;
};
