import { describe, expect, it } from "vitest";
import { decideAfterFailure, isDue, isStuck } from "./scheduler-decision";

const now = new Date("2026-11-14T10:00:00Z");

describe("decideAfterFailure", () => {
  it("retries with a growing delay while attempts are under the limit", () => {
    expect(decideAfterFailure(1, 3, now, 30_000)).toEqual({
      action: "retry",
      runAt: new Date("2026-11-14T10:00:30Z"),
    });
    expect(decideAfterFailure(2, 3, now, 30_000)).toEqual({
      action: "retry",
      runAt: new Date("2026-11-14T10:01:00Z"),
    });
  });

  it("fails at the limit and beyond", () => {
    expect(decideAfterFailure(3, 3, now, 30_000)).toEqual({ action: "fail" });
    expect(decideAfterFailure(4, 3, now, 30_000)).toEqual({ action: "fail" });
  });
});

describe("isStuck", () => {
  it("is stuck only past the timeout", () => {
    expect(isStuck(new Date("2026-11-14T09:50:00Z"), now, 600_000)).toBe(false);
    expect(isStuck(new Date("2026-11-14T09:49:59Z"), now, 600_000)).toBe(true);
  });
});

describe("isDue", () => {
  const past = new Date("2026-11-14T09:00:00Z");
  it("is due for a pending job whose time has come", () => {
    expect(isDue("pending", past, now)).toBe(true);
    expect(isDue("pending", now, now)).toBe(true);
  });
  it("is not due before its time", () => {
    expect(isDue("pending", new Date("2026-11-14T10:00:01Z"), now)).toBe(false);
  });
  it("never sends a cancelled, sending, sent or failed job", () => {
    for (const status of ["cancelled", "sending", "sent", "failed"]) {
      expect(isDue(status, past, now)).toBe(false);
    }
  });
});
