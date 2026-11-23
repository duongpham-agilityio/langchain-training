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
import {
  clearUserPreferencesSchema,
  getUserPreferencesSchema,
  saveUserPreferencesSchema,
  type UserMemoryScope,
} from "@/schemas";

// Context
import { readAgentContext } from "@/agent/context";

/**
 * The owner and the project come from the verified run context, never from model arguments.
 * Returns the message to answer with when the scope cannot be used (no user, or project scope without a project).
 */
const resolveTarget = (runtime: { context?: unknown }, scope: UserMemoryScope) => {
  const context = readAgentContext(runtime);
  if (!context?.userId) return { error: USER_MEMORY_MESSAGES.NO_USER };
  if (scope === "project" && !context.projectId) return { error: USER_MEMORY_MESSAGES.NO_PROJECT };
  return { userId: context.userId, projectId: scope === "project" ? context.projectId : undefined };
};

export const createUserMemoryTools = (store: BaseStore) => [
  tool(
    async ({ scope, ...update }, runtime) => {
      const target = resolveTarget(runtime, scope);
      if ("error" in target) return target.error;
      return JSON.stringify(await saveUserPreferences(store, target.userId, update, target.projectId));
    },
    {
      name: USER_MEMORY_TOOL_NAMES.save,
      description: SAVE_USER_PREFERENCES_DESCRIPTION,
      schema: saveUserPreferencesSchema,
    },
  ),
  tool(
    async ({ scope }, runtime) => {
      const levels = scope ? [scope] : (["global", "project"] as const);
      const result: Partial<Record<UserMemoryScope, object>> = {};
      for (const level of levels) {
        const target = resolveTarget(runtime, level);
        if ("error" in target) {
          // Both levels asked and only the project is missing: still answer with the global one.
          if (scope) return target.error;
          continue;
        }
        const record = await getUserPreferences(store, target.userId, target.projectId);
        if (Object.keys(record).length) result[level] = record;
      }
      return Object.keys(result).length ? JSON.stringify(result) : USER_MEMORY_MESSAGES.NOTHING_SAVED;
    },
    {
      name: USER_MEMORY_TOOL_NAMES.read,
      description: GET_USER_PREFERENCES_DESCRIPTION,
      schema: getUserPreferencesSchema,
    },
  ),
  tool(
    async ({ fields, scope }, runtime) => {
      const target = resolveTarget(runtime, scope);
      if ("error" in target) return target.error;
      await clearUserPreferences(store, target.userId, fields, target.projectId);
      return USER_MEMORY_MESSAGES.CLEARED;
    },
    {
      name: USER_MEMORY_TOOL_NAMES.clear,
      description: CLEAR_USER_PREFERENCES_DESCRIPTION,
      schema: clearUserPreferencesSchema,
    },
  ),
];
