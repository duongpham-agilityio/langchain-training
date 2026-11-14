import { describe, expect, it } from "vitest";

import { buildChangelogQuery, toChangelogEntry } from "./changelog";
import { decodeReleaseCursor, encodeReleaseCursor } from "./release-cursor";

const OWNER = "11111111-1111-1111-1111-111111111111";

describe("buildChangelogQuery", () => {
  it("scopes to the owner and derives sent from release_sends", () => {
    const { text, params } = buildChangelogQuery(OWNER, { limit: 10 });
    expect(params).toEqual([OWNER, "sent", 11]);
    expect(text).toContain("h.owner_id = $1");
    expect(text).toContain("s.owner_id = h.owner_id");
    expect(text).toContain("s.status = $2");
    expect(text).toContain("limit $3");
  });

  it("adds date range and version filters as bound params", () => {
    const { text, params } = buildChangelogQuery(OWNER, {
      from: "20261101",
      to: "20261130",
      version: "1.2.0",
      limit: 5,
    });
    expect(params).toEqual([OWNER, "20261101", "20261130", "1.2.0", "sent", 6]);
    expect(text).toContain("h.release->>'date' >= $2");
    expect(text).toContain("h.release->>'date' <= $3");
    expect(text).toContain("h.release->>'version' = $4");
  });

  it("applies the cursor as a (created_at, id) keyset", () => {
    const cursor = encodeReleaseCursor({ created_at: "2026-11-10T00:00:00Z", id: "abc" });
    const { text, params } = buildChangelogQuery(OWNER, { cursor, limit: 5 });
    expect(params.slice(1, 3)).toEqual(["2026-11-10T00:00:00.000Z", "abc"]);
    expect(text).toContain("(h.created_at, h.id) < ($2::timestamptz, $3::uuid)");
  });

  it("rejects a malformed cursor", () => {
    expect(() => buildChangelogQuery(OWNER, { cursor: "!!", limit: 5 })).toThrow("Invalid cursor");
  });
});

describe("release cursor", () => {
  it("round-trips", () => {
    const cursor = encodeReleaseCursor({ created_at: new Date("2026-11-10T01:02:03Z"), id: "x" });
    expect(decodeReleaseCursor(cursor)).toEqual(["2026-11-10T01:02:03.000Z", "x"]);
  });
});

describe("toChangelogEntry", () => {
  const release = {
    version: "1.2.0",
    date: "20261110",
    openingLine: "Hi",
    changes: [{ id: "c1", type: "feature", breaking: false, description: "Add sync" }],
  };

  it("maps version, date, changes and the sent flag", () => {
    expect(toChangelogEntry({ id: "r1", release, created_at: "2026-11-10", sent: true })).toEqual({
      id: "r1",
      version: "1.2.0",
      date: "20261110",
      changes: release.changes,
      sent: true,
    });
  });

  it("skips a row that is not a release", () => {
    expect(toChangelogEntry({ id: "r1", release: {}, created_at: "2026-11-10", sent: false })).toBeNull();
  });
});
