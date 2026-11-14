import { describe, expect, it } from "vitest";
import { ChangelogRangeError, resolveChangelogRange } from "./changelog-range";

const HCM = "Asia/Ho_Chi_Minh";
const now = new Date("2026-11-14T05:00:00Z");

describe("resolveChangelogRange", () => {
  it("resolves a month to its local first and last day", () => {
    expect(resolveChangelogRange({ month: "2026-09" }, now, HCM)).toEqual({
      from: "20260901",
      to: "20260930",
    });
  });

  it("includes a release on the 1st and excludes the 1st of the next month", () => {
    const { from, to } = resolveChangelogRange({ month: "2026-09" }, now, HCM);
    expect("20260901" >= from && "20260901" <= to).toBe(true);
    expect("20261001" >= from && "20261001" <= to).toBe(false);
  });

  it("handles February in a leap year and a December year end", () => {
    expect(resolveChangelogRange({ month: "2028-02" }, now, HCM).to).toBe("20280229");
    expect(resolveChangelogRange({ month: "2026-12" }, now, HCM).to).toBe("20261231");
  });

  it("uses the local day, not the UTC day, near midnight", () => {
    // 2026-10-31 18:00 UTC is already 1 November in Ho Chi Minh (UTC+7).
    const edge = new Date("2026-10-31T18:00:00Z");
    expect(resolveChangelogRange({ period: "this_month" }, edge, HCM)).toEqual({
      from: "20261101",
      to: "20261130",
    });
    expect(resolveChangelogRange({ period: "this_month" }, edge, "UTC")).toEqual({
      from: "20261001",
      to: "20261031",
    });
  });

  it("resolves last_month across a year boundary", () => {
    expect(resolveChangelogRange({ period: "last_month" }, new Date("2027-01-10T00:00:00Z"), HCM)).toEqual({
      from: "20261201",
      to: "20261231",
    });
  });

  it("resolves weeks Monday to Sunday", () => {
    // 2026-11-14 is a Saturday.
    expect(resolveChangelogRange({ period: "this_week" }, now, HCM)).toEqual({
      from: "20261109",
      to: "20261115",
    });
    expect(resolveChangelogRange({ period: "last_week" }, now, HCM)).toEqual({
      from: "20261102",
      to: "20261108",
    });
  });

  it("resolves today and this_year", () => {
    expect(resolveChangelogRange({ period: "today" }, now, HCM)).toEqual({ from: "20261114", to: "20261114" });
    expect(resolveChangelogRange({ period: "this_year" }, now, HCM)).toEqual({ from: "20260101", to: "20261231" });
  });

  it("accepts explicit days; a lone day is a single-day range", () => {
    expect(resolveChangelogRange({ from: "2026-09-05", to: "2026-09-10" }, now, HCM)).toEqual({
      from: "20260905",
      to: "20260910",
    });
    expect(resolveChangelogRange({ from: "2026-09-05" }, now, HCM)).toEqual({ from: "20260905", to: "20260905" });
  });

  it.each([
    [{}],
    [{ month: "2026-09", period: "today" as const }],
    [{ month: "2026-13" }],
    [{ from: "2026-02-30" }],
    [{ from: "2026-09-10", to: "2026-09-01" }],
  ])("rejects bad input %j", (input) => {
    expect(() => resolveChangelogRange(input, now, HCM)).toThrow(ChangelogRangeError);
  });

  it("rejects an unknown time zone for relative periods", () => {
    expect(() => resolveChangelogRange({ period: "today" }, now, "Nope/Zone")).toThrow(ChangelogRangeError);
  });
});
