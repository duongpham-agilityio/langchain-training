// Constants
import { RELEASE_NOTES_DATE_LOCALE } from "@/constants";

import { localTimeToInstant, ScheduleTimeError } from "./schedule-time";

export type ScheduleRequestResult =
  | { ok: true; runAt: Date }
  | { ok: false; error: string };

/**
 * Validates a model-given local date-time for a zone. A refusal carries a message the model can act on
 * (it is told what "now" is so it can pick a valid time and ask the user again).
 */
export const resolveScheduleRequest = (
  localDateTime: string,
  timeZone: string,
  now: Date = new Date(),
): ScheduleRequestResult => {
  try {
    return { ok: true, runAt: localTimeToInstant(localDateTime, timeZone, now) };
  } catch (error) {
    if (!(error instanceof ScheduleTimeError)) throw error;
    const hint =
      error.code === "in_the_past"
        ? ` It is now ${describeNow(now, timeZone).local} in ${timeZone}. Nothing was scheduled; ask the user for a later time.`
        : " Nothing was scheduled; ask the user for another time.";
    return { ok: false, error: `${error.message}${hint}` };
  }
};

const parts = (date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", ...options })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

/** Today's date, weekday and time in the zone, as the model needs them to resolve "today" and "Monday". */
export const describeNow = (now: Date, timeZone: string) => {
  const p = parts(now, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(now);
  const date = `${p.year}-${p.month}-${p.day}`;
  return { date, time: `${p.hour}:${p.minute}`, weekday, timeZone, local: `${weekday} ${date} ${p.hour}:${p.minute}` };
};

/** `Monday, 16 Nov 2026, 09:00 (Asia/Ho_Chi_Minh)` for the confirmation text. */
export const formatScheduledTime = (runAt: Date, timeZone: string): string =>
  `${new Intl.DateTimeFormat(RELEASE_NOTES_DATE_LOCALE, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(runAt)} (${timeZone})`;
