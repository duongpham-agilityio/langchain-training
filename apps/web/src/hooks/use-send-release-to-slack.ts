import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastKind } from '@/store/toast-store.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { describeReleaseHistoryItem } from '@/lib/release-notes/release-title.ts';
import { RELEASE_HISTORY_QUERY_KEY } from '@/hooks/use-release-history.ts';
import { publishToSlack } from '@/services/publish-to-slack.ts';
import type { ReleaseHistoryItem } from '@/types/release.ts';

interface UseSendReleaseToSlackResult {
  sendToSlack: (item: ReleaseHistoryItem) => void;
  isSending: boolean;
}

// Sends one archived release to Slack. The server renders the Slack text from the
// stored release and records the send (status `published`), so History is refetched
// afterwards to flip the "Sent to Slack" badge.
export const useSendReleaseToSlack = (): UseSendReleaseToSlackResult => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // publishToSlack resolves with { ok: false } instead of rejecting, so
    // rethrow to route failures into onError.
    mutationFn: async ({ id }: ReleaseHistoryItem): Promise<void> => {
      const result = await publishToSlack({ releaseId: id });

      if (!result.ok) {
        throw new Error(result.error ?? 'Publishing failed.');
      }
    },
    onSuccess: (_, item) => {
      void queryClient.invalidateQueries({
        queryKey: RELEASE_HISTORY_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: ['release-sends'] });
      showToast({
        kind: ToastKind.Success,
        title: 'Sent to Slack',
        description: describeReleaseHistoryItem(item),
      });
    },
    onError: (error) => {
      showToast({
        kind: ToastKind.Error,
        title: 'Couldn’t send to Slack',
        description: error.message,
      });
    },
  });

  return {
    sendToSlack: (item) => mutation.mutate(item),
    isSending: mutation.isPending,
  };
};
