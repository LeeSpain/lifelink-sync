import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default - prevent excessive refetching
      gcTime: 10 * 60 * 1000, // 10 minutes in cache - allow reuse
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Prevent excessive refetching on focus
      refetchOnMount: 'always', // Only refetch if data is stale
      refetchOnReconnect: 'always', // Only refetch if data is stale
      // Deduplicate requests - prevent multiple identical requests
      queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});