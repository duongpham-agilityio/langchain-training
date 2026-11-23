import { InMemoryStore, type BaseStore } from "@langchain/langgraph";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

// Configs
import { config } from "@/config";

// Constants
import { DB_SCHEMA, USER_MEMORY_KEY, USER_MEMORY_NAMESPACE_ROOT } from "@/constants";

// Schemas
import type { UserPreferences } from "@/schemas";

/**
 * LangGraph Postgres store (same schema as the checkpointer). `setup()` is idempotent and runs at every start.
 * If it fails the server still starts on an in-memory store and says so: memory then does not survive a restart.
 */
export const createUserMemoryStore = async (): Promise<BaseStore> => {
  try {
    const store = PostgresStore.fromConnString(config.databaseUrl, { schema: DB_SCHEMA });
    await store.setup();
    return store;
  } catch (error) {
    console.error(
      `[ai] Postgres store setup failed, using in-memory store: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new InMemoryStore();
  }
};

// The namespace is the verified user id (plus the verified project id for the project level), so one
// user's record is unreachable from another's and one project's from another's.
const namespaceFor = (userId: string, projectId?: string) =>
  projectId ? [USER_MEMORY_NAMESPACE_ROOT, userId, projectId] : [USER_MEMORY_NAMESPACE_ROOT, userId];

/** Without `projectId` this is the global record of the user; with it, that project's record. */
export const getUserPreferences = async (
  store: BaseStore,
  userId: string,
  projectId?: string,
): Promise<Partial<UserPreferences>> =>
  ((await store.get(namespaceFor(userId, projectId), USER_MEMORY_KEY))?.value ?? {}) as Partial<UserPreferences>;

/** Merge: given fields overwrite, the rest stay. Returns the new record. */
export const saveUserPreferences = async (
  store: BaseStore,
  userId: string,
  update: Partial<UserPreferences>,
  projectId?: string,
) => {
  const next = { ...(await getUserPreferences(store, userId, projectId)), ...update };
  await store.put(namespaceFor(userId, projectId), USER_MEMORY_KEY, next);
  return next;
};

/** Removes the given fields, or the whole record when none are given. */
export const clearUserPreferences = async (
  store: BaseStore,
  userId: string,
  fields?: readonly (keyof UserPreferences)[],
  projectId?: string,
) => {
  const namespace = namespaceFor(userId, projectId);
  if (!fields?.length) {
    await store.delete(namespace, USER_MEMORY_KEY);
    return;
  }
  const next: Partial<UserPreferences> = { ...(await getUserPreferences(store, userId, projectId)) };
  for (const field of fields) delete next[field];
  if (Object.keys(next).length === 0) await store.delete(namespace, USER_MEMORY_KEY);
  else await store.put(namespace, USER_MEMORY_KEY, next);
};
