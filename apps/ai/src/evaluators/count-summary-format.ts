// Constants
import {
  COUNT_SUMMARY_CLASSES,
  COUNT_SUMMARY_MIN_INPUT_LINES,
  COUNT_SUMMARY_TOTAL_LABEL,
  EVALUATOR_KEYS,
} from "@/constants";

import type { Evaluator } from "./types";

const COUNT_LINE = /^\s*[-*•]\s*([A-Za-z ]+):\s*(\d+)\s*$/;

/** Count-only summary: one `- Class: N` line per non-empty class, and a Total equal to their sum. */
export const countSummaryFormat: Evaluator = ({ userInput, answer, draft }) => {
  const inputLines = userInput.split("\n").filter((line) => line.trim()).length;
  if (draft || inputLines < COUNT_SUMMARY_MIN_INPUT_LINES) return null;

  const counts = new Map<string, number>();
  for (const line of answer.split("\n")) {
    const match = COUNT_LINE.exec(line);
    if (match) counts.set(match[1].trim(), Number(match[2]));
  }

  const total = counts.get(COUNT_SUMMARY_TOTAL_LABEL);
  const known = COUNT_SUMMARY_CLASSES.filter((name) => counts.has(name));
  const sum = known.reduce((acc, name) => acc + (counts.get(name) ?? 0), 0);
  const checks = [
    { ok: total !== undefined, problem: "no Total line" },
    { ok: known.length > 0, problem: "no class count lines" },
    { ok: total === undefined || total === sum, problem: `classes sum to ${sum}, Total is ${total}` },
    { ok: known.every((name) => counts.get(name) !== 0), problem: "a class with 0 is listed" },
  ];
  const failed = checks.filter((check) => !check.ok);
  return {
    key: EVALUATOR_KEYS.countSummaryFormat,
    score: (checks.length - failed.length) / checks.length,
    comment: failed.length ? failed.map((check) => check.problem).join("; ") : "Summary format ok",
  };
};
