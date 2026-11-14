import { describe, expect, it } from "vitest";

import { isValidEmailAddress, SendReleaseEmailInputSchema } from "./send-release-email";

describe("isValidEmailAddress", () => {
  it.each(["me@example.com", "first.last+tag@sub.example.co", "  padded@example.com  "])(
    "accepts %s",
    (address) => expect(isValidEmailAddress(address)).toBe(true),
  );

  it.each(["", "   ", "plain", "a@", "@b.com", "a b@c.com", "a@b", `${"a".repeat(250)}@b.com`, 42, null, undefined])(
    "rejects %s",
    (address) => expect(isValidEmailAddress(address)).toBe(false),
  );
});

describe("SendReleaseEmailInputSchema", () => {
  it("has no recipient field: an address is stripped, not kept", () => {
    const release = {
      version: "1.0.0",
      date: "20261110",
      openingLine: "Hi",
      changes: [{ id: "c1", type: "fix", breaking: false, description: "Fix" }],
    };
    const parsed = SendReleaseEmailInputSchema.parse({ release, to: "x@y.com" });
    expect(parsed).toEqual({ release: expect.objectContaining({ version: "1.0.0" }) });
  });
});
