import type { Client } from "langsmith";

// Constants
import { EVALUATOR_FEEDBACK_SOURCE, EVALUATOR_PASS_THRESHOLD } from "@/constants";

// Evaluators
import { evaluators, type AnswerTurn } from "@/evaluators";

export type AnswerEvaluationScheduler = (turn: AnswerTurn) => void;

/**
 * Builds the hook the AG-UI agent calls after a completed turn.
 * Non-blocking by design: the work runs detached (never awaited) and never rejects, so a failing
 * evaluator or LangSmith outage cannot delay or fail a reply. Failures only reach the server log.
 * Without a client (empty `LANGSMITH_API_KEY`) or a run id it does nothing.
 */
export const createAnswerEvaluationScheduler = (
  client?: Pick<Client, "createFeedback">,
): AnswerEvaluationScheduler => {
  return (turn) => {
    if (!client || !turn.runId) return;

    void (async () => {
      for (const evaluate of evaluators) {
        // One broken evaluator must not stop the others.
        try {
          const result = evaluate(turn);
          if (!result) continue;
          if (result.score < EVALUATOR_PASS_THRESHOLD) {
            console.warn(`[ai] answer check ${result.key} low (${result.score}): ${result.comment}`);
          }
          await client.createFeedback(turn.runId, result.key, {
            score: result.score,
            comment: result.comment,
            sourceInfo: { source: EVALUATOR_FEEDBACK_SOURCE },
          });
        } catch (error) {
          console.error(`[ai] answer check failed for run ${turn.runId}: ${String(error)}`);
        }
      }
    })().catch((error) => {
      console.error(`[ai] answer evaluation failed for run ${turn.runId}: ${String(error)}`);
    });
  };
};
