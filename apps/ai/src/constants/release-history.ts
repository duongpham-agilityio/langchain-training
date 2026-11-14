export { RELEASE_HISTORY_PATH, SCHEDULED_SENDS_PATH, RELEASE_STATUSES } from "@training/contracts";

export const RELEASE_HISTORY_PATH_PATTERN = "/release-history/*";
export const NEXT_RELEASE_VERSION_PATH = "/release-history/next-version";
export const LATEST_RELEASE_VERSION_PATH = "/release-history/latest-version";

// Version rules: a first release starts here; a MAJOR.MINOR.PATCH string is required for stored versions.
export const FIRST_RELEASE_VERSION = "1.0.0";
export const RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const RELEASE_CHANGE_TYPE_FEATURE = "feature";
export const RELEASE_HISTORY_TABLE = "release_history";
export const RELEASE_HISTORY_DEFAULT_PAGE_SIZE = 50;
export const RELEASE_HISTORY_MAX_PAGE_SIZE = 100;
export const RELEASE_HISTORY_DEFAULT_FORMAT = "markdown" as const;
export const RELEASE_HISTORY_CURSOR_SEPARATOR = "|";

export const RELEASE_STATUS_ARCHIVED = "archived";
export const RELEASE_STATUS_PUBLISHED = "published";
export const RELEASE_SENDS_TABLE = "release_sends";
export const RELEASE_SEND_STATUS_SENT = "sent";
export { CHANGELOG_PATH } from "@training/contracts";
