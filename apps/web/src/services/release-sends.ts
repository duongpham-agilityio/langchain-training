import {
  CancelScheduledSendResponseSchema,
  ListReleaseSendsResponseSchema,
  RELEASE_HISTORY_PATH,
  SCHEDULED_SENDS_PATH,
  type ReleaseSendEntry,
} from '@training/contracts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

export const listReleaseSends = async (
  releaseId: string,
): Promise<ReleaseSendEntry[]> => {
  const body = await releaseCopilotHttpClient.get(
    `${RELEASE_HISTORY_PATH}/${encodeURIComponent(releaseId)}/sends`,
    { target: 'the release sends' },
  );
  const parsed = ListReleaseSendsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `The release sends route returned an unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data.sends;
};

export const cancelScheduledSend = async (jobId: string): Promise<void> => {
  const body = await releaseCopilotHttpClient.post(
    `${SCHEDULED_SENDS_PATH}/${encodeURIComponent(jobId)}/cancel`,
    undefined,
    { target: 'the scheduled send' },
  );
  CancelScheduledSendResponseSchema.parse(body);
};
