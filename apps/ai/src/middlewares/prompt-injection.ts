import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";

// Constants
import { PROMPT_INJECTION_PATTERNS, PROMPT_INJECTION_REFUSAL } from "@/constants";

export const isPromptInjection = (text: string) =>
  PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text));

/**
 * Runs once per turn, before any model call. Only the latest user message is checked:
 * earlier turns were checked when they arrived. On a match the refusal becomes the reply
 * and the run jumps to the end, so the model and tools never see the text.
 * The reply is an `AIMessageChunk` because the AG-UI bridge only forwards chunks.
 */
export const promptInjectionMiddleware = createMiddleware({
  name: "PromptInjectionMiddleware",
  beforeAgent: {
    canJumpTo: ["end"],
    hook: (state) => {
      const lastHuman = state.messages.findLast((message) => HumanMessage.isInstance(message));
      if (!lastHuman || !isPromptInjection(lastHuman.text)) return;
      return {
        messages: [new AIMessageChunk(PROMPT_INJECTION_REFUSAL)],
        jumpTo: "end",
      };
    },
  },
});
