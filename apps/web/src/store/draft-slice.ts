import type { StateCreator } from 'zustand';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

// An older draft the user reopened from its card in the chat. `toolCallId`
// identifies which card is "Viewing" — two calls can carry identical drafts.
export interface SelectedDraft {
  toolCallId: string;
  draft: ReleaseNotesDraft;
}

export interface DraftThreadState {
  // The thread's newest draft, synced from the latest render-tool call.
  draft: ReleaseNotesDraft | null;
  // Overrides `draft` in the Live Preview until the next new draft arrives.
  selected: SelectedDraft | null;
  // toDraftKey() of every draft archived from this thread in this session.
  archivedDraftKeys: string[];
}

export const EMPTY_DRAFT_THREAD_STATE: DraftThreadState = {
  draft: null,
  selected: null,
  archivedDraftKeys: [],
};

export const toDraftKey = (draft: ReleaseNotesDraft): string => JSON.stringify(draft);

export interface DraftSlice {
  draftByThread: Record<string, DraftThreadState>;
  setDraft: (threadId: string, draft: ReleaseNotesDraft) => void;
  selectDraft: (threadId: string, selected: SelectedDraft | null) => void;
  markDraftArchived: (threadId: string, draft: ReleaseNotesDraft) => void;
}

export const createDraftSlice: StateCreator<
  DraftSlice,
  [],
  [],
  DraftSlice
> = (set) => ({
  draftByThread: {},
  // A genuinely new draft clears `selected`, so the preview jumps to it.
  setDraft: (threadId, draft) =>
    set((state) => {
      const current = state.draftByThread[threadId];
      if (current?.draft && toDraftKey(current.draft) === toDraftKey(draft)) {
        return state;
      }
      return {
        draftByThread: {
          ...state.draftByThread,
          [threadId]: {
            ...(current ?? EMPTY_DRAFT_THREAD_STATE),
            draft,
            selected: null,
          },
        },
      };
    }),
  selectDraft: (threadId, selected) =>
    set((state) => {
      const current = state.draftByThread[threadId] ?? EMPTY_DRAFT_THREAD_STATE;
      if (current.selected?.toolCallId === selected?.toolCallId) {
        return state;
      }
      return {
        draftByThread: {
          ...state.draftByThread,
          [threadId]: { ...current, selected },
        },
      };
    }),
  markDraftArchived: (threadId, draft) =>
    set((state) => {
      const current = state.draftByThread[threadId] ?? EMPTY_DRAFT_THREAD_STATE;
      const key = toDraftKey(draft);
      if (current.archivedDraftKeys.includes(key)) {
        return state;
      }
      return {
        draftByThread: {
          ...state.draftByThread,
          [threadId]: {
            ...current,
            archivedDraftKeys: [...current.archivedDraftKeys, key],
          },
        },
      };
    }),
});
