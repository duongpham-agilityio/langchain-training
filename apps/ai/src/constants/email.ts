/** Resend's shared test sender; works without a verified domain. */
export const DEFAULT_EMAIL_FROM = "onboarding@resend.dev";

/** `configurable` key carrying the recipient of an approved email send (see `ReleaseNotesAguiAgent.run`). */
export const EMAIL_RECIPIENT_CONFIG_KEY = "emailRecipient";

export const SEND_RELEASE_EMAIL_DESCRIPTION =
  "Email the release notes (HTML email) to a recipient. The user is asked to approve every call and types the recipient address on the approval card; you never receive or pass an address. If they reject, nothing is sent.";

/** Shown on the approval card for `sendReleaseEmail`. */
export const EMAIL_APPROVAL_DESCRIPTION = "Email these release notes?";

export const EMAIL_APPROVAL_REJECT_INVALID_RECIPIENT =
  "The recipient address was missing or invalid. Nothing was sent.";

export const EMAIL_TOOL_MESSAGES = {
  SENT: "Email sent.",
} as const;

/** Messages never contain the recipient address. */
export const EMAIL_ERROR_MESSAGES = {
  NOT_SIGNED_IN: "You are not signed in, so the email was not sent.",
  INVALID_RECIPIENT: "The recipient address is missing or invalid, so the email was not sent.",
  MISSING_API_KEY:
    "Email is not set up: RESEND_API_KEY is missing on the server, so the email was not sent.",
  RELEASE_NOT_FOUND: "Release not found, so the email was not sent.",
  SEND_FAILED: "The email provider could not send the email.",
} as const;
