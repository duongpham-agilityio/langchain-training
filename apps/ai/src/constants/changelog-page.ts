export const CHANGELOG_PAGE_MAX_LENGTH = 200_000;

/** Public path prefix of a shared page; the Vercel rewrite and the route use the same value. */
export const SHARED_PAGES_PATH = "/shared";

/** Used when `AI_PUBLIC_URL` is not set (local dev). */
export const DEFAULT_PUBLIC_URL = "http://localhost:4000";

/** The only file name the public route serves: a UUID plus `.html`, so no other path reaches the database. */
export const SHARED_PAGE_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.html$/i;

export const CHANGELOG_PAGE_MESSAGES = {
  NOT_SIGNED_IN: "You need to be signed in to publish a changelog page.",
  TOO_LONG: "The page is too long to publish. Make it shorter and try again.",
  NOT_HTML: "The page must be one complete HTML document that starts with <!doctype html>.",
  INCOMPLETE:
    "The page is cut off: it must end with </html>. Write the whole document again and use single quotes for every attribute value and font name, so nothing needs escaping.",
  SAVE_FAILED: "The page could not be saved. Try again in a moment.",
} as const;

export const PUBLISH_CHANGELOG_PAGE_DESCRIPTION =
  "Publish a self-contained HTML page of the user's changelog and return its public link. Call it only when the user explicitly asks for an artifact, a page or a link to share, after `getChangelog` has returned the releases, and call it once. It does not answer ordinary changelog questions.";

/** Fixed body of the public route's 500, so a database error never reaches a visitor. */
export const SHARED_PAGE_ERROR_MESSAGE = "The page could not be loaded. Try again in a moment.";
