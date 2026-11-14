/** Change types of a release, in `release-reporting` order. Breaking is a flag, not a type. */
export const CHANGE_TYPES = [
  "feature",
  "fix",
  "performance",
  "docs",
  "internal",
  "other",
] as const;

/** The one list of release formats, shared by the render tool and the UI. */
export const RELEASE_FORMATS = [
  "markdown",
  "slack",
  "app-store",
  "google-play",
  "json",
  "html-email",
] as const;

export type ReleaseFormat = (typeof RELEASE_FORMATS)[number];

/** Display name per format id. */
export const RELEASE_FORMAT_LABELS: Record<ReleaseFormat, string> = {
  markdown: "GitHub Markdown",
  slack: "Slack",
  "app-store": "App Store",
  "google-play": "Google Play",
  json: "JSON",
  "html-email": "HTML email",
};

export const RELEASE_STATUSES = ["draft", "published", "archived"] as const;

/** Release date as yyyymmdd. */
export const RELEASE_DATE_PATTERN = /^\d{8}$/;

// Slack truncates message text past roughly 40 000 characters; stay below it to leave room for the label line.
export const SLACK_MAX_CONTENT_LENGTH = 35_000;

export const TOOL_NAMES = {
  renderReleaseNotesPreview: "renderReleaseNotesPreview",
  publishReleaseNotesToSlack: "publishReleaseNotesToSlack",
} as const;

export const RELEASE_COPILOT_AGENT_ID = "releaseCopilotAgent";

/** Request header carrying the browser IANA time zone. */
export const TIME_ZONE_HEADER = "X-Time-Zone";

// Route paths both apps agree on.
export const RUNTIME_BASE_PATH = "/api/copilotkit";
export const SLACK_PUBLISH_PATH = "/slack/publish";
export const THREADS_PATH = "/api/memory/threads";
export const RELEASE_HISTORY_PATH = "/release-history";
export const CHANGELOG_PATH = "/api/changelog";
