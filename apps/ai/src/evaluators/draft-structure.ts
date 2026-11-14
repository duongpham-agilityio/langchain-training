// Constants
import { EVALUATOR_KEYS } from "@/constants";

import type { Evaluator } from "./types";

/** Markdown the renderer owns: bold, code, headings, bullets, links. */
const MARKUP = /\*\*|__|`|^#{1,6}\s|^\s*[-*•]\s|\[[^\]]*\]\([^)]*\)/;
/** Sentence end followed by more text: a second sentence. */
const SECOND_SENTENCE = /[.!?]["')\]]?\s+\S/;

export const isOneSentence = (text: string): boolean => !SECOND_SENTENCE.test(text.trim());
export const hasMarkup = (text: string): boolean => MARKUP.test(text);

/** The release object is well formed; markup is the renderer's job, so the text must not carry any. */
export const draftStructure: Evaluator = ({ draft }) => {
  if (!draft) return null;
  const { openingLine, changes } = draft.release;
  const descriptions = changes.map((change) => change.description.trim());
  const normalized = descriptions.map((text) => text.toLowerCase().replace(/\s+/g, " "));
  const duplicates = normalized.filter((text, index) => normalized.indexOf(text) !== index);

  const checks = [
    { ok: changes.length > 0, problem: "no changes" },
    { ok: openingLine.trim().length > 0, problem: "empty opening line" },
    {
      ok: descriptions.every(isOneSentence),
      problem: "a description is more than one sentence",
    },
    {
      ok: !descriptions.some(hasMarkup),
      problem: "a description has markup",
    },
    { ok: duplicates.length === 0, problem: "duplicate descriptions" },
  ];
  const failed = checks.filter((check) => !check.ok);
  return {
    key: EVALUATOR_KEYS.draftStructure,
    score: (checks.length - failed.length) / checks.length,
    comment: failed.length ? failed.map((check) => check.problem).join("; ") : "Release object structure ok",
  };
};
