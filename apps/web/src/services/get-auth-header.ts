import { useAuthStore } from '@/store/auth-store.ts';

export const getAuthHeader = (): Record<string, string> => {
  const accessToken = useAuthStore.getState().session?.accessToken;

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};
