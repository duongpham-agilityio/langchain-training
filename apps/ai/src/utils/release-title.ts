// Constants
import {
  RELEASE_NOTES_DATE_LOCALE,
  RELEASE_NOTES_TIME_ZONE,
  RELEASE_NOTES_TITLE_PREFIX,
} from "@/constants";

export const formatReleaseDate = (
  now: Date = new Date(),
  timeZone: string = RELEASE_NOTES_TIME_ZONE,
): string =>
  new Intl.DateTimeFormat(RELEASE_NOTES_DATE_LOCALE, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replaceAll("-", "");

export const buildReleaseTitle = (
  releaseDate: string,
  titleOverride?: string | null,
): string => titleOverride ?? `${RELEASE_NOTES_TITLE_PREFIX}${releaseDate}`;
