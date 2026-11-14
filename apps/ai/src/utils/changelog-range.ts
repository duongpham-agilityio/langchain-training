import { Temporal } from "@js-temporal/polyfill";

// Constants
import type { CHANGELOG_PERIODS } from "@/constants";

export type ChangelogRangeInput = {
  period?: (typeof CHANGELOG_PERIODS)[number];
  month?: string;
  from?: string;
  to?: string;
};

export type ChangelogRange = { from: string; to: string };

export class ChangelogRangeError extends Error {}

const compact = (date: Temporal.PlainDate): string =>
  date.toString({ calendarName: "never" }).replaceAll("-", "");

const parseDay = (value: string): Temporal.PlainDate => {
  try {
    return Temporal.PlainDate.from(value, { overflow: "reject" });
  } catch {
    throw new ChangelogRangeError(`"${value}" is not a valid YYYY-MM-DD date.`);
  }
};

const monthRange = (first: Temporal.PlainDate): ChangelogRange => ({
  from: compact(first),
  to: compact(first.add({ months: 1 }).subtract({ days: 1 })),
});

/**
 * Turns the tool input into inclusive `YYYYMMDD` bounds in the user's time zone. Release dates
 * are already local calendar days, so "September" is `20260901`..`20260930` whatever the
 * server clock says; `now` and `timeZone` only matter for relative periods. Pure for tests.
 */
export const resolveChangelogRange = (
  input: ChangelogRangeInput,
  now: Date,
  timeZone: string,
): ChangelogRange => {
  const { period, month, from, to } = input;
  const given = [period, month, from || to].filter(Boolean).length;
  if (given !== 1) {
    throw new ChangelogRangeError("Give exactly one of period, month, or from/to.");
  }

  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ChangelogRangeError(`"${month}" is not a valid YYYY-MM month.`);
    }
    return monthRange(Temporal.PlainDate.from(`${month}-01`));
  }

  if (from || to) {
    const start = parseDay((from ?? to)!);
    const end = parseDay((to ?? from)!);
    if (Temporal.PlainDate.compare(start, end) > 0) {
      throw new ChangelogRangeError("from must not be after to.");
    }
    return { from: compact(start), to: compact(end) };
  }

  let today: Temporal.PlainDate;
  try {
    today = Temporal.Instant.fromEpochMilliseconds(now.getTime())
      .toZonedDateTimeISO(timeZone)
      .toPlainDate();
  } catch {
    throw new ChangelogRangeError(`Unknown time zone "${timeZone}".`);
  }
  // Weeks run Monday to Sunday.
  const monday = today.subtract({ days: today.dayOfWeek - 1 });
  switch (period) {
    case "today":
      return { from: compact(today), to: compact(today) };
    case "this_week":
      return { from: compact(monday), to: compact(monday.add({ days: 6 })) };
    case "last_week":
      return { from: compact(monday.subtract({ days: 7 })), to: compact(monday.subtract({ days: 1 })) };
    case "this_month":
      return monthRange(today.with({ day: 1 }));
    case "last_month":
      return monthRange(today.with({ day: 1 }).subtract({ months: 1 }));
    case "this_year":
      return { from: compact(today.with({ month: 1, day: 1 })), to: compact(today.with({ month: 12, day: 31 })) };
    default:
      throw new ChangelogRangeError("Unknown period.");
  }
};
