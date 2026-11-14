import { Temporal } from "@js-temporal/polyfill";

export type ScheduleTimeErrorCode =
  | "invalid_local_time"
  | "unknown_time_zone"
  | "nonexistent_local_time"
  | "ambiguous_local_time"
  | "in_the_past";

export class ScheduleTimeError extends Error {
  constructor(
    readonly code: ScheduleTimeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ScheduleTimeError";
  }
}

/**
 * Converts a user's local date-time (`2026-11-11T19:00`, no offset) plus an IANA zone to the
 * absolute instant to store in `scheduled_sends.run_at`. Pure: `now` is a parameter.
 * Throws `ScheduleTimeError` for an unparseable local time, an unknown zone, a local time that
 * does not exist or happens twice (daylight-saving change), or an instant not after `now`.
 */
export const localTimeToInstant = (
  localDateTime: string,
  timeZone: string,
  now: Date = new Date(),
): Date => {
  let local: Temporal.PlainDateTime;
  try {
    local = Temporal.PlainDateTime.from(localDateTime, { overflow: "reject" });
  } catch {
    throw new ScheduleTimeError(
      "invalid_local_time",
      `"${localDateTime}" is not a local date-time like 2026-11-11T19:00.`,
    );
  }

  // Zones come from the model/browser: IANA names only, never fixed offsets like "+07:00".
  const zoneName = timeZone.trim();
  if (!zoneName || /^[+-]\d/.test(zoneName)) {
    throw new ScheduleTimeError("unknown_time_zone", `Unknown time zone "${timeZone}".`);
  }

  let zoned: Temporal.ZonedDateTime;
  try {
    zoned = local.toZonedDateTime(zoneName, { disambiguation: "reject" });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    try {
      new Intl.DateTimeFormat("en-CA", { timeZone: zoneName });
    } catch {
      throw new ScheduleTimeError("unknown_time_zone", `Unknown time zone "${timeZone}".`);
    }
    // Valid zone: "reject" fired, so the time is skipped or repeated. Probe which one.
    const earlier = local.toZonedDateTime(zoneName, { disambiguation: "earlier" });
    const later = local.toZonedDateTime(zoneName, { disambiguation: "later" });
    if (earlier.epochMilliseconds === later.epochMilliseconds) throw error;
    // Gap: both choices shift to a different wall time than requested.
    const exists = Temporal.PlainDateTime.compare(earlier.toPlainDateTime(), local) === 0;
    throw exists
      ? new ScheduleTimeError(
          "ambiguous_local_time",
          `${localDateTime} happens twice in ${zoneName} (daylight-saving change). Pick another time.`,
        )
      : new ScheduleTimeError(
          "nonexistent_local_time",
          `${localDateTime} does not exist in ${zoneName} (daylight-saving change). Pick another time.`,
        );
  }

  const instant = new Date(zoned.epochMilliseconds);
  if (instant.getTime() <= now.getTime()) {
    throw new ScheduleTimeError("in_the_past", `${localDateTime} in ${zoneName} is already in the past.`);
  }
  return instant;
};
