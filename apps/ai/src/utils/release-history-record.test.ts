import { describe, expect, it } from "vitest";

import { toReleaseHistoryRecord as toRecord } from "./release-history-record";

const release = {
  version: "1.2.0",
  date: "20261110",
  openingLine: "Faster sync and fewer crashes.",
  changes: [
    { id: "c1", type: "feature", breaking: false, description: "Add offline sync" },
    { id: "c2", type: "fix", breaking: true, description: "Fix crash on launch" },
  ],
};

const row = { id: "r1", release, status: "archived" as const, created_at: "2026-11-10T00:00:00Z" };

describe("toRecord", () => {
  it("renders the stored release in the requested format", () => {
    const record = toRecord(row, "markdown");
    expect(record?.release).toEqual(release);
    expect(record?.format).toBe("markdown");
    expect(record?.text).toContain("# 1.2.0 (20261110)");
    expect(record?.createdAt).toBe("2026-11-10T00:00:00.000Z");
  });

  it("renders the same release differently per format", () => {
    expect(toRecord(row, "slack")?.text).toContain("*1.2.0 (20261110)*");
  });

  it("returns null for a row whose object is not a release", () => {
    expect(toRecord({ ...row, release: {} }, "markdown")).toBeNull();
  });
});
