import { describe, expect, it } from "vitest";

import { CHANGELOG_ANSWER_MAX_LENGTH } from "@training/contracts";
import { SYSTEM_PROMPT } from "@/constants/prompts";
import { userContext } from "@/utils/user-context";
import { createShowChangelogAnswer } from "./show-changelog-answer";

const run = (input: { title: string; markdown: string }, userId?: string) => {
  const tool = createShowChangelogAnswer();
  const call = () => tool.invoke(input);
  return userId ? userContext.run({ userId, timeZone: "UTC" }, call) : call();
};

describe("showChangelogAnswer", () => {
  it("returns the Markdown answer for a signed-in user", async () => {
    const out = JSON.parse(await run({ title: " Fixes in September ", markdown: "## v1.2.0" }, "u1"));
    expect(out).toEqual({ ok: true, title: "Fixes in September", markdown: "## v1.2.0" });
  });

  it("refuses without a signed-in user", async () => {
    expect(JSON.parse(await run({ title: "t", markdown: "x" })).ok).toBe(false);
  });

  it("refuses an answer over the length limit", async () => {
    const markdown = "a".repeat(CHANGELOG_ANSWER_MAX_LENGTH + 1);
    expect(JSON.parse(await run({ title: "t", markdown }, "u1")).ok).toBe(false);
  });
});

describe("changelog question prompt", () => {
  it("tells the model to answer only from the tool result and state an empty one", () => {
    expect(SYSTEM_PROMPT).toContain("getChangelog");
    expect(SYSTEM_PROMPT).toContain("nothing was found");
    expect(SYSTEM_PROMPT).toContain("showChangelogAnswer");
  });
});
