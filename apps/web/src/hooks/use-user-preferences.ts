import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateUserPreferencesRequest,
  UserPreferencesRecord,
} from '@training/contracts';
import {
  getUserPreferences,
  saveUserPreferences,
} from '@/services/user-preferences.ts';

export const USER_PREFERENCES_QUERY_KEY = ['user-preferences'];

interface UseUserPreferencesResult {
  preferences: UserPreferencesRecord | undefined;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  save: (request: UpdateUserPreferencesRequest) => Promise<void>;
  refetch: () => void;
}

// The record is the same one the agent reads, so a save here applies to the next generation.
export const useUserPreferences = (): UseUserPreferencesResult => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: USER_PREFERENCES_QUERY_KEY,
    queryFn: getUserPreferences,
  });
  const mutation = useMutation({
    mutationFn: saveUserPreferences,
    onSuccess: (record) =>
      queryClient.setQueryData(USER_PREFERENCES_QUERY_KEY, record),
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: mutation.isPending,
    save: async (request) => {
      await mutation.mutateAsync(request);
    },
    refetch: () => void query.refetch(),
  };
};
