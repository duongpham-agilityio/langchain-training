export const RELEASE_HISTORY_PATH = "/release-history";
export const RELEASE_HISTORY_PATH_PATTERN = "/release-history/*";
export const RELEASE_HISTORY_TABLE = "release_history";
export const RELEASE_HISTORY_DEFAULT_PAGE_SIZE = 50;
export const RELEASE_HISTORY_MAX_PAGE_SIZE = 100;
export const RELEASE_HISTORY_CURSOR_SEPARATOR = "|";

export const RELEASE_STATUSES = ["draft", "published", "archived"] as const;
export const RELEASE_STATUS_ARCHIVED = "archived";

// Platforms that have their own column; any other platform goes to `platforms`.
export const PLATFORM_COLUMNS = {
  github: "github",
  "app-store": "app_store",
  "google-play": "google_play",
} as const;
