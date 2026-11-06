import type { ReactNode } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const MAX_QUERY_RETRIES = 2;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      console.error(`[query] ${String(query.queryKey)} failed`, error),
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !error.message.includes('is not set') &&
        failureCount < MAX_QUERY_RETRIES,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

const QueryProvider = ({ children }: QueryProviderProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export default QueryProvider;
