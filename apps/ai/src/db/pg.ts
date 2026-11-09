import { Pool } from "pg";

// Configs
import { config } from "@/config";

// Constants
import { DB_CONNECTION_TIMEOUT_MS } from "@/constants";

export const createPgPool = () => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
  });
  // An idle client that loses its connection emits "error" on the pool; with no listener
  // Node treats it as an unhandled error and the whole server crashes.
  pool.on("error", (error) => {
    console.error(`[ai] Postgres pool error: ${error.message}`);
  });
  return pool;
};
