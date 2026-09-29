import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient, type Query } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isAuthError } from './errors';
import { kv } from './storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => failureCount < 2 && !isAuthError(error),
      refetchOnWindowFocus: Platform.OS === 'web',
    },
    mutations: { retry: 0 },
  },
});

// Refetch stale data when the mobile app comes back to the foreground.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => sub.remove();
  });
}

/** Query roots persisted to disk so the app opens instantly with the last known data. */
const PERSISTED_ROOTS = new Set([
  'me',
  'conversations',
  'notifications',
  'home-stats',
  'profile-stats',
  'messages',
]);

export function shouldPersistQuery(query: Query): boolean {
  const root = query.queryKey[0];
  return query.state.status === 'success' && typeof root === 'string' && PERSISTED_ROOTS.has(root);
}

export const queryPersister = createAsyncStoragePersister({
  key: 'px-query-cache',
  throttleTime: 2000,
  storage: {
    getItem: async (key) => kv.getItem(key),
    setItem: async (key, value) => kv.setItem(key, value),
    removeItem: async (key) => kv.removeItem(key),
  },
});

/** Bump when a cached shape changes, so old caches are discarded. */
export const QUERY_CACHE_BUSTER = 'v2.0.0';
