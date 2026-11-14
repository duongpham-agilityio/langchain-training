import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// Configs
import { config } from "@/config";

// Constants
import { EDIT_APPROVAL_DESCRIPTION, SLACK_APPROVAL_DESCRIPTION, SYSTEM_PROMPT, TOOL_NAMES } from "@/constants";

// Middlewares
import {
  createDraftContextMiddleware,
  createModelFallbackMiddleware,
  createPiiMiddleware,
  createUserTemplateMiddleware,
  memoryMiddleware,
  skillsMiddleware,
} from "@/middlewares";

// Tools
import { createTools } from "@/tools";

import type { Pool } from "pg";

type CreateAgentParams = Parameters<typeof createAgent>[0];

export type CreateBaseAgentOptions = {
  middleware?: CreateAgentParams["middleware"];
  checkpointer?: CreateAgentParams["checkpointer"];
  /** Long-term per-user memory (F-16); without it the memory tools are not registered. */
  store?: CreateAgentParams["store"];
  systemPrompt?: string;
};

export const createBaseAgent = (
  pool: Pool,
  {
  middleware,
  checkpointer,
  store,
  systemPrompt = SYSTEM_PROMPT,
}: CreateBaseAgentOptions = {},
) =>
  createAgent({
    model: new ChatOpenAI({ model: config.model }),
    tools: createTools(pool, store),
    systemPrompt,
    // Skills and Slack approval always on; callers add more (e.g. guards) after it.
    middleware: [
      // Outermost model wrapper: a failing primary call is retried on the fallback model.
      createModelFallbackMiddleware(),
      skillsMiddleware,
      // Appends the user's saved template (F-16) after the static prompt on each model call.
      ...(store ? [createUserTemplateMiddleware(store)] : []),
      // Redacts email and phone in user input before the model sees it (and in stored messages).
      ...createPiiMiddleware(),
      memoryMiddleware,
      // Adds the on-screen draft to the latest user message for the model call only (not stored).
      createDraftContextMiddleware(),
      // Pauses the run (LangGraph interrupt) until the user approves or rejects a Slack publish.
      humanInTheLoopMiddleware({
        interruptOn: {
          [TOOL_NAMES.publishReleaseNotesToSlack]: {
            allowedDecisions: ["approve", "reject"],
            description: SLACK_APPROVAL_DESCRIPTION,
          },
          // Accept applies the edit, Reject changes nothing (the tool body never runs).
          [TOOL_NAMES.editReleaseItem]: {
            allowedDecisions: ["approve", "reject"],
            description: EDIT_APPROVAL_DESCRIPTION,
          },
        },
      }),
      ...(middleware ?? []),
    ],
    checkpointer,
    store,
  });

export type BaseAgent = ReturnType<typeof createBaseAgent>;
