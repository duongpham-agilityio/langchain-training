import { createMiddleware } from "langchain";
import { HumanMessage } from "@langchain/core/messages";

// Agui
import { buildDraftBlock, DraftContextSchema } from "@/agui";

// Constants
import { DRAFT_CONTEXT_CONFIG_KEY } from "@/constants";

/**
 * Gives the model the draft the user is looking at, for this call only. The draft arrives in
 * `configurable` (see `ReleaseNotesAguiAgent.run`) and is appended to the latest human message in the
 * request copy, never in graph state, so the checkpointer keeps the message as the user sent it and
 * the next turn starts clean. It is not in the system prompt either, which stays static for the
 * provider prompt cache.
 */
export const createDraftContextMiddleware = () =>
  createMiddleware({
    name: "DraftContextMiddleware",
    wrapModelCall: (request, handler) => {
      const draft = DraftContextSchema.safeParse(request.runtime.configurable?.[DRAFT_CONTEXT_CONFIG_KEY]);
      const index = request.messages.findLastIndex((message) => HumanMessage.isInstance(message));
      // Only a fresh user turn gets the block; mid-turn model calls (after tool results) end on a tool message.
      if (!draft.success || index === -1 || index !== request.messages.length - 1) return handler(request);

      const latest = request.messages[index];
      const messages = [...request.messages];
      messages[index] = new HumanMessage({
        content: `${latest.text}${buildDraftBlock(draft.data)}`,
        id: latest.id,
      });
      return handler({ ...request, messages });
    },
  });
