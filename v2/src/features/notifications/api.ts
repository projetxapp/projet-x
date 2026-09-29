import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { AppNotification } from '@/types/app';

const PAGE = 30;
export const notificationsKey = ['notifications'] as const;

export function useNotifications() {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: notificationsKey,
    enabled: Boolean(user),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE);
      if (pageParam) query = query.lt('created_at', pageParam);
      return (unwrap(await query) ?? []) as unknown as AppNotification[];
    },
    getNextPageParam: (last) =>
      last.length === PAGE ? (last[last.length - 1]?.created_at ?? null) : null,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[] | null) => {
      unwrap(await supabase.rpc('mark_notifications_read', ids ? { p_ids: ids } : {}));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Where tapping a notification (in-app or push) takes you. */
export function notificationHref(n: Pick<AppNotification, 'type' | 'data'>): string {
  const { match_id: matchId, user_id: userId } = n.data;
  switch (n.type) {
    case 'match':
    case 'message':
    case 'mission':
      return matchId ? `/chat/${matchId}` : '/chat';
    case 'like':
      return userId ? `/u/${userId}` : '/likes';
    case 'contact':
      return matchId ? `/chat/${matchId}` : '/demandes';
    default:
      return '/notifications';
  }
}
