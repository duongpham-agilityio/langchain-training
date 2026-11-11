export const DB_CONNECTION_TIMEOUT_MS = 3000;
export const DB_HEALTH_QUERY = "select 1";
export const HEALTH_PATH = "/health";

// Everything this app creates (checkpointer tables, `threads`) lives here, not in `public`. Quote it in SQL: the hyphens need it.
export const DB_SCHEMA = "release-builder-dev";
