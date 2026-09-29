import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { queryClient, queryPersister } from '@/lib/query-client';
import { unregisterPush } from '@/lib/push';
import { captureError } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** False until the stored session has been read (avoid redirect flashes). */
  initialized: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => mounted && setInitialized(true));

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (next?.access_token) supabase.realtime.setAuth(next.access_token);
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        void queryPersister.removeClient();
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterPush();
    } catch (error) {
      captureError(error);
    }
    await supabase.auth.signOut({ scope: 'local' });
    queryClient.clear();
    await queryPersister.removeClient();
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, initialized, signOut }),
    [session, initialized, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
