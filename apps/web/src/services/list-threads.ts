import {
  ListThreadsResponseSchema,
  THREADS_PATH,
  type ThreadSummary,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const listThreads = async (
  queryParams: Record<string, string> = {},
): Promise<ThreadSummary[]> => {
  const body = await releaseCopilotHttpClient.get(THREADS_PATH, {
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
