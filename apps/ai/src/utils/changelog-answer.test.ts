import { describe, expect, it } from "vitest";

import { findUnknownVersions } from "./changelog-answer";

describe("findUnknownVersions", () => {
  it("accepts versions the user saved, with or without a leading v", () => {
    expect(findUnknownVersions("## v6.0.0 (20261110)\n- 6.1.0 fix", ["6.0.0", "6.1.0"])).toEqual([]);
  });

  it("lists each unknown version once", () => {
    expect(findUnknownVersions("v2.0.0 and v2.0.0 and 3.1.4", ["1.0.0"])).toEqual(["2.0.0", "3.1.4"]);
  });

  it("ignores text with no version", () => {
    expect(findUnknownVersions("Nothing was found for September 2026.", [])).toEqual([]);
  });
});
