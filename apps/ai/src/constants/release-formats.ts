// Constants
import { CHANGE_TYPES } from "./release-changes";
import { SLACK_MAX_CONTENT_LENGTH } from "./slack";
import { STORE_LIMITS } from "./store-limits";

/** The one list of release formats, shared by the render tool and the UI. */
export const RELEASE_FORMATS = [
  "markdown",
  "slack",
  "app-store",
  "google-play",
  "json",
] as const;

export type ReleaseFormat = (typeof RELEASE_FORMATS)[number];

export const RELEASE_FORMAT_LABELS: Record<ReleaseFormat, string> = {
  markdown: "GitHub Markdown",
  slack: "Slack",
  "app-store": "App Store",
  "google-play": "Google Play",
  json: "JSON",
};

/** Character limit per format. Formats without an entry (Markdown, JSON) have no limit. */
export const RELEASE_FORMAT_LIMITS: Partial<Record<ReleaseFormat, number>> = {
  slack: SLACK_MAX_CONTENT_LENGTH,
  "app-store": STORE_LIMITS.appStore,
  "google-play": STORE_LIMITS.googlePlay,
};

/** Section headings for each change type in rendered output. */
export const RELEASE_CHANGE_TYPE_LABELS: Record<
  (typeof CHANGE_TYPES)[number],
  string
> = {
  feature: "Features",
  fix: "Fixes",
  performance: "Performance",
  docs: "Documentation",
  internal: "Internal",
  other: "Other",
};

export const RELEASE_BREAKING_LABEL = "Breaking";
