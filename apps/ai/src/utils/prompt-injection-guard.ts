import { ChatOpenAI } from "@langchain/openai";

// Constants
import {
  PROMPT_INJECTION_CHECK_FAILED,
  PROMPT_INJECTION_CLASSIFIER_PROMPT,
  PROMPT_INJECTION_REFUSAL,
} from "@/constants";

// Schemas
import { PromptInjectionVerdictSchema } from "@/schemas";

type ClassifierModel = Pick<ChatOpenAI, "withStructuredOutput">;

/** Returns the reply to send instead of running the agent, or `null` when the text may go on. */
export type PromptInjectionGuard = (text: string) => Promise<string | null>;

/**
 * Pre-graph prompt-injection check. A small classifier model (`AI_GUARD_MODEL`) returns a
 * structured verdict for the latest user message.
 *
 * Why not agent middleware: LangGraph checkpoints the input and every node write, so a
 * `beforeAgent` + `jumpTo: "end"` block still saved the user message and the refusal to the
 * thread (checked with `checkpointer.list`: input, step 0 and step 1 all hold them). Running
 * before the graph means a blocked turn never touches the checkpointer.
 *
 * Fail-closed: if the classifier call fails, the turn is stopped with a retry message instead of
 * reaching the main model unchecked. A guard that opens on errors is easy to bypass, and the main
 * model sits on the same provider anyway.
 */
export const createPromptInjectionGuard = (model: ClassifierModel): PromptInjectionGuard => {
  const classifier = model.withStructuredOutput(PromptInjectionVerdictSchema);
  return async (text) => {
    try {
      const { verdict } = await classifier.invoke([
        { role: "system", content: PROMPT_INJECTION_CLASSIFIER_PROMPT },
        { role: "user", content: text },
      ]);
      return verdict === "injection" ? PROMPT_INJECTION_REFUSAL : null;
    } catch (error) {
      console.error("[ai] prompt-injection check failed", error);
      return PROMPT_INJECTION_CHECK_FAILED;
    }
  };
};
