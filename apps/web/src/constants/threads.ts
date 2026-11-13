// Sidebar label for a thread whose title has not been generated yet.
export const NEW_CHAT_TITLE = 'New chat';

// Shared between the hook that opens the title-polling window
// (use-draft-thread-row) and the one that polls the thread list while it is
// open (use-thread-session). The LangChain server generates a thread title in a
// detached step after the turn (`schedule-thread-title`), so the title lands
// some time after the run that triggered it finishes — these values are how long the client keeps looking for it.
export const THREAD_TITLE_POLL_INTERVAL_MS = 1_500;

// Cap on the window, so a title generation that failed server-side degrades to a handful of
// requests instead of polling for the rest of the session.
export const THREAD_TITLE_POLL_WINDOW_MS = 15_000;

// How long a run gets to produce a thread row at all before polling gives up.
// A turn blocked by the guard is refused before the thread row exists, yet
// the client still sees RUN_FINISHED, so no row will ever appear and waiting out the full window above would spend ten requests on a
// thread that does not exist. Two intervals of slack, because RUN_FINISHED can
// reach the client marginally before the row is committed.
export const THREAD_ROW_GRACE_MS = 3_000;

// When the client-side placeholder row is dropped if the server list still has
// no row for it. Measured from RUN_FINISHED: the grace period plus two poll
// intervals, so the last poll that could still see a late-committed row has
// come back before the placeholder disappears.
export const THREAD_DRAFT_DROP_MS =
  THREAD_ROW_GRACE_MS + 2 * THREAD_TITLE_POLL_INTERVAL_MS;
