import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AbstractAgent } from '@copilotkit/react-core/v2';
import type { ThreadSummary } from '@/types/thread.ts';
import { THREADS_QUERY_KEY } from '@/constants/query-keys.ts';
import { useDraftThreadStore } from '@/store/draft-thread-store.ts';
import { useAuth } from './use-auth.ts';
import { useThreadConfig } from './use-thread-config.ts';

interface UseDraftThreadRowInput {
  // `AbstractAgent` re-exported by CopilotKit, not the one from our direct
  // `@ag-ui/client` dependency: CopilotKit bundles its own copy, and the two
  // declarations have separate private fields, so importing the other one makes
  // `useAgent().agent` unassignable here.
  agent: AbstractAgent;
  hasMessages: boolean;
}
export const useDraftThreadRow = ({
  agent,
  hasMessages,
}: UseDraftThreadRowInput): void => {
  const { threadId, hasExplicitThreadId } = useThreadConfig();
  const { session } = useAuth();
  const resourceId = session!.user.id;
  const setDraftThread = useDraftThreadStore((state) => state.setDraftThread);
  const markPendingTitle = useDraftThreadStore(
    (state) => state.markPendingTitle,
  );
  const queryClient = useQueryClient();

  const isDraftInProgress =
    !hasExplicitThreadId && agent.threadId === threadId && hasMessages;

  useEffect(() => {
    if (!isDraftInProgress) return;

    const now = new Date().toISOString();
    setDraftThread({
      id: threadId,
      title: threadId,
      resourceId,
      createdAt: now,
      updatedAt: now,
    });
  }, [isDraftInProgress, threadId, resourceId, setDraftThread]);

  // A run ending is the earliest moment the server row can exist and the only
  // moment a title can appear: Mastra runs `generateTitle` once per thread,
  // after it has persisted the response messages. So this opens a polling
  // window instead of refetching once — the title is written in a promise
  // Mastra does not await, so it usually lands a moment *after* RUN_FINISHED,
  // and a single refetch here comes back with no title at all.
  //
  // The gate is the row's title: nothing is polled for a thread that already
  // carries a real one (anything other than the `title: threadId` placeholder
  // written above). use-thread-session closes the window as soon as the title
  // arrives, and gives up on its own when no row shows up at all — which is
  // what a guardrail-blocked turn looks like, since `tripwire` aborts the run
  // before anything is persisted yet still ends in RUN_FINISHED.
  //
  // No `isReady` guard: while the runtime is still connecting `useAgent`
  // returns a provisional agent that never runs, and the real one arrives as a
  // new `agent` reference, which re-runs this effect.
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onRunFinishedEvent: () => {
        const finishedThreadId = agent.threadId;
        const threads =
          queryClient.getQueryData<ThreadSummary[]>(THREADS_QUERY_KEY);
        const row = threads?.find((thread) => thread.id === finishedThreadId);

        if (row?.title && row.title !== finishedThreadId) return;

        markPendingTitle({ id: finishedThreadId, startedAt: Date.now() });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [agent, queryClient, markPendingTitle]);
};
