import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Constants
import { SYSTEM_PROMPT } from "@/constants";

// Middlewares
import { confirmationMiddleware, skillsMiddleware } from "@/middlewares";

// Tools
import { tools } from "@/tools";

type CreateAgentParams = Parameters<typeof createAgent>[0];

export type CreateBaseAgentOptions = {
  middleware?: CreateAgentParams["middleware"];
  checkpointer?: CreateAgentParams["checkpointer"];
  systemPrompt?: string;
};

export const createBaseAgent = ({
  middleware,
  checkpointer,
  systemPrompt = SYSTEM_PROMPT,
}: CreateBaseAgentOptions = {}) =>
  createAgent({
    model: new ChatOpenAI({ model: config.model }),
    tools,
    systemPrompt,
    // Skills and Slack confirmation always on; callers add more (e.g. guards) after it.
    middleware: [skillsMiddleware, confirmationMiddleware, ...(middleware ?? [])],
    checkpointer,
  });

export type BaseAgent = ReturnType<typeof createBaseAgent>;
