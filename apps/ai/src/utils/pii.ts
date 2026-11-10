import type { PIIMatch } from "langchain";

// Constants
import { PHONE_PATTERNS } from "@/constants";

/** Finds phone numbers; overlapping hits from different patterns are merged. */
export const detectPhone = (content: string): PIIMatch[] => {
  const matches: PIIMatch[] = [];
  for (const pattern of PHONE_PATTERNS) {
    for (const m of content.matchAll(new RegExp(pattern))) {
      matches.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  matches.sort((a, b) => a.start - b.start);
  const merged: PIIMatch[] = [];
  for (const match of matches) {
    if (match.start < (merged.at(-1)?.end ?? 0)) continue;
    merged.push(match);
  }
  return merged;
};
