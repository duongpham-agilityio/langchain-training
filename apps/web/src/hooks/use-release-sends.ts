import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelScheduledSend,
  listReleaseSends,
} from '@/services/release-sends.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { ToastKind } from '@/store/toast-store.ts';

const releaseSendsKey = (releaseId: string) => ['release-sends', releaseId];

// The sends and scheduled jobs of one release, plus cancel for a pending job.
export const useReleaseSends = (releaseId: string) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: releaseSendsKey(releaseId),
    queryFn: () => listReleaseSends(releaseId),
    enabled: releaseId !== '',
  });

  const cancel = useMutation({
    mutationFn: cancelScheduledSend,
    onSuccess: () =>
      showToast({ kind: ToastKind.Success, title: 'Scheduled send cancelled' }),
    onError: (error) =>
      showToast({
        kind: ToastKind.Error,
        title: 'Couldn’t cancel the send',
        description: error.message,
      }),
    // Refetch either way: a refused cancel means the job already moved on.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: releaseSendsKey(releaseId) }),
  });

  return {
    sends: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    cancelJob: (jobId: string) => cancel.mutate(jobId),
    cancellingId: cancel.isPending ? cancel.variables : undefined,
  };
};
