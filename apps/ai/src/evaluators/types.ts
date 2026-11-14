import type { Release } from "@/schemas";

/** Data of one completed chat turn that the evaluators look at. */
export type AnswerTurn = {
  /** Id of the agent run in LangSmith; the score is attached to it. */
  runId: string;
  /** Text of every user message in the turn's history (the pasted log may be an earlier message). */
  userInput: string;
  /** Assistant text streamed in this turn. */
  answer: string;
  /** Result of `renderReleaseNotesPreview` (release object and its rendered text), when this turn rendered a draft. */
  draft?: { platform: string; label: string; content: string; release: Release };
};

export type EvaluatorResult = { key: string; score: number; comment: string };

/** Pure check. Returns `null` when the check does not apply to this turn. */
export type Evaluator = (turn: AnswerTurn) => EvaluatorResult | null;
