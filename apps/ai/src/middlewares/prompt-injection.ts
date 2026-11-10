import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createMiddleware } from "langchain";

// Configs
import { config } from "@/config";

// Constants
import {
  PROMPT_INJECTION_CHECK_FAILED,
  PROMPT_INJECTION_CLASSIFIER_PROMPT,
  PROMPT_INJECTION_REFUSAL,
} from "@/constants";

// Schemas
import { PromptInjectionVerdictSchema } from "@/schemas";

type ClassifierModel = {
  withStructuredOutput: ChatOpenAI["withStructuredOutput"];
};

/**
 * Runs once per turn, before any main-model call. A small classifier model (`AI_GUARD_MODEL`)
 * judges only the latest user message (earlier turns were judged when they arrived) and returns
 * a structured verdict. "safe" passes through; "injection" replies with the refusal and jumps to
 * the end, so the main model and tools never see the text.
 *
 * Fail-closed: if the classifier call fails, the turn is stopped with a retry message instead of
 * reaching the main model unchecked. A guard that silently opens on errors is easy to bypass
 * (flood or break the classifier) and the main model sits on the same provider anyway.
 *
 * Replies are `AIMessageChunk`s because the AG-UI bridge only forwards chunks.
 */
export const createPromptInjectionMiddleware = (
  model: ClassifierModel = new ChatOpenAI({ model: config.guardModel, temperature: 0 }),
) => {
  const classifier = model.withStructuredOutput(PromptInjectionVerdictSchema);
  const stop = (text: string) => ({ messages: [new AIMessageChunk(text)], jumpTo: "end" as const });

  return createMiddleware({
    name: "PromptInjectionMiddleware",
    beforeAgent: {
      canJumpTo: ["end"],
      hook: async (state) => {
        const lastHuman = state.messages.findLast((message) => HumanMessage.isInstance(message));
        if (!lastHuman) return;
        try {
          const { verdict } = await classifier.invoke([
            { role: "system", content: PROMPT_INJECTION_CLASSIFIER_PROMPT },
            { role: "user", content: lastHuman.text },
          ]);
          return verdict === "injection" ? stop(PROMPT_INJECTION_REFUSAL) : undefined;
        } catch (error) {
          console.error("[ai] prompt-injection check failed", error);
          return stop(PROMPT_INJECTION_CHECK_FAILED);
        }
      },
    },
  });
};
