import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Middlewares
import { createSystemPromptMiddleware } from "@/middlewares";

// Tools
import { tools } from "@/tools";

export const createBaseAgent = () =>
  createAgent({
    model: new ChatOpenAI({ model: config.model }),
    tools,
    middleware: [createSystemPromptMiddleware()],
  });

export type BaseAgent = ReturnType<typeof createBaseAgent>;
