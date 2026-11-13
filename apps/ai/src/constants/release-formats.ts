import {
  CHANGE_TYPES,
  RELEASE_FORMAT_LABELS,
  RELEASE_FORMATS,
  SLACK_MAX_CONTENT_LENGTH,
  type ReleaseFormat,
} from "@training/contracts";

// Constants
import { STORE_LIMITS } from "./store-limits";

// The format list and labels are shared with the web client.
export { RELEASE_FORMAT_LABELS, RELEASE_FORMATS };
export type { ReleaseFormat };

/**
 * Names users say that differ from the canonical format. Keys are already normalized
 * (lower-case, separators as "-"), so "App Store" and "app_store" match without an entry.
 */
export const RELEASE_FORMAT_ALIASES: Readonly<Record<string, ReleaseFormat>> = {
  github: "markdown",
  gh: "markdown",
  html: "html-email",
  email: "html-email",
  appstore: "app-store",
  googleplay: "google-play",
  play: "google-play",
};

/** Character limit per format. Formats without an entry (Markdown, JSON, HTML email) have no limit. */
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
