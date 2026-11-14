import { describe, expect, it } from "vitest";

import type { Release } from "@/schemas";

import { buildSlackMessage } from "./slack-message";

const release: Release = {
  version: "1.2.0",
  date: "20261110",
  openingLine: "Faster sync.",
  changes: [{ id: "c1", type: "fix", breaking: true, description: "Fix crash on launch" }],
};

describe("buildSlackMessage", () => {
  it("renders the Slack format, not GitHub Markdown", () => {
    const result = buildSlackMessage(release);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.platformId).toBe("slack");
    expect(result.message.label).toBe("Slack");
    expect(result.message.content).toContain("*1.2.0 (20261110)*");
    expect(result.message.content).not.toContain("##");
    expect(result.message.content).not.toContain("**");
  });

  it("returns an error, not truncated text, when over the limit", () => {
    const long: Release = {
      ...release,
      changes: Array.from({ length: 800 }, (_, i) => ({
        id: `c${i}`,
        type: "feature" as const,
        breaking: false,
        description: "x".repeat(60),
      })),
    };
    expect(buildSlackMessage(long).ok).toBe(false);
  });
});
