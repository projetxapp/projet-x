import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Mode, SearchFilters, SearchResult } from '@/types/app';

const PAGE = 20;

/** Full-text search with infinite scroll (one call per page of 20). */
export function useSearch(query: string, mode: Mode | null, filters: SearchFilters) {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: ['search', query, mode, filters],
    enabled: Boolean(user),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (unwrap(
        await supabase.rpc('search_profiles', {
          p_query: query,
          ...(mode ? { p_mode: mode } : {}),
          p_filters: filters,
          p_limit: PAGE,
          p_offset: pageParam,
        }),
      ) ?? []) as unknown as SearchResult[],
    getNextPageParam: (last, pages) => (last.length === PAGE ? pages.length * PAGE : undefined),
    staleTime: 60_000,
  });
}
