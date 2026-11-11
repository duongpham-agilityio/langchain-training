import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import type { Pool } from "pg";

// Constants
import { DB_SCHEMA } from "@/constants";

/**
 * Postgres checkpointer on the shared pool, keyed by the client `threadId`.
 * `setup()` creates the schema and tables if missing and is idempotent, so running it on every start replaces a manual migration.
 * If the database is unreachable the server still starts (like `/health`), on an in-memory
 * saver, and says so loudly: threads then do not survive a restart.
 */
export const createCheckpointer = async (pool: Pool) => {
  try {
    const saver = new PostgresSaver(pool, undefined, { schema: DB_SCHEMA });
    await saver.setup();
    return saver;
  } catch (error) {
    console.error(
      `[ai] Postgres checkpointer setup failed, using in-memory saver: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new MemorySaver();
  }
};
