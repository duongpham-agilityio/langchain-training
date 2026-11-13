import { TIME_ZONE_HEADER } from '@training/contracts';
import { getBrowserTimeZone } from '@/lib/time-zone.ts';
import { useAuthStore } from '@/store/auth-store.ts';

// Also carries the browser time zone, so every service call tells the server the user's zone.
export const getAuthHeader = (): Record<string, string> => {
  const accessToken = useAuthStore.getState().session?.accessToken;
  const timeZoneHeader = { [TIME_ZONE_HEADER]: getBrowserTimeZone() };

  return accessToken
    ? { Authorization: `Bearer ${accessToken}`, ...timeZoneHeader }
    : timeZoneHeader;
};
