import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import {
  queryClient,
  queryPersister,
  QUERY_CACHE_BUSTER,
  shouldPersistQuery,
} from '@/lib/query-client';

import { AuthProvider } from './auth-provider';
import { RealtimeProvider } from './realtime-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              maxAge: 24 * 60 * 60 * 1000,
              buster: QUERY_CACHE_BUSTER,
              dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
            }}>
            <ThemeProvider>
              <AuthProvider>
                <ToastProvider>
                  <RealtimeProvider>{children}</RealtimeProvider>
                </ToastProvider>
              </AuthProvider>
            </ThemeProvider>
          </PersistQueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
