import { describe, expect, it } from "vitest";

import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("escapes the five HTML special characters", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("v1.2.3 release")).toBe("v1.2.3 release");
  });
});
