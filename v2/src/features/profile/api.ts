import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { compressImage, pickImage, uploadPublicImage } from '@/lib/images';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Database } from '@/types/database';
import type { Mode, ProfileStats, PublicProfile } from '@/types/app';

type Tables = Database['public']['Tables'];
export type ProfileUpdate = Pick<
  Tables['profiles']['Update'],
  'first_name' | 'last_name' | 'age' | 'city' | 'school' | 'avatar_url'
>;
export type TalentUpdate = Omit<
  Tables['talent_profiles']['Insert'],
  'user_id' | 'id' | 'updated_at'
>;
export type ProjectUpdate = Omit<
  Tables['project_profiles']['Insert'],
  'user_id' | 'id' | 'updated_at'
>;
export type InvestorUpdate = Omit<
  Tables['investor_profiles']['Insert'],
  'user_id' | 'id' | 'updated_at'
>;

function useInvalidateMe() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['me'] });
    void queryClient.invalidateQueries({ queryKey: ['public-profile'] });
  };
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const invalidate = useInvalidateMe();
  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      unwrap(await supabase.from('profiles').update(patch).eq('id', user!.id));
    },
    onSuccess: invalidate,
  });
}

export function useSaveModeProfile() {
  const { user } = useAuth();
  const invalidate = useInvalidateMe();
  return useMutation({
    mutationFn: async (
      input:
        | { mode: 'talent'; data: TalentUpdate }
        | { mode: 'project'; data: ProjectUpdate }
        | { mode: 'investor'; data: InvestorUpdate },
    ) => {
      const userId = user!.id;
      if (input.mode === 'talent') {
        unwrap(
          await supabase
            .from('talent_profiles')
            .upsert({ ...input.data, user_id: userId }, { onConflict: 'user_id' }),
        );
      } else if (input.mode === 'project') {
        unwrap(
          await supabase
            .from('project_profiles')
            .upsert({ ...input.data, user_id: userId }, { onConflict: 'user_id' }),
        );
      } else {
        unwrap(
          await supabase
            .from('investor_profiles')
            .upsert({ ...input.data, user_id: userId }, { onConflict: 'user_id' }),
        );
      }
    },
    onSuccess: invalidate,
  });
}

/** Picks, compresses (WebP ≤ 1080 px) and uploads a photo; returns its public URL. */
export function useUploadPhoto() {
  const { user } = useAuth();
  const invalidate = useInvalidateMe();
  return useMutation({
    mutationFn: async (kind: 'avatar' | 'cover'): Promise<string | null> => {
      const picked = await pickImage({ aspect: kind === 'avatar' ? [1, 1] : [16, 9] });
      if (!picked) return null;
      const compressed = await compressImage(picked, kind === 'avatar' ? 720 : 1080);
      const url = await uploadPublicImage(
        kind === 'avatar' ? 'avatars' : 'project-covers',
        user!.id,
        compressed,
        kind,
      );
      if (kind === 'avatar') {
        unwrap(await supabase.from('profiles').update({ avatar_url: url }).eq('id', user!.id));
      } else {
        unwrap(
          await supabase
            .from('project_profiles')
            .update({ cover_url: url })
            .eq('user_id', user!.id),
        );
      }
      return url;
    },
    onSuccess: invalidate,
  });
}

export function useProfileStats(mode: Mode) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile-stats', mode],
    enabled: Boolean(user),
    queryFn: async () =>
      unwrap(await supabase.rpc('get_profile_stats', { p_mode: mode })) as unknown as ProfileStats,
  });
}

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase.rpc('get_public_profile', { p_user_id: userId! }),
      ) as unknown as PublicProfile | null,
  });
}
