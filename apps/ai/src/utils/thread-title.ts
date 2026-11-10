import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Constants
import {
  THREAD_TITLE_INPUT_MAX_CHARS,
  THREAD_TITLE_MAX_LENGTH,
  THREAD_TITLE_PROMPT,
} from "@/constants";

/** Strips the quotes/punctuation models like to add and caps the length. */
export const cleanThreadTitle = (raw: string): string =>
  raw
    .trim()
    .replace(/^["'`]+|["'`.]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, THREAD_TITLE_MAX_LENGTH)
    .trim();

/** Returns "" when the model gives nothing usable, so the caller can skip the write. */
export const generateThreadTitle = async (
  model: Pick<BaseChatModel, "invoke">,
  firstUserMessage: string,
): Promise<string> => {
  const reply = await model.invoke([
    ["system", THREAD_TITLE_PROMPT],
    ["human", firstUserMessage.slice(0, THREAD_TITLE_INPUT_MAX_CHARS)],
  ]);
  return cleanThreadTitle(reply.text);
};
