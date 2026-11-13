export const RELEASE_NOTES_TITLE_PREFIX = "Release Notes - #";
export const DEFAULT_TIME_ZONE = "America/New_York";
export const RELEASE_NOTES_DATE_LOCALE = "en-CA";
export const RELEASE_NOTES_DATE_PATTERN = /^\d{8}$/;
export const RELEASE_NOTES_VERSION_ERROR = "Could not work out the next version";
export const RELEASE_NOTES_PREVIEW_DESCRIPTION =
  "Render the release notes in one supported format (markdown, slack, app-store, google-play, json, html-email). Call it once, only after the counts were given and a format was named, with the opening line and the typed changes. Code computes the version, fills in the date (today when omitted) and writes the text; never write per-destination text yourself. Returns JSON: on success { ok: true, release, format, text, hash, subject? }; for an unsupported format { ok: false, error, supportedFormats }; when the next version cannot be worked out { ok: false, error } with no release and no text (do not call the tool again); for an over-limit result { ok: false, error, release, hash } with no text.";
