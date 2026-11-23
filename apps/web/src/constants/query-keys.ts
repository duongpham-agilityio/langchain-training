// Shared between the hook that reads the thread list (use-thread-session) and
// the one that writes an optimistic row into it (use-thread-optimistic-row).
// A mismatch between the two would fail silently at runtime, not at build time.
export const THREADS_QUERY_KEY = ['threads'];

// Read by use-projects; invalidated after a project is created.
export const PROJECTS_QUERY_KEY = ['projects'];
