import { describe, expect, it } from "vitest";

import type { Release } from "@/schemas";

import { applyReleaseEdit, checkEditHash } from "./edit-release-item";
import { hashRelease } from "./hash-release";

const release: Release = {
  version: "1.2.0",
  date: "20261114",
  openingLine: "A small release.",
  changes: [
    { id: "a", type: "feature", breaking: true, description: "Add search.", refs: ["#1"] },
    { id: "b", type: "fix", breaking: false, description: "Fix login." },
  ],
};

describe("applyReleaseEdit", () => {
  it("changes only the description of the selected change", () => {
    const result = applyReleaseEdit(release, "a", "Add full-text search.");
    expect(result).toMatchObject({ ok: true, previous: "Add search." });
    if (!result.ok) return;
    expect(result.release.changes[0]).toEqual({ ...release.changes[0], description: "Add full-text search." });
    expect(result.release.changes[1]).toEqual(release.changes[1]);
    expect(result.release.version).toBe("1.2.0");
    expect(result.release.openingLine).toBe(release.openingLine);
  });

  it("edits the opening line", () => {
    const result = applyReleaseEdit(release, "openingLine", "Search lands.");
    expect(result.ok && result.release.openingLine).toBe("Search lands.");
    expect(result.ok && result.release.changes).toEqual(release.changes);
  });

  it("refuses an unknown item and does not mutate the input", () => {
    expect(applyReleaseEdit(release, "zzz", "x").ok).toBe(false);
    applyReleaseEdit(release, "a", "changed");
    expect(release.changes[0].description).toBe("Add search.");
  });
});

describe("checkEditHash", () => {
  const hash = hashRelease(release);

  it("accepts a matching hash, with or without the on-screen hash", () => {
    expect(checkEditHash(hash, release).ok).toBe(true);
    expect(checkEditHash(hash, release, hash).ok).toBe(true);
  });

  it("refuses a hash that is not the release's", () => {
    const result = checkEditHash("deadbeef", release);
    expect(result).toMatchObject({ ok: false });
  });

  it("refuses when the on-screen draft has moved on", () => {
    const newer = hashRelease({ ...release, openingLine: "Newer." });
    const result = checkEditHash(hash, release, newer);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/older draft/);
  });
});
