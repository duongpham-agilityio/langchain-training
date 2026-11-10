import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Constants
import { SLACK_APPROVAL_DESCRIPTION, SYSTEM_PROMPT, TOOL_NAMES } from "@/constants";

// Middlewares
import { createModelFallbackMiddleware, memoryMiddleware, skillsMiddleware } from "@/middlewares";

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
    // Skills and Slack approval always on; callers add more (e.g. guards) after it.
    middleware: [
      // Outermost model wrapper: a failing primary call is retried on the fallback model.
      createModelFallbackMiddleware(),
      skillsMiddleware,
      memoryMiddleware,
      // Pauses the run (LangGraph interrupt) until the user approves or rejects a Slack publish.
      humanInTheLoopMiddleware({
        interruptOn: {
          [TOOL_NAMES.publishReleaseNotesToSlack]: {
            allowedDecisions: ["approve", "reject"],
            description: SLACK_APPROVAL_DESCRIPTION,
          },
        },
      }),
      ...(middleware ?? []),
    ],
    checkpointer,
  });

export type BaseAgent = ReturnType<typeof createBaseAgent>;
