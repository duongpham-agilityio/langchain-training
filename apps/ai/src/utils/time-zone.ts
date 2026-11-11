// Constants
import { DEFAULT_TIME_ZONE, RELEASE_NOTES_DATE_LOCALE } from "@/constants";

/**
 * Header values come from the browser and are untrusted, so a zone is accepted only when
 * `Intl` can build a formatter for it; anything else falls back to the default zone.
 */
export const resolveTimeZone = (value?: string | null): string => {
  const timeZone = value?.trim();
  if (!timeZone) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat(RELEASE_NOTES_DATE_LOCALE, { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};
