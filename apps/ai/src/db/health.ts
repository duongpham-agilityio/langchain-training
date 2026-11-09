import type { Pool } from "pg";

// Constants
import { DB_HEALTH_QUERY } from "@/constants";

export type DatabaseHealth = { reachable: boolean };

export const checkDatabase = async (pool: Pool): Promise<DatabaseHealth> => {
  try {
    await pool.query(DB_HEALTH_QUERY);
    return { reachable: true };
  } catch (error) {
    // Log only the message: the error text must never carry the connection string.
    console.error(
      `[ai] Database health check failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return { reachable: false };
  }
};
