import type { Pool } from "pg";

// Configs
import { config } from "@/config";

// Constants
import { SLACK_ERROR_MESSAGES } from "@/constants";

// Db
import { getStoredRelease, recordSlackSend } from "@/db";

// Schemas
import { ReleaseSchema } from "@/schemas";

// Utils
import { buildSlackMessage, postToSlackWebhook, SlackWebhookError } from "@/utils";

export type SendReleaseToSlackResult =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 404 | 500 | 502 | 504 };

/**
 * The one Slack send both entry points share (the route and the chat tool): loads the stored release,
 * posts its Slack rendering, then records the outcome in `release_sends`. A failed post is recorded with
 * its error; a message that never left (not found, over the limit) writes no row.
 */
export const sendReleaseToSlack = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
): Promise<SendReleaseToSlackResult> => {
  const stored = ReleaseSchema.safeParse(await getStoredRelease(pool, ownerId, releaseId));
  if (!stored.success) {
    return { ok: false, error: SLACK_ERROR_MESSAGES.RELEASE_NOT_FOUND, status: 404 };
  }

  const built = buildSlackMessage(stored.data);
  if (!built.ok) return { ok: false, error: built.error, status: 400 };

  const fail = async (error: string, status: 500 | 502 | 504): Promise<SendReleaseToSlackResult> => {
    await recordSlackSend(pool, ownerId, releaseId, { status: "failed", error }).catch((e) =>
      console.error(`[ai] could not record failed Slack send: ${String(e)}`),
    );
    return { ok: false, error, status };
  };

  const webhookUrl = config.slackWebhookUrl;
  if (!webhookUrl) return fail(SLACK_ERROR_MESSAGES.MISSING_WEBHOOK_URL, 500);

  try {
    await postToSlackWebhook(webhookUrl, built.message);
  } catch (error) {
    if (error instanceof SlackWebhookError) return fail(error.message, error.status);
    throw error;
  }

  // The message is already in Slack: a bookkeeping failure must not make the send look failed.
  await recordSlackSend(pool, ownerId, releaseId, { status: "sent" }).catch((e) =>
    console.error(`[ai] Slack message sent but the send was not recorded: ${String(e)}`),
  );
  return { ok: true };
};
