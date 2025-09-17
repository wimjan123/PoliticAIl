/**
 * React Query Configuration
 * Sets up TanStack Query client for server state management
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { SimulationAction, SimulationState } from '../types/simulation';

/**
 * Custom error handler for queries
 */
const handleQueryError = (error: unknown) => {
  console.error('Query error:', error);

  // Here you could add toast notifications, logging, etc.
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Network')) {
      console.warn('Network error detected, retrying...');
    } else if (error.message.includes('401')) {
      console.warn('Authentication error, redirecting to login...');
      // Handle auth errors
    }
  }
};

/**
 * Custom error handler for mutations
 */
const handleMutationError = (error: unknown, variables: unknown, context: unknown) => {
  console.error('Mutation error:', error, { variables, context });

  // Rollback optimistic updates on error
  if (context && typeof context === 'object' && 'previousState' in context) {
    console.log('Rolling back optimistic update');
  }
};

/**
 * Custom success handler for mutations
 */
const handleMutationSuccess = (data: unknown, variables: unknown, context: unknown) => {
  console.log('Mutation success:', { data, variables, context });

  // You could add success notifications here
};

/**
 * Query client configuration
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
    onSuccess: handleMutationSuccess,
  }),
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: How long inactive data stays in cache
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error instanceof Error && error.message.includes('4')) {
          const status = parseInt(error.message.match(/\d{3}/)?.[0] || '0');
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }

        // Retry up to 3 times with exponential backoff
        return failureCount < 3;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (disabled for game)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Background refetch interval (disabled by default)
      refetchInterval: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Optimistic update utilities
 */
export const optimisticUpdateHelpers = {
  /**
   * Create optimistic update context
   */
  createOptimisticContext: <T>(queryKey: string[], updater: (old: T | undefined) => T | undefined) => {
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Apply optimistic update
    queryClient.setQueryData<T>(queryKey, updater);

    return { previousData, queryKey };
  },

  /**
   * Rollback optimistic update
   */
  rollbackOptimisticUpdate: <T>(context: { previousData: T; queryKey: string[] }) => {
    queryClient.setQueryData(context.queryKey, context.previousData);
  },

  /**
   * Update simulation state optimistically
   */
  updateSimulationOptimistically: (
    action: SimulationAction,
    updater: (state: SimulationState) => SimulationState
  ) => {
    const queryKey = ['simulation', 'state'];
    const previousData = queryClient.getQueryData<SimulationState>(queryKey);

    if (previousData) {
      const newState = updater(previousData);
      queryClient.setQueryData(queryKey, newState);
    }

    return { previousData, queryKey, action };
  },
};

/**
 * Cache invalidation utilities
 */
export const cacheHelpers = {
  /**
   * Invalidate all simulation-related queries
   */
  invalidateSimulation: () => {
    queryClient.invalidateQueries(['simulation']);
  },

  /**
   * Invalidate specific simulation data
   */
  invalidateSimulationData: (dataType: string) => {
    queryClient.invalidateQueries(['simulation', dataType]);
  },

  /**
   * Remove all simulation data from cache
   */
  clearSimulationCache: () => {
    queryClient.removeQueries(['simulation']);
  },

  /**
   * Prefetch simulation data
   */
  prefetchSimulationData: async (gameId: string) => {
    const prefetchPromises = [
      queryClient.prefetchQuery(['simulation', 'state', gameId], () =>
        fetch(`/api/simulation/${gameId}`).then(res => res.json())
      ),
      queryClient.prefetchQuery(['simulation', 'events', gameId], () =>
        fetch(`/api/simulation/${gameId}/events`).then(res => res.json())
      ),
    ];

    await Promise.allSettled(prefetchPromises);
  },
};

/**
 * Development tools configuration
 */
export const queryDevtools = {
  initialIsOpen: false,
  position: 'bottom-right' as const,
};

/**
 * Export the configured query client
 */
export default queryClient;