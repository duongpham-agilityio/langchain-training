import { DB_SCHEMA } from "./database";

export { THREADS_PATH } from "@training/contracts";

export const THREADS_TABLE = `"${DB_SCHEMA}".threads`;
export const THREAD_TITLE_MAX_LENGTH = 60;
// Only the opening message matters for a title; cap it so a pasted git log stays cheap.
export const THREAD_TITLE_INPUT_MAX_CHARS = 2000;
export const THREAD_TITLE_PROMPT = `Write a short title (at most 6 words) for a chat that starts with the user message below.
Reply with the title only: no quotes, no trailing punctuation.`;
// Same wording for "not yours" and "does not exist", so a caller learns nothing about other users' thread ids.
export const THREAD_ACCESS_DENIED_MESSAGE = "Thread not available";
