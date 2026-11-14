import { Resend } from "resend";

// Constants
import { EMAIL_ERROR_MESSAGES } from "@/constants";

export class EmailSendError extends Error {}

export type EmailMessage = { from: string; to: string; subject: string; html: string };

/**
 * Sends one email through Resend. Throws `EmailSendError` with a message that never holds the
 * recipient (provider errors can echo it, so they are logged only as a name, not returned).
 */
export const sendEmailWithResend = async (apiKey: string, message: EmailMessage): Promise<void> => {
  let error: { name?: string } | null;
  try {
    ({ error } = await new Resend(apiKey).emails.send({
      from: message.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    }));
  } catch {
    throw new EmailSendError(EMAIL_ERROR_MESSAGES.SEND_FAILED);
  }
  if (error) {
    console.error(`[ai] Resend rejected the email: ${error.name ?? "unknown error"}`);
    throw new EmailSendError(EMAIL_ERROR_MESSAGES.SEND_FAILED);
  }
};
