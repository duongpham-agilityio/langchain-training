import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { THREADS_QUERY_KEY } from '@/constants/query-keys.ts';
import {
  ROUTE_DASHBOARD,
  THREAD_SEARCH_PARAM,
  buildThreadPath,
} from '@/constants/routings.ts';
import { listThreads } from '@/services/list-threads.ts';
import { useThreadConfig } from './use-thread-config.ts';

// One-way sync, URL -> CopilotKit. Selecting a thread already sets the active
// id and navigates (useThreadSession); this effect covers the paths that change
// the URL without going through it: a reload on `/?thread=<id>`, a pasted link,
// and the browser Back/Forward buttons.
//
// The reverse direction (active id -> URL) only happens once the server list
// has a row for the thread: a draft thread has an id but no server-side thread,
// so putting it in the URL earlier would produce a link that resolves to
// nothing. After the first reply the row exists, and the URL is replaced so a
// reload reopens the same thread.
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
  const navigate = useNavigate();
  // Same key as useThreadSession: one cached list, read here only to learn which ids are on the server.
  const { data: serverThreads } = useQuery({
    queryKey: THREADS_QUERY_KEY,
    queryFn: () => listThreads(),
  });

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

  const hasServerRow =
    serverThreads?.some((thread) => thread.id === threadId) ?? false;
  useEffect(() => {
    if (!isDashboard || urlThreadId || !hasServerRow) return;
    // Mark it consumed so the URL -> thread effect does not treat it as a pasted link.
    syncedUrlThreadIdRef.current = threadId;
    navigate(buildThreadPath(threadId), { replace: true });
  }, [isDashboard, urlThreadId, hasServerRow, threadId, navigate]);
};
