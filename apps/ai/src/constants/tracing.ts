/** Name of the agent run in the LangSmith trace list. */
export const TRACE_RUN_NAME = "release-notes-turn";

/** Tag on every traced run, to filter this app's traces in LangSmith. */
export const TRACE_TAG = "release-copilot";

/** Metadata keys that make a trace findable by conversation and owner. */
export const TRACE_METADATA_KEYS = {
  threadId: "thread_id",
  userId: "user_id",
} as const;
