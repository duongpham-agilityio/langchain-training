/**
 * Graph steps allowed for one agent run. LangGraph's default is 25, and every middleware with a
 * `beforeModel`/`afterModel` hook is a graph node, so one model-and-tools round costs several steps:
 * a normal turn (load_skill x2, render, reply) hit `GraphRecursionError` with only ~5 tool calls.
 * A runaway loop still stops, just later.
 */
export const AGENT_RECURSION_LIMIT = 100;

export const DB_CONNECTION_TIMEOUT_MS = 3000;
export const DB_HEALTH_QUERY = "select 1";
export const HEALTH_PATH = "/health";

// Everything this app creates (checkpointer tables, `threads`) lives here, not in `public`. Quote it in SQL: the hyphens need it.
export const DB_SCHEMA = "release-builder-dev";
