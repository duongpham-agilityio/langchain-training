// Constants
import { EVALUATOR_KEYS } from "@/constants";

import type { Evaluator } from "./types";

/** `ref` appears in `source` as a whole token, so `#12` is not found inside `#123`. */
export const refInSource = (ref: string, source: string): boolean => {
  const needle = ref.trim().toLowerCase();
  if (!needle) return false;
  const haystack = source.toLowerCase();
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const before = haystack[at - 1];
    const after = haystack[at + needle.length];
    const isWord = (char: string | undefined) => char !== undefined && /[a-z0-9]/.test(char);
    if (!(isWord(before) && isWord(needle[0])) && !(isWord(after) && isWord(needle[needle.length - 1]))) {
      return true;
    }
    from = at + 1;
  }
};

/**
 * Every ref of every change appears in what the user pasted. A change with no ref, or with a ref the
 * input does not contain, counts as not grounded; the score is the share of grounded changes.
 */
export const groundedItems: Evaluator = ({ userInput, draft }) => {
  if (!draft) return null;
  const { changes } = draft.release;
  if (!changes.length) {
    return { key: EVALUATOR_KEYS.groundedItems, score: 1, comment: "No changes to ground" };
  }

  const problems: string[] = [];
  for (const change of changes) {
    const refs = change.refs ?? [];
    if (!refs.length) {
      problems.push(`${change.id}: no ref`);
      continue;
    }
    const invented = refs.filter((ref) => !refInSource(ref, userInput));
    if (invented.length) problems.push(`${change.id}: not in the input: ${invented.join(", ")}`);
  }
  return {
    key: EVALUATOR_KEYS.groundedItems,
    score: (changes.length - problems.length) / changes.length,
    comment: problems.length ? problems.join("; ") : `${changes.length} change(s), all refs in the input`,
  };
};
