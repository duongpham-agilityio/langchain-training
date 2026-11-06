import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { ROUTE_DASHBOARD, THREAD_SEARCH_PARAM } from '@/constants/routings.ts';
import { useThreadConfig } from './use-thread-config.ts';

// One-way sync, URL -> CopilotKit. Selecting a thread already sets the active
// id and navigates (useThreadSession); this effect covers the paths that change
// the URL without going through it: a reload on `/?thread=<id>`, a pasted link,
// and the browser Back/Forward buttons.
//
// The reverse direction (writing the active id back into the URL) is
// deliberately absent: a draft thread has an id but no server-side thread, so
// putting it in the URL would produce a link that resolves to nothing.
//
// A dashboard URL *without* the param is left alone rather than reset to a new
// thread. `/` is reached both by starting a new chat and by coming back from
// History, and a draft conversation has no `?thread=` to return to — resetting
// here would throw away whatever the user had typed. Starting a thread stays an
// explicit action (startNewChat).
//
// `syncedUrlThreadIdRef` is what keeps this effect from fighting the app. React
// Router commits location changes inside `startTransition`, so a thread change
// made by startNewChat/selectThread (an urgent update) renders one frame BEFORE
// the URL catches up. In that in-between render the param is still the OLD
// thread id, and re-applying it would snap the just-minted thread back — the
// exact reason "New chat" only navigated and never opened a new thread. Each
// param value is therefore applied at most once: a later mismatch against a
// param we already consumed means the app moved the thread, not the URL. The
// ref is cleared whenever the dashboard URL has no param, so Back/Forward onto
// the same thread id still syncs.
// Call once, from the component that owns the routes (App).
export const useThreadUrlSync = (): void => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { threadId, setActiveThreadId } = useThreadConfig();
  const syncedUrlThreadIdRef = useRef<string | null>(null);

  const urlThreadId = searchParams.get(THREAD_SEARCH_PARAM);
  const isDashboard = pathname === ROUTE_DASHBOARD;

  useEffect(() => {
    if (!isDashboard) return;

    if (!urlThreadId) {
      syncedUrlThreadIdRef.current = null;
      return;
    }

    if (urlThreadId === syncedUrlThreadIdRef.current) return;
    syncedUrlThreadIdRef.current = urlThreadId;

    if (urlThreadId === threadId) return;

    setActiveThreadId(urlThreadId, { explicit: true });
  }, [isDashboard, urlThreadId, threadId, setActiveThreadId]);
};
