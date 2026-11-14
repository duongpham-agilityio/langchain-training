import { EmailSendToolInputSchema, ReleaseSchema } from "@training/contracts";

export {
  EmailAddressSchema,
  EmailSendToolInputSchema,
  isValidEmailAddress,
  type EmailSendToolInput,
} from "@training/contracts";

/** Model-facing input: `describe` text stays here, on top of the shared schema. */
export const SendReleaseEmailInputSchema = EmailSendToolInputSchema.extend({
  release: ReleaseSchema.describe(
    "The release object of the rendered draft (the `release` of the tool result), copied unchanged. The server renders the HTML email from it; never pass text or an email address.",
  ),
});
