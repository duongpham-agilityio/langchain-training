import type { BaseMessage } from "@langchain/core/messages";

/**
 * The AG-UI client resends the FULL history on every run, and the bridge
 * converts it to LangChain messages WITHOUT the AG-UI message ids. A
 * checkpointed agent appends whatever it receives to the stored state, so
 * passing the list through duplicates every earlier turn.
 *
 * Rule: the checkpoint already holds everything up to and including the last
 * assistant reply, so only the messages after it are new.
 */
export const trimToNewMessages = (messages: BaseMessage[]): BaseMessage[] => {
  const lastAssistant = messages.findLastIndex((m) => m.type === "ai");
  return messages.slice(lastAssistant + 1);
};
