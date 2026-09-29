import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

import { env } from './env';
import { kv } from './storage';

const isServer = typeof window === 'undefined';

if (!env.supabaseUrl || !env.supabaseKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing.',
  );
}

export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseKey || 'placeholder-key',
  {
    auth: {
      storage: kv,
      storageKey: 'px-auth',
      persistSession: !isServer,
      autoRefreshToken: !isServer,
      // /confirm and the OAuth callback are handled explicitly (right account, every link format).
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  },
);

// On mobile, only refresh the session while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Unwraps a Supabase response: returns data or throws the error (for TanStack Query). */
export function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
