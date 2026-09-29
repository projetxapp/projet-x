import { useMutation, useQueryClient } from '@tanstack/react-query';

import { webUrl } from '@/lib/auth-links';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { UserSettingsRow } from '@/types/app';

export function useUpdateSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<UserSettingsRow, 'push_enabled' | 'push_messages' | 'push_matches' | 'push_likes'>
      >,
    ) => {
      unwrap(await supabase.from('user_settings').update(patch).eq('user_id', user!.id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: webUrl('/confirm') },
      );
      if (error) throw error;
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('export_my_data')),
  });
}

/** GDPR deletion: Edge Function removes storage files, then the account (cascade). */
export function useDeleteAccount() {
  const { signOut } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ deleted?: boolean }>(
        'delete-account',
        { method: 'POST' },
      );
      if (error || !data?.deleted) throw error ?? new Error('deletion_failed');
    },
    onSuccess: () => signOut(),
  });
}
