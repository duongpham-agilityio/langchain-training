import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Constants
import { SYSTEM_PROMPT } from "@/constants";

// Middlewares
import { skillsMiddleware } from "@/middlewares";

// Tools
import { tools } from "@/tools";

export const createBaseAgent = () =>
  createAgent({
    model: new ChatOpenAI({ model: config.model }),
    tools,
    systemPrompt: SYSTEM_PROMPT,
    middleware: [skillsMiddleware],
  });

export type BaseAgent = ReturnType<typeof createBaseAgent>;
