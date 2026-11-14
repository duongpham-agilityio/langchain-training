import { useMutation } from '@tanstack/react-query';
import { ToastKind } from '@/store/toast-store.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { describeReleaseHistoryItem } from '@/lib/release-notes/release-title.ts';
import { publishToSlack } from '@/services/publish-to-slack.ts';
import type { ReleaseHistoryItem } from '@/types/release.ts';

interface UseSendReleaseToSlackResult {
  sendToSlack: (item: ReleaseHistoryItem) => void;
  isSending: boolean;
}

// Sends one archived release in the format on screen to Slack. Nothing is invalidated
// afterwards: the backend stores no per-platform `sentAt`, so the "Sent to
// Slack" badge still derives from the release status and won't flip here.
export const useSendReleaseToSlack = (): UseSendReleaseToSlackResult => {
  const { showToast } = useToast();

  const mutation = useMutation({
    // publishToSlack resolves with { ok: false } instead of rejecting, so
    // rethrow to route failures into onError.
    mutationFn: async ({
      formatId,
      formatLabel,
      text,
    }: ReleaseHistoryItem): Promise<void> => {
      if (!text) throw new Error('This release is too long for this format.');

      const result = await publishToSlack({
        platformId: formatId,
        label: formatLabel,
        content: text,
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Publishing failed.');
      }
    },
    onSuccess: (_, item) => {
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
