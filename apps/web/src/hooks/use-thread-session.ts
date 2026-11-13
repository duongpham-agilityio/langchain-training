import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listThreads } from '@/services/list-threads.ts';
import type { ThreadSummary } from '@/types/thread.ts';
import { RELEASE_COPILOT_AGENT_ID } from '@/constants/agent-tools/agent-id';
import { THREADS_QUERY_KEY } from '@/constants/query-keys.ts';
import { buildThreadPath, ROUTE_DASHBOARD } from '@/constants/routings.ts';
import { isPlaceholderTitle } from '@/lib/thread-title.ts';
import {
  THREAD_DRAFT_DROP_MS,
  THREAD_ROW_GRACE_MS,
  THREAD_TITLE_POLL_INTERVAL_MS,
  THREAD_TITLE_POLL_WINDOW_MS,
} from '@/constants/threads.ts';
import {
  useDraftThreadStore,
  type PendingTitleThread,
} from '@/store/draft-thread-store.ts';
import { useAuth } from './use-auth';
import { useThreadConfig } from './use-thread-config.ts';

// Threads rarely change; avoid refetching every time the dropdown reopens.
const THREADS_STALE_TIME_MS = 30_000;

// A row counts as titled once it carries something other than a placeholder
// title (empty, or the thread id). A missing row and a placeholder title both
// mean "still waiting on the server".
const hasGeneratedTitle = (
  threads: ThreadSummary[] | undefined,
  pendingThreadId: string,
): boolean => {
  const row = threads?.find((thread) => thread.id === pendingThreadId);
  if (!row) return false;

  return !isPlaceholderTitle(row.title, pendingThreadId);
};

// Three ways the wait ends: the title arrived, the window ran out, or no server
// row appeared within the grace period. The last one is what a guard-blocked
// turn looks like — refused before the thread row exists, yet the client still
// sees RUN_FINISHED, so the row will never exist and the poll must not sit out the full window on it.
const shouldKeepPollingTitle = (
  threads: ThreadSummary[] | undefined,
  pending: PendingTitleThread,
): boolean => {
  if (hasGeneratedTitle(threads, pending.id)) return false;

  const elapsedMs = Date.now() - pending.startedAt;
  if (elapsedMs > THREAD_TITLE_POLL_WINDOW_MS) return false;

  const hasRow = threads?.some((thread) => thread.id === pending.id) ?? false;

  return hasRow || elapsedMs <= THREAD_ROW_GRACE_MS;
};

interface UseThreadSessionResult {
  threadId: string;
  /**
   * True while the thread is a client-side draft: CopilotKit has minted an id
   * but no run has persisted it server-side yet, so it has no row in `threads`
   * and the welcome screen is showing.
   */
  isDraftThread: boolean;
  threads: ThreadSummary[] | undefined;
  isThreadsLoading: boolean;
  isThreadsError: boolean;
  startNewChat: () => void;
  selectThread: (threadId: string) => void;
}

// Registers no CopilotKit primitive — safe to call from any number of
// components. The active thread id is owned by the
// <CopilotChatConfigurationProvider> inside <CopilotKit> rather than by a store
// of our own: two sources of truth would fight, because writing our id back into
// <CopilotChat threadId=...> marks the thread explicit and kills the welcome
// screen before the first message. useThreadUrlSync mirrors the URL into it.
// Every other domain hook calls this one to resolve the current thread instead
// of receiving threadId as a prop.
export const useThreadSession = (): UseThreadSessionResult => {
  const { threadId, hasExplicitThreadId, setActiveThreadId, startNewThread } =
    useThreadConfig();
  const { session } = useAuth();
  const resourceId = session!.user.id;
  const navigate = useNavigate();

  const pendingTitleThread = useDraftThreadStore(
    (state) => state.pendingTitleThread,
  );
  const clearPendingTitle = useDraftThreadStore(
    (state) => state.clearPendingTitle,
  );
  const clearDraftThread = useDraftThreadStore(
    (state) => state.clearDraftThread,
  );
  const queryClient = useQueryClient();

  const {
    data: threads,
    isLoading: isThreadsLoading,
    isError: isThreadsError,
  } = useQuery({
    queryKey: THREADS_QUERY_KEY,
    queryFn: () =>
      listThreads({
        agentId: RELEASE_COPILOT_AGENT_ID,
        resourceId,
      }),
    staleTime: THREADS_STALE_TIME_MS,
    // The only polling this query ever does, and only inside the window
    // use-draft-thread-row opens after a run whose thread still has no
    // generated title. The server writes that title in a detached step after
    // the turn (`schedule-thread-title`), so a single refetch on RUN_FINISHED loses the race; an interval
    // that turns itself off as soon as one of the three stop conditions holds
    // costs a request or two instead. `refetchInterval` ignores `staleTime`, so
    // the 30s above does not hold the poll back.
    refetchInterval: (query) =>
      pendingTitleThread &&
      shouldKeepPollingTitle(query.state.data, pendingTitleThread)
        ? THREAD_TITLE_POLL_INTERVAL_MS
        : false,
  });

  // Closes the window once polling is done with it, so the store does not keep
  // a settled thread id around and reopen the poll on the next mount.
  // While the server list still has no row for the thread the window stays open
  // until the drop timeout below, which owns that case.
  useEffect(() => {
    if (!pendingTitleThread) return;
    if (shouldKeepPollingTitle(threads, pendingTitleThread)) return;

    const hasRow = threads?.some(
      (thread) => thread.id === pendingTitleThread.id,
    );
    if (!hasRow) return;

    clearPendingTitle();
  }, [threads, pendingTitleThread, clearPendingTitle]);

  // A turn the server never persisted (blocked by the guard) leaves the
  // client-side placeholder row with nothing to replace it. A timeout rather
  // than a data-driven effect, because once polling stops the cached list no
  // longer changes and nothing would re-run an effect. The cache is read inside
  // the timer so a row that arrived in the meantime keeps the draft's slot.
  useEffect(() => {
    if (!pendingTitleThread) return;

    const { id, startedAt } = pendingTitleThread;
    const timeoutId = setTimeout(
      () => {
        const latest =
          queryClient.getQueryData<ThreadSummary[]>(THREADS_QUERY_KEY);
        if (!latest?.some((thread) => thread.id === id)) clearDraftThread(id);
        clearPendingTitle();
      },
      Math.max(0, startedAt + THREAD_DRAFT_DROP_MS - Date.now()),
    );

    return () => clearTimeout(timeoutId);
  }, [pendingTitleThread, queryClient, clearDraftThread, clearPendingTitle]);

  const draftThread = useDraftThreadStore((state) => state.draftThread);

  // Merged on read rather than written into the react-query cache: a cached
  // placeholder is wiped by the next refetch (and re-added by an effect that no
  // longer matches the server row), which is how the same thread ended up
  // listed twice. Derived this way the placeholder disappears by itself the
  // moment the server list contains its id.
  const mergedThreads = useMemo(() => {
    if (!draftThread) return threads;
    if (threads?.some((thread) => thread.id === draftThread.id)) return threads;
    return [draftThread, ...(threads ?? [])];
  }, [threads, draftThread]);

  return {
    threadId,
    isDraftThread: !hasExplicitThreadId,
    threads: mergedThreads,
    isThreadsLoading,
    isThreadsError,
    // No id is created here and nothing is written to the server: CopilotKit
    // mints a fresh non-explicit id, which clears the conversation and brings
    // the welcome screen back. The row appears in the sidebar only once the
    // first message is sent (use-thread-optimistic-row).
    startNewChat: () => {
      startNewThread();
      navigate(ROUTE_DASHBOARD);
    },
    // `explicit: true` is what makes CopilotChat connect to the stored thread
    // and load its history, instead of treating the id as a fresh draft.
    selectThread: (nextThreadId) => {
      setActiveThreadId(nextThreadId, { explicit: true });
      navigate(buildThreadPath(nextThreadId));
    },
  };
};
