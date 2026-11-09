export const TOOL_NAMES = {
  renderReleaseNotesPreview: "renderReleaseNotesPreview",
  confirmSlackPublish: "confirmSlackPublish",
  publishReleaseNotesToSlack: "publishReleaseNotesToSlack",
} as const;

/** Answers the web confirmation card sends back as the `confirmSlackPublish` tool result. */
export const CONFIRMATION_ANSWERS = {
  approved: "approved",
  rejected: "rejected",
} as const;

export const CONFIRM_SLACK_PUBLISH_DESCRIPTION =
  "Ask the user to approve posting release notes to Slack. Call it before every publish with the exact platformId, label and content to post; the user's answer comes back as the tool result (approved or rejected). Never call publishReleaseNotesToSlack without an approved answer.";

export const PUBLISH_RELEASE_NOTES_TO_SLACK_DESCRIPTION =
  "Post release notes to Slack. Only works right after confirmSlackPublish returned approved for the same platformId, label and content; one approval allows one post.";

export const SLACK_TOOL_MESSAGES = {
  NOT_APPROVED:
    "Not published: there is no approved confirmation for this exact content. Call confirmSlackPublish first.",
  PUBLISHED: "Published to Slack.",
  STUB_CALLED: "confirmSlackPublish is answered by the user interface, not by the server.",
} as const;
