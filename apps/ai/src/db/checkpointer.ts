import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import type { Pool } from "pg";

/**
 * Postgres checkpointer on the shared pool, keyed by the client `threadId`.
 * `setup()` is idempotent, so running it on every start is the one-time table creation.
 * If the database is unreachable the server still starts (like `/health`), on an in-memory
 * saver, and says so loudly: threads then do not survive a restart.
 */
export const createCheckpointer = async (pool: Pool) => {
  try {
    const saver = new PostgresSaver(pool);
    await saver.setup();
    return saver;
  } catch (error) {
    console.error(
      `[ai] Postgres checkpointer setup failed, using in-memory saver: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new MemorySaver();
  }
};
