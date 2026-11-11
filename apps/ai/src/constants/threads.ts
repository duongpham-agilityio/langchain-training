import { DB_SCHEMA } from "./database";

export const THREADS_PATH = "/api/memory/threads";
export const THREADS_TABLE = `"${DB_SCHEMA}".threads`;
export const THREAD_TITLE_MAX_LENGTH = 60;
// Only the opening message matters for a title; cap it so a pasted git log stays cheap.
export const THREAD_TITLE_INPUT_MAX_CHARS = 2000;
export const THREAD_TITLE_PROMPT = `Write a short title (at most 6 words) for a chat that starts with the user message below.
Reply with the title only: no quotes, no trailing punctuation.`;
