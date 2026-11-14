import { describe, expect, it } from "vitest";
import { localTimeToInstant, ScheduleTimeError } from "./schedule-time";

const now = new Date("2026-11-01T00:00:00Z");

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof ScheduleTimeError ? error.code : "other";
  }
  return "none";
};

describe("localTimeToInstant", () => {
  it("converts Ho Chi Minh local time to UTC", () => {
    expect(localTimeToInstant("2026-11-11T19:00", "Asia/Ho_Chi_Minh", now).toISOString()).toBe(
      "2026-11-11T12:00:00.000Z",
    );
  });

  it("handles a zone with daylight saving on an ordinary day", () => {
    expect(localTimeToInstant("2026-12-01T09:00", "America/New_York", now).toISOString()).toBe(
      "2026-12-01T14:00:00.000Z",
    );
  });

  it("refuses a time skipped by the spring-forward hour", () => {
    expect(codeOf(() => localTimeToInstant("2027-03-14T02:30", "America/New_York", now))).toBe(
      "nonexistent_local_time",
    );
  });

  it("refuses a time repeated by the fall-back hour", () => {
    expect(codeOf(() => localTimeToInstant("2026-11-01T01:30", "America/New_York", new Date("2026-10-01T00:00:00Z")))).toBe(
      "ambiguous_local_time",
    );
  });

  it("refuses a time in the past", () => {
    expect(codeOf(() => localTimeToInstant("2026-10-31T19:00", "Asia/Ho_Chi_Minh", now))).toBe("in_the_past");
  });

  it("refuses an unknown zone name", () => {
    expect(codeOf(() => localTimeToInstant("2026-11-11T19:00", "Not/AZone", now))).toBe("unknown_time_zone");
    expect(codeOf(() => localTimeToInstant("2026-11-11T19:00", "", now))).toBe("unknown_time_zone");
  });

  it("refuses an unparseable local time", () => {
    expect(codeOf(() => localTimeToInstant("tomorrow 9am", "Asia/Ho_Chi_Minh", now))).toBe("invalid_local_time");
    expect(codeOf(() => localTimeToInstant("2026-02-30T10:00", "Asia/Ho_Chi_Minh", now))).toBe("invalid_local_time");
  });
});
