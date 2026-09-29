import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { ContactRequest, LikeReceived, Mode, ReportReason } from '@/types/app';

type ContactResult = {
  status: 'pending' | 'matched' | 'accepted' | 'declined';
  match_id?: string;
  request_id?: string;
};

export function useRequestContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; mode: Mode; message: string }) =>
      unwrap(
        await supabase.rpc('request_contact', {
          p_to_user: input.userId,
          p_mode: input.mode,
          p_message: input.message,
        }),
      ) as unknown as ContactResult,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: ['public-profile', input.userId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useContactRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-requests'],
    enabled: Boolean(user),
    queryFn: async () =>
      (unwrap(await supabase.rpc('get_contact_requests')) ?? []) as unknown as ContactRequest[],
  });
}

export function useRespondContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { requestId: string; accept: boolean }) =>
      unwrap(
        await supabase.rpc('respond_contact_request', {
          p_request_id: input.requestId,
          p_accept: input.accept,
        }),
      ) as unknown as ContactResult,
    onSuccess: () => {
      for (const key of [
        'contact-requests',
        'conversations',
        'notifications',
        'me',
        'home-stats',
        'public-profile',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useCancelContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      unwrap(await supabase.rpc('cancel_contact_request', { p_request_id: requestId }));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['public-profile'] });
    },
  });
}

export function useLikesReceived() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['likes-received'],
    enabled: Boolean(user),
    queryFn: async () =>
      (unwrap(await supabase.rpc('get_likes_received', {})) ?? []) as unknown as LikeReceived[],
  });
}

function useInvalidateSocial() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      'conversations',
      'likes-received',
      'contact-requests',
      'public-profile',
      'blocked',
      'search',
      'deck',
    ]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useBlockUser() {
  const invalidate = useInvalidateSocial();
  return useMutation({
    mutationFn: async (userId: string) => {
      unwrap(await supabase.rpc('block_user', { p_user: userId }));
    },
    onSuccess: invalidate,
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateSocial();
  return useMutation({
    mutationFn: async (userId: string) => {
      unwrap(await supabase.rpc('unblock_user', { p_user: userId }));
    },
    onSuccess: invalidate,
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked'],
    queryFn: async () =>
      (unwrap(await supabase.rpc('get_blocked_users')) ?? []) as unknown as {
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        blocked_at: string;
      }[],
  });
}

export function useReportUser() {
  const invalidate = useInvalidateSocial();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      reason: ReportReason;
      details: string;
      matchId?: string;
      messageId?: string;
      block: boolean;
    }) =>
      unwrap(
        await supabase.rpc('report_user', {
          p_user: input.userId,
          p_reason: input.reason,
          p_details: input.details,
          ...(input.matchId ? { p_match_id: input.matchId } : {}),
          ...(input.messageId ? { p_message_id: input.messageId } : {}),
          p_block: input.block,
        }),
      ),
    onSuccess: invalidate,
  });
}

export const REPORT_REASONS: readonly { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam ou publicité' },
  { id: 'harassment', label: 'Harcèlement ou propos déplacés' },
  { id: 'fake', label: 'Faux profil' },
  { id: 'scam', label: 'Arnaque' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
  { id: 'other', label: 'Autre raison' },
];
