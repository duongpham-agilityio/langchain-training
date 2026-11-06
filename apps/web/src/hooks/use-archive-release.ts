import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useReleaseWorkspaceStore } from '@/store/release-workspace-store.ts';
import { ToastKind } from '@/store/toast-store.ts';
import { useThreadSession } from '@/hooks/use-thread-session.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { ROUTE_HISTORY } from '@/constants/routings.ts';
import { RELEASE_HISTORY_QUERY_KEY } from '@/hooks/use-release-history.ts';
import { buildSaveReleaseHistoryRequest } from '@/lib/release-notes/build-save-release-history-request.ts';
import { describeReleaseDraft } from '@/lib/release-notes/release-title.ts';
import { saveReleaseHistory } from '@/services/save-release-history.ts';
import type { ReleaseNotesDraft } from '@/types/release-notes-draft.ts';

interface UseArchiveReleaseResult {
  archive: (draft: ReleaseNotesDraft) => void;
  isArchiving: boolean;
}

export const useArchiveRelease = (): UseArchiveReleaseResult => {
  const { threadId } = useThreadSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const markDraftArchived = useReleaseWorkspaceStore((state) => state.markDraftArchived);

  const mutation = useMutation({
    // saveReleaseHistory resolves with { ok: false } instead of rejecting, so
    // rethrow to route failures into onError.
    mutationFn: async (draft: ReleaseNotesDraft): Promise<void> => {
      const request = buildSaveReleaseHistoryRequest(draft);
      if (!request) {
        throw new Error('Ask Release Builder for a version and title before archiving.');
      }

      const result = await saveReleaseHistory(request);
      if (!result.ok) {
        throw new Error(result.error ?? 'Archiving failed.');
      }
    },
    onSuccess: async (_, draft): Promise<void> => {
      markDraftArchived(threadId, draft);
      showToast({
        kind: ToastKind.Success,
        title: 'Archived to Release history',
        description: describeReleaseDraft(draft),
        actionLabel: 'View',
        onAction: () => navigate(ROUTE_HISTORY),
      });
      await queryClient.invalidateQueries({ queryKey: RELEASE_HISTORY_QUERY_KEY });
    },
    onError: (error) => {
      showToast({
        kind: ToastKind.Error,
        title: 'Couldn’t archive release notes',
        description: error.message,
      });
    },
  });

  return {
    archive: (draft) => mutation.mutate(draft),
    isArchiving: mutation.isPending,
  };
};
