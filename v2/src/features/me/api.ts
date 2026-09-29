import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { isMode } from '@/constants/modes';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Me, Mode } from '@/types/app';

export const meKey = (userId: string | undefined) => ['me', userId] as const;

async function fetchMe(): Promise<Me> {
  return unwrap(await supabase.rpc('get_me')) as unknown as Me;
}

/** The signed-in user's profile, modes, sub-profiles, settings and badge counts (1 RPC). */
export function useMe() {
  const { user } = useAuth();
  return useQuery({
    queryKey: meKey(user?.id),
    queryFn: fetchMe,
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

/** Updates the cached `me` in place (optimistic UI). */
export function useSetMe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useCallback(
    (updater: (me: Me) => Me) => {
      queryClient.setQueryData<Me>(meKey(user?.id), (me) => (me ? updater(me) : me));
    },
    [queryClient, user?.id],
  );
}

export function useActiveMode() {
  const { data: me } = useMe();
  const setMe = useSetMe();
  const mode: Mode = me && isMode(me.profile.active_mode) ? me.profile.active_mode : 'talent';
  const modes = me?.modes ?? [];

  const persist = useMutation({
    mutationFn: async (next: Mode) => {
      unwrap(
        await supabase.from('profiles').update({ active_mode: next }).eq('id', me!.profile.id),
      );
    },
  });

  const setMode = useCallback(
    (next: Mode) => {
      if (!me || next === mode) return;
      setMe((prev) => ({ ...prev, profile: { ...prev.profile, active_mode: next } }));
      persist.mutate(next);
    },
    [me, mode, persist, setMe],
  );

  return { mode, modes, hasMode: modes.includes(mode), setMode };
}

export function useActivateMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: Mode) => {
      unwrap(await supabase.rpc('activate_mode', { p_mode: mode }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey(user?.id) }),
  });
}
