// Shared between the hook that opens the title-polling window
// (use-draft-thread-row) and the one that polls the thread list while it is
// open (use-thread-session). Mastra generates a thread title in a promise it
// does not await, so the title lands some time after the run that triggered it
// finishes — these values are how long the client keeps looking for it.
export const THREAD_TITLE_POLL_INTERVAL_MS = 1_500;

// Cap on the window, so a title generation that failed server-side (or an
// agent configured with `generateTitle: false`) degrades to a handful of
// requests instead of polling for the rest of the session.
export const THREAD_TITLE_POLL_WINDOW_MS = 15_000;

// How long a run gets to produce a thread row at all before polling gives up.
// A turn blocked by a guardrail (`tripwire`) still ends in RUN_FINISHED, but
// the input processor aborted before anything was written, so no row will ever
// appear and waiting out the full window above would spend ten requests on a
// thread that does not exist. Two intervals of slack, because RUN_FINISHED can
// reach the client marginally before the row is committed.
export const THREAD_ROW_GRACE_MS = 3_000;
