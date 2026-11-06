import type { SlackPublishRequest } from '@/types/slack-publish-request.ts';
import { SLACK_PUBLISH_ROUTE_PATH } from '@/constants/endpoints.ts';
import { HttpError } from '@/lib/http/http-client.ts';
import { releaseCopilotHttpClient } from '@/services/http-client.ts';

interface PublishToSlackResult {
  ok: boolean;
  error?: string;
}

export const publishToSlack = async ({
  platformId,
  label,
  content,
}: SlackPublishRequest): Promise<PublishToSlackResult> => {
  try {
    await releaseCopilotHttpClient.post(
      SLACK_PUBLISH_ROUTE_PATH,
      { platformId, label, content },
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
