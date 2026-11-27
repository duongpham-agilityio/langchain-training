/**
 * Graph steps allowed for one agent run. LangGraph's default is 25, and every middleware with a
 * `beforeModel`/`afterModel` hook is a graph node, so one model-and-tools round costs several steps:
 * a normal turn (load_skill x2, render, reply) hit `GraphRecursionError` with only ~5 tool calls.
 * A runaway loop still stops, just later.
 */
export const AGENT_RECURSION_LIMIT = 100;

/**
 * When LangGraph saves checkpoints during a run. The default, `async`, writes one after every graph step
 * and every middleware hook is a step, so one turn wrote ~11 checkpoints of 6 queries each, one after
 * another, after the last model call (~0.5 s each at 90 ms per query).
 * `exit` writes once, when the run finishes or stops at an approval, which is all this app reads back:
 * the next turn and a resumed approval load the latest state, never an intermediate step.
 * Cost: a server that dies mid-turn leaves no checkpoint of that turn.
 */
export const AGENT_DURABILITY = "exit" as const;

export const DB_CONNECTION_TIMEOUT_MS = 3000;
export const DB_HEALTH_QUERY = "select 1";
export const HEALTH_PATH = "/health";

// Everything this app creates (checkpointer tables, `threads`) lives here, not in `public`. Quote it in SQL: the hyphens need it.
export const DB_SCHEMA = "release-builder-dev";

// Same schema as the other tables the code queries (`scheduled_sends`, `release_history`); the migration file is written like theirs.
export const SHARED_PAGES_TABLE = `"${DB_SCHEMA}".shared_pages`;

// Created by `supabase/migrations/20261120000000_create_projects.sql` (written like the other migrations); `threads.project_id` points here, so it must exist before the server starts.
export const PROJECTS_TABLE = `"${DB_SCHEMA}".projects`;
