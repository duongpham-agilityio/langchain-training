import { summarizationMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Constants
import { MEMORY_KEEP_MESSAGES, MEMORY_SUMMARY_TRIGGER_TOKENS } from "@/constants";

/** Keeps the last N messages as is and folds older ones into a summary once the thread is long. */
export const memoryMiddleware = summarizationMiddleware({
  model: new ChatOpenAI({ model: config.model }),
  trigger: { tokens: MEMORY_SUMMARY_TRIGGER_TOKENS },
  keep: { messages: MEMORY_KEEP_MESSAGES },
});
