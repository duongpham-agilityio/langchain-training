import { useReleaseWorkspaceStore } from '@/store/release-workspace-store.ts';
import { EMPTY_DRAFT_THREAD_STATE, toDraftKey } from '@/store/draft-slice.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { composeReleaseContent } from '@/lib/release-notes/release-title.ts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

export interface ReleaseDraftView {
  // The draft the Live Preview shows: the one the user reopened from an older
  // card, otherwise the thread's newest.
  draft: ReleaseNotesDraft | null;
  content: string | null;
  // Tool call of the reopened draft; null while showing the newest one.
  selectedToolCallId: string | null;
  isArchived: boolean;
}

// Read-only projection of the draft slice — safe to call from any number of
// components or hooks. Tool registration lives only in useReleaseDraft()
// (use-release-draft.tsx), which must stay a single call site; calling
// useRenderTool from more than one mounted place would register the tool twice.
export const useReleaseDraftView = (): ReleaseDraftView => {
  const { threadId } = useThreadSession();
  const threadState = useReleaseWorkspaceStore(
    (state) => state.draftByThread[threadId] ?? EMPTY_DRAFT_THREAD_STATE,
  );

  const { selected, archivedDraftKeys } = threadState;
  const draft = selected?.draft ?? threadState.draft;

  return {
    draft,
    content: draft ? composeReleaseContent(draft) : null,
    selectedToolCallId: selected?.toolCallId ?? null,
    isArchived: draft ? archivedDraftKeys.includes(toDraftKey(draft)) : false,
  };
};
