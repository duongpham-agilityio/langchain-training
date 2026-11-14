import { describe, expect, it } from "vitest";

import type { Release } from "@/schemas";

import { countSummaryFormat } from "./count-summary-format";
import { draftStructure, isOneSentence } from "./draft-structure";
import { groundedItems, refInSource } from "./grounded-items";
import type { AnswerTurn } from "./types";

const release = (changes: Partial<Release["changes"][number]>[], openingLine = "Fixes and features."): Release => ({
  version: "1.0.0",
  date: "2026-11-14",
  openingLine,
  changes: changes.map((change, index) => ({
    id: `c${index}`,
    type: "feature",
    breaking: false,
    description: `Add thing number ${index}.`,
    refs: [`#${index + 1}`],
    ...change,
  })),
});

const turn = (rel: Release, userInput = "#1 a\n#2 b\n#3 c"): AnswerTurn => ({
  runId: "r",
  userInput,
  answer: "",
  draft: { platform: "markdown", label: "Markdown", content: "x", release: rel },
});

describe("groundedItems", () => {
  it("skips turns without a draft", () => {
    expect(groundedItems({ runId: "r", userInput: "", answer: "" })).toBeNull();
  });
  it("scores 1 when every ref is in the input", () => {
    expect(groundedItems(turn(release([{}, {}])))?.score).toBe(1);
  });
  it("scores an invented ref as not grounded", () => {
    const result = groundedItems(turn(release([{}, { refs: ["#999"] }])));
    expect(result?.score).toBe(0.5);
    expect(result?.comment).toContain("#999");
  });
  it("lowers the score for a change with no ref", () => {
    expect(groundedItems(turn(release([{}, { refs: undefined }])))?.score).toBe(0.5);
    expect(groundedItems(turn(release([{ refs: [] }])))?.score).toBe(0);
  });
  it("does not match a ref inside a longer one", () => {
    expect(refInSource("#12", "fix #123")).toBe(false);
    expect(refInSource("abc1234", "commit ABC1234 done")).toBe(true);
  });
});

describe("draftStructure", () => {
  it("accepts a clean release", () => {
    expect(draftStructure(turn(release([{}, {}])))?.score).toBe(1);
  });
  it("fails without changes", () => {
    expect(draftStructure(turn(release([])))?.score).toBeLessThan(1);
  });
  it("fails an empty opening line", () => {
    const rel = release([{}]);
    rel.openingLine = "  ";
    expect(draftStructure(turn(rel))?.comment).toContain("opening line");
  });
  it("fails markup in a description", () => {
    expect(draftStructure(turn(release([{ description: "Add **bold** thing." }])))?.comment).toContain("markup");
    expect(draftStructure(turn(release([{ description: "- Add thing." }])))?.comment).toContain("markup");
  });
  it("fails a two-sentence description", () => {
    expect(draftStructure(turn(release([{ description: "Add it. Also more." }])))?.comment).toContain("sentence");
    expect(isOneSentence("Bump to v1.2.3 today.")).toBe(true);
  });
  it("fails duplicate descriptions", () => {
    const result = draftStructure(turn(release([{ description: "Same." }, { description: " same. " }])));
    expect(result?.comment).toContain("duplicate");
  });
});

describe("countSummaryFormat", () => {
  const input = "#1 a\n#2 b";
  const run = (answer: string) => countSummaryFormat({ runId: "r", userInput: input, answer });
  it("accepts classes adding up to Total", () => {
    expect(run("- Features: 2\n- Fixes: 1\n- Total: 3")?.score).toBe(1);
  });
  it("allows Breaking outside the sum", () => {
    expect(run("- Features: 2\n- Fixes: 1\n- Total: 3\n- Breaking: 1")?.score).toBe(1);
  });
  it("scores low when Total includes Breaking", () => {
    const result = run("- Features: 2\n- Fixes: 1\n- Total: 4\n- Breaking: 1");
    expect(result?.score).toBeLessThan(0.8);
    expect(result?.comment).toContain("Breaking");
  });
  it("skips turns with a draft or single-line input", () => {
    expect(countSummaryFormat({ ...turn(release([{}])), answer: "- Total: 1" })).toBeNull();
    expect(countSummaryFormat({ runId: "r", userInput: "one", answer: "" })).toBeNull();
  });
});
