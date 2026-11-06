import { HttpClient } from '@/lib/http/http-client.ts';
import { FETCH_TIMEOUT_MS } from '@/constants/time.ts';
import { getRequiredEnv } from '@/lib/env.ts';
import { getAuthHeader } from '@/services/get-auth-header.ts';

export const releaseCopilotHttpClient = new HttpClient({
  baseUrl: () =>
    getRequiredEnv(import.meta.env.VITE_MASTRA_SERVER_URL, 'VITE_MASTRA_SERVER_URL'),
  getAuthHeader,
  timeoutMs: FETCH_TIMEOUT_MS,
});
