import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import type { ModerationItem } from '@/types/app';

export function useModerationQueue(status: 'open' | 'actioned' | 'dismissed') {
  return useQuery({
    queryKey: ['moderation', status],
    queryFn: async () =>
      (unwrap(await supabase.rpc('get_moderation_queue', { p_status: status })) ??
        []) as unknown as ModerationItem[],
  });
}

export function useModerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      reportId: string;
      status: 'actioned' | 'dismissed';
      suspend: boolean;
    }) => {
      unwrap(
        await supabase.rpc('moderate_report', {
          p_report_id: input.reportId,
          p_status: input.status,
          p_suspend: input.suspend,
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });
}
