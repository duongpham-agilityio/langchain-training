export { TOOL_NAMES } from "@training/contracts";

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

export const GET_CHANGELOG_DESCRIPTION =
  "Read-only. List the user's saved releases (version, date, changes, sent flag) for a time range. Give exactly one of: `period` (relative to today in the user's time zone), `month` (YYYY-MM) or `from`/`to` (YYYY-MM-DD, inclusive). Use it to answer questions such as what shipped in September. It never changes anything and has no filter by change type.";

export const CHANGELOG_PERIODS = [
  "today",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
] as const;

/** Releases returned per call; `truncated: true` tells the model there are more in the range. */
export const CHANGELOG_TOOL_LIMIT = 100;

export const CHANGELOG_TOOL_MESSAGES = {
  NO_USER: "No signed-in user, so the changelog cannot be read.",
  INVALID_RANGE: "Invalid time range.",
} as const;
