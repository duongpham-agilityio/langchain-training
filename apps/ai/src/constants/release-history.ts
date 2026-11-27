import { DB_SCHEMA } from "./database";

export { RELEASE_HISTORY_PATH, SCHEDULED_SENDS_PATH, RELEASE_STATUSES } from "@training/contracts";

export const RELEASE_HISTORY_PATH_PATTERN = "/release-history/*";
export const RELEASE_CHANGE_TYPE_FEATURE = "feature";
// Qualified like `THREADS_TABLE`: the tables live in `DB_SCHEMA`, and the pool sets no `search_path`, so a bare name looks in `public`.
export const RELEASE_HISTORY_TABLE = `"${DB_SCHEMA}".release_history`;
export const RELEASE_HISTORY_DEFAULT_PAGE_SIZE = 50;
export const RELEASE_HISTORY_MAX_PAGE_SIZE = 100;
export const RELEASE_HISTORY_DEFAULT_FORMAT = "markdown" as const;
export const RELEASE_HISTORY_CURSOR_SEPARATOR = "|";

export const RELEASE_STATUS_ARCHIVED = "archived";
export const RELEASE_STATUS_PUBLISHED = "published";
export const RELEASE_SENDS_TABLE = `"${DB_SCHEMA}".release_sends`;
export const RELEASE_SEND_STATUS_SENT = "sent";
export { CHANGELOG_PATH } from "@training/contracts";
