import { create } from 'zustand';
import type { ThreadSummary } from '@/types/thread.ts';

// The thread whose server row is still expected to gain a generated title, and
// when the client started waiting. Kept here rather than in a ref because the
// hook that opens the window (use-draft-thread-row, from an agent event) and
// the one that polls for the result (use-thread-session, which owns the threads
// query) are mounted in different components. `startedAt` rather than a
// deadline because two different cut-offs are measured from it — see
// `src/constants/threads.ts`.
export interface PendingTitleThread {
  id: string;
  startedAt: number;
}

interface DraftThreadStoreState {
  draftThread: ThreadSummary | null;
  setDraftThread: (thread: ThreadSummary) => void;
  pendingTitleThread: PendingTitleThread | null;
  markPendingTitle: (pending: PendingTitleThread) => void;
  clearPendingTitle: () => void;
}

export const useDraftThreadStore = create<DraftThreadStoreState>()(
  (set): DraftThreadStoreState => ({
    draftThread: null,
    setDraftThread: (thread) =>
      set((state) =>
        state.draftThread?.id === thread.id ? state : { draftThread: thread },
      ),
    pendingTitleThread: null,
    markPendingTitle: (pending) => set({ pendingTitleThread: pending }),
    clearPendingTitle: () =>
      set((state) =>
        state.pendingTitleThread === null
          ? state
          : { pendingTitleThread: null },
      ),
  }),
);
