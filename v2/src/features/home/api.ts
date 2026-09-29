import { useQuery } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { HomeStats, Mode } from '@/types/app';

export function useHomeStats(mode: Mode) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['home-stats', mode],
    enabled: Boolean(user),
    queryFn: async () =>
      unwrap(await supabase.rpc('get_home_stats', { p_mode: mode })) as unknown as HomeStats,
  });
}
