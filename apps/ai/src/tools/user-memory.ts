import type { BaseStore } from "@langchain/langgraph";
import { tool } from "langchain";

// Constants
import {
  CLEAR_USER_PREFERENCES_DESCRIPTION,
  GET_USER_PREFERENCES_DESCRIPTION,
  SAVE_USER_PREFERENCES_DESCRIPTION,
  USER_MEMORY_MESSAGES,
  USER_MEMORY_TOOL_NAMES,
} from "@/constants";

// Db
import { clearUserPreferences, getUserPreferences, saveUserPreferences } from "@/db";

// Schemas
import { clearUserPreferencesSchema, saveUserPreferencesSchema } from "@/schemas";

// Context
import { readAgentContext } from "@/agent/context";

// The owner comes from the verified run context, never from model arguments.
const currentUserId = (runtime: { context?: unknown }) => readAgentContext(runtime)?.userId;

export const createUserMemoryTools = (store: BaseStore) => [
  tool(
    async (update, runtime) => {
      const userId = currentUserId(runtime);
      if (!userId) return USER_MEMORY_MESSAGES.NO_USER;
      return JSON.stringify(await saveUserPreferences(store, userId, update));
    },
    {
      name: USER_MEMORY_TOOL_NAMES.save,
      description: SAVE_USER_PREFERENCES_DESCRIPTION,
      schema: saveUserPreferencesSchema,
    },
  ),
  tool(
    async (_input, runtime) => {
      const userId = currentUserId(runtime);
      if (!userId) return USER_MEMORY_MESSAGES.NO_USER;
      const record = await getUserPreferences(store, userId);
      return Object.keys(record).length ? JSON.stringify(record) : USER_MEMORY_MESSAGES.NOTHING_SAVED;
    },
    {
      name: USER_MEMORY_TOOL_NAMES.read,
      description: GET_USER_PREFERENCES_DESCRIPTION,
    },
  ),
  tool(
    async ({ fields }, runtime) => {
      const userId = currentUserId(runtime);
      if (!userId) return USER_MEMORY_MESSAGES.NO_USER;
      await clearUserPreferences(store, userId, fields);
      return USER_MEMORY_MESSAGES.CLEARED;
    },
    {
      name: USER_MEMORY_TOOL_NAMES.clear,
      description: CLEAR_USER_PREFERENCES_DESCRIPTION,
      schema: clearUserPreferencesSchema,
    },
  ),
];
