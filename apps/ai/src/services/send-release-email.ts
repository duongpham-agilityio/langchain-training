import type { Pool } from "pg";

// Configs
import { config } from "@/config";

// Constants
import { EMAIL_ERROR_MESSAGES } from "@/constants";

// Db
import { getStoredRelease, recordEmailSend } from "@/db";

// Schemas
import { isValidEmailAddress, ReleaseSchema } from "@/schemas";

// Utils
import { EmailSendError, renderReleaseEmail, sendEmailWithResend } from "@/utils";

export type SendReleaseEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Emails the HTML rendering of a stored release and records the outcome with the recipient in
 * `release_sends`. The recipient is validated here again (the client check is only a convenience).
 * A mail that never left for a reason before the provider call (invalid address, no key, unknown
 * release) writes no row; a provider failure is recorded as failed. No result text holds the address.
 */
export const sendReleaseEmail = async (
  pool: Pool,
  ownerId: string,
  releaseId: string,
  recipient: unknown,
): Promise<SendReleaseEmailResult> => {
  if (!isValidEmailAddress(recipient)) {
    return { ok: false, error: EMAIL_ERROR_MESSAGES.INVALID_RECIPIENT };
  }
  const to = recipient.trim();

  const apiKey = config.resendApiKey;
  if (!apiKey) return { ok: false, error: EMAIL_ERROR_MESSAGES.MISSING_API_KEY };

  const stored = ReleaseSchema.safeParse(await getStoredRelease(pool, ownerId, releaseId));
  if (!stored.success) return { ok: false, error: EMAIL_ERROR_MESSAGES.RELEASE_NOT_FOUND };

  const { subject, html } = renderReleaseEmail(stored.data);
  try {
    await sendEmailWithResend(apiKey, { from: config.emailFrom, to, subject, html });
  } catch (error) {
    if (!(error instanceof EmailSendError)) throw error;
    await recordEmailSend(pool, ownerId, releaseId, to, { status: "failed", error: error.message }).catch(
      (e) => console.error(`[ai] could not record failed email send: ${String(e)}`),
    );
    return { ok: false, error: error.message };
  }

  // The mail is already out: a bookkeeping failure must not make the send look failed.
  await recordEmailSend(pool, ownerId, releaseId, to, { status: "sent" }).catch((e) =>
    console.error(`[ai] email sent but the send was not recorded: ${String(e)}`),
  );
  return { ok: true };
};
