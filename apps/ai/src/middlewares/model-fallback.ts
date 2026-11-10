import { modelFallbackMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Retries a failed primary-model call on the fallback model from config (AI_FALLBACK_MODEL).
export const createModelFallbackMiddleware = () =>
  modelFallbackMiddleware(new ChatOpenAI({ model: config.fallbackModel }));
