import { dynamicSystemPromptMiddleware } from "langchain";

// Constants
import {
  RELEASE_NOTES_DEFAULT_TIME_ZONE,
  buildSystemPrompt,
} from "@/constants";

const toHourIso = (now: Date): string =>
  `${now.toISOString().slice(0, 13)}:00Z`;

// en-CA gives YYYY-MM-DD; the old app used YYYYMMDD-style strings via replaceAll.
const toReleaseDate = (now: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replaceAll("-", "");

/**
 * Builds the system prompt on every model call so the time block is fresh.
 * Later phases append per-user parts here (read from `runtime.context`).
 */
export const createSystemPromptMiddleware = (now: () => Date = () => new Date()) =>
  dynamicSystemPromptMiddleware(() => {
    const current = now();
    return buildSystemPrompt({
      nowIso: toHourIso(current),
      today: toReleaseDate(current, RELEASE_NOTES_DEFAULT_TIME_ZONE),
      defaultTimeZone: RELEASE_NOTES_DEFAULT_TIME_ZONE,
    });
  });
