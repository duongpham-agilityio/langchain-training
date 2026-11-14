import { describe, expect, it } from "vitest";

import { findResumeRecipient, toResumeCommand } from "./resume";

const approve = (payload: Record<string, unknown> = {}) => ({
  interruptId: "i1",
  status: "resolved" as const,
  payload: { decision: "approve", ...payload },
});

const decisionsOf = (resume: Parameters<typeof toResumeCommand>[0]) =>
  (toResumeCommand(resume).resume as { decisions: { type: string }[] }).decisions;

describe("findResumeRecipient", () => {
  it("returns the trimmed address of an approval", () => {
    expect(findResumeRecipient([approve({ recipient: " me@example.com " })])).toBe("me@example.com");
  });

  it("returns undefined without a recipient, with an invalid one, or on a rejection", () => {
    expect(findResumeRecipient([approve()])).toBeUndefined();
    expect(findResumeRecipient([approve({ recipient: "nope" })])).toBeUndefined();
    expect(
      findResumeRecipient([{ interruptId: "i1", status: "cancelled", payload: { recipient: "me@example.com" } }]),
    ).toBeUndefined();
  });
});

describe("toResumeCommand", () => {
  it("approves with and without a valid recipient, and never puts the address in the command", () => {
    const command = toResumeCommand([approve({ recipient: "me@example.com" })]);
    expect(JSON.stringify(command.resume)).not.toContain("me@example.com");
    expect(decisionsOf([approve({ recipient: "me@example.com" })])).toEqual([{ type: "approve" }]);
    expect(decisionsOf([approve()])).toEqual([{ type: "approve" }]);
  });

  it("rejects an approval whose recipient is invalid", () => {
    expect(decisionsOf([approve({ recipient: "not-an-address" })])[0].type).toBe("reject");
    expect(decisionsOf([approve({ recipient: "" })])[0].type).toBe("reject");
  });

  it("rejects anything that is not an explicit approval", () => {
    expect(decisionsOf([{ interruptId: "i1", status: "cancelled" }])[0].type).toBe("reject");
  });
});
