import {
  SLACK_PUBLISH_PATH,
  type SlackPublishRequest,
} from '@training/contracts';
import { HttpError } from '@/lib/http/http-client.ts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

interface PublishToSlackResult {
  ok: boolean;
  error?: string;
}

export const publishToSlack = async ({
  releaseId,
}: SlackPublishRequest): Promise<PublishToSlackResult> => {
  try {
    await releaseCopilotHttpClient.post(
      SLACK_PUBLISH_PATH,
      { releaseId },
      { target: 'the Slack publish route' },
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof HttpError ? error.message : String(error),
    };
  }
};
