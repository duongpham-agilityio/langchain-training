import { describe, expect, it, vi } from "vitest";

import { SYSTEM_PROMPT } from "@/constants/prompts";
import { SKILLS } from "./index";

// The prompt module reaches `config.ts` transitively, which requires env vars at import.
vi.mock("@/config", () => ({ config: {} }));

const skill = SKILLS.find((s) => s.name === "changelog-page");

describe("changelog-page skill", () => {
  it("is registered with a one-sentence description", () => {
    expect(skill).toBeDefined();
    expect(skill?.description).toContain("Load");
  });

  it("states the hard design rules", () => {
    const content = skill?.content ?? "";
    for (const phrase of [
      "<!doctype html>",
      "inline CSS and JavaScript only",
      "No external scripts, fonts or images",
      ":root",
      "prefers-color-scheme: dark",
      "explicit background on `body`",
      "400px",
      "no horizontal page scroll",
      "visible at load",
      "One section per release",
      "grouped by type",
      "Only content from the `getChangelog` result",
      "nothing was found",
    ]) {
      expect(content).toContain(phrase);
    }
  });
});

describe("changelog page prompt rule", () => {
  it("names the tool, the skill and the plain-answer tool", () => {
    expect(SYSTEM_PROMPT).toContain("publishChangelogPage");
    expect(SYSTEM_PROMPT).toContain("changelog-page");
    expect(SYSTEM_PROMPT).toContain("showChangelogAnswer");
  });

  it("builds a page only on an explicit request and never pastes the HTML", () => {
    expect(SYSTEM_PROMPT).toContain("only when the user explicitly asks");
    expect(SYSTEM_PROMPT).toContain("Never paste the HTML into the chat");
    expect(SYSTEM_PROMPT).toContain("already in this thread's `getChangelog` result");
  });
});
