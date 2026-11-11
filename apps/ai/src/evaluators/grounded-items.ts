// Constants
import { EVALUATOR_KEYS, REFERENCE_PATTERN } from "@/constants";

import type { Evaluator } from "./types";

/** Every `#123` / commit hash in the draft appears in what the user pasted: no invented commits. */
export const groundedItems: Evaluator = ({ userInput, draft }) => {
  if (!draft) return null;
  const references = new Set(draft.content.match(REFERENCE_PATTERN)?.map((ref) => ref.toLowerCase()));
  const source = userInput.toLowerCase();
  const invented = [...references].filter((ref) => !source.includes(ref));
  return {
    key: EVALUATOR_KEYS.groundedItems,
    score: references.size ? (references.size - invented.length) / references.size : 1,
    comment: invented.length
      ? `Not in the input: ${invented.join(", ")}`
      : `${references.size} reference(s), all in the input`,
  };
};
