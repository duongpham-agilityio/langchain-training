export const TOOL_NAMES = {
  renderReleaseNotesPreview: "renderReleaseNotesPreview",
  publishReleaseNotesToSlack: "publishReleaseNotesToSlack",
} as const;

export const PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION =
  "Post release notes to Slack. The user is asked to approve every call before it runs; if they reject, nothing is posted.";

/** Shown on the approval card for `publishReleaseNotesToSlack`. */
export const SLACK_APPROVAL_DESCRIPTION = "Publish these release notes to Slack?";

export const SLACK_TOOL_MESSAGES = {
  PUBLISHED: "Published to Slack.",
} as const;

/** Reasons/decisions exchanged with the AG-UI client for tool approval interrupts. */
export const APPROVAL_INTERRUPT_REASON = "tool_approval";
export const APPROVAL_REJECT_MESSAGE = "The user rejected publishing to Slack. Nothing was sent.";
