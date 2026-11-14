import { z } from "zod";
import { ReleaseSchema } from "./release";

/** RFC 5321 caps an address at 254 characters. */
export const EMAIL_ADDRESS_MAX_LENGTH = 254;

/**
 * One recipient address, trimmed. The card checks it on the client and the server checks it again
 * before sending, with this same schema.
 */
export const EmailAddressSchema = z
  .string()
  .trim()
  .max(EMAIL_ADDRESS_MAX_LENGTH)
  .pipe(z.email());

export const isValidEmailAddress = (value: unknown): value is string =>
  EmailAddressSchema.safeParse(value).success;

/**
 * Input of the chat tool: the release object of the draft only. The recipient is never a tool argument:
 * it travels in the approval answer, so the model never sees it and it stays out of the thread.
 */
export const EmailSendToolInputSchema = z.object({
  release: ReleaseSchema,
});

export type EmailSendToolInput = z.infer<typeof EmailSendToolInputSchema>;
