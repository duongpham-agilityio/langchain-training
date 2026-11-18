import { describe, expect, it } from "vitest";

import { buildSharedPageUrl } from "./shared-page-url";

const ID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";

describe("buildSharedPageUrl", () => {
  it("joins the base URL, the shared path and the id", () => {
    expect(buildSharedPageUrl("http://x:4000", ID)).toBe(`http://x:4000/shared/${ID}.html`);
  });

  it("does not double the slash when the base URL ends with one", () => {
    expect(buildSharedPageUrl("http://x:4000/", ID)).toBe(`http://x:4000/shared/${ID}.html`);
  });
});
