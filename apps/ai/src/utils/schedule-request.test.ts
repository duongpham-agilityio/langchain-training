import { describe, expect, it } from "vitest";

import { describeNow, formatScheduledTime, resolveScheduleRequest } from "./schedule-request";

// 2026-11-16 is a Monday. 02:00 UTC is already 09:00 in Ho Chi Minh (UTC+7).
const now = new Date("2026-11-16T02:00:00Z");
const zone = "Asia/Ho_Chi_Minh";

describe("describeNow", () => {
  it("gives date, weekday and time in the user's zone, not UTC", () => {
    expect(describeNow(new Date("2026-11-15T20:30:00Z"), zone)).toMatchObject({
      date: "2026-11-16",
      weekday: "Monday",
      time: "03:30",
    });
    expect(describeNow(new Date("2026-11-15T20:30:00Z"), "UTC")).toMatchObject({
      date: "2026-11-15",
      weekday: "Sunday",
    });
  });
});

describe("resolveScheduleRequest", () => {
  it("converts a later local time with the zone", () => {
    const result = resolveScheduleRequest("2026-11-16T19:00", zone, now);
    expect(result).toEqual({ ok: true, runAt: new Date("2026-11-16T12:00:00Z") });
  });

  it("refuses a past time and tells the model what now is", () => {
    const result = resolveScheduleRequest("2026-11-16T07:00", zone, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("already in the past");
      expect(result.error).toContain("Monday 2026-11-16 09:00");
    }
  });

  it("refuses unparseable times and unknown zones", () => {
    expect(resolveScheduleRequest("tomorrow 9am", zone, now).ok).toBe(false);
    expect(resolveScheduleRequest("2026-11-17T09:00", "Mars/Base", now).ok).toBe(false);
  });
});

describe("formatScheduledTime", () => {
  it("shows the local time with the zone name", () => {
    const text = formatScheduledTime(new Date("2026-11-16T12:00:00Z"), zone);
    expect(text).toContain("19:00");
    expect(text).toContain(`(${zone})`);
  });
});
