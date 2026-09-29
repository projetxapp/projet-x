import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { uploadAttachment, type Attachment } from '@/lib/images';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Conversation, MessageRow, MissionRow } from '@/types/app';

export const PAGE_SIZE = 30;
export const conversationsKey = ['conversations'] as const;
export const messagesKey = (matchId: string) => ['messages', matchId] as const;

/** Local message: server row + delivery state for optimistic sends. */
export type ChatMessage = MessageRow & { pending?: boolean; failed?: boolean; localUri?: string };

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: conversationsKey,
    enabled: Boolean(user),
    queryFn: async () =>
      (unwrap(await supabase.rpc('get_conversations_summary', {})) ??
        []) as unknown as Conversation[],
  });
}

export function useMessages(matchId: string) {
  return useInfiniteQuery({
    queryKey: messagesKey(matchId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<ChatMessage[]> => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) query = query.lt('created_at', pageParam);
      return unwrap(await query) ?? [];
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? (lastPage[lastPage.length - 1]?.created_at ?? null) : null,
  });
}

type MessagesData = InfiniteData<ChatMessage[], string | null>;

/** Inserts or replaces a message (by id) at the top of the cached conversation. */
export function upsertMessageInCache(
  data: MessagesData | undefined,
  message: ChatMessage,
): MessagesData | undefined {
  if (!data) return data;
  const exists = data.pages.some((page) => page.some((m) => m.id === message.id));
  if (exists) {
    return {
      ...data,
      pages: data.pages.map((page) =>
        page.map((m) =>
          m.id === message.id ? { ...m, ...message, pending: false, failed: false } : m,
        ),
      ),
    };
  }
  const [first = [], ...rest] = data.pages;
  return { ...data, pages: [[message, ...first], ...rest] };
}

export function patchConversation(
  list: Conversation[] | undefined,
  message: MessageRow,
  myId: string,
  viewing: boolean,
) {
  if (!list) return list;
  const index = list.findIndex((c) => c.match_id === message.match_id);
  if (index === -1) return list;
  const conv = list[index]!;
  const updated: Conversation = {
    ...conv,
    last_message_id: message.id,
    last_message_content: message.content,
    last_message_type: message.type as Conversation['last_message_type'],
    last_message_sender_id: message.sender_id,
    last_message_created_at: message.created_at,
    last_message_seen: message.seen,
    unread_count:
      message.sender_id !== myId && !viewing ? conv.unread_count + 1 : conv.unread_count,
  };
  return [updated, ...list.slice(0, index), ...list.slice(index + 1)];
}

export function useSendMessage(matchId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      content: string;
      attachment?: Attachment & { kind: 'image' | 'file' };
    }) => {
      let attachmentPath: string | null = null;
      if (input.attachment)
        attachmentPath = await uploadAttachment(user!.id, matchId, input.attachment);
      const row = unwrap(
        await supabase
          .from('messages')
          .insert({
            id: input.id,
            match_id: matchId,
            sender_id: user!.id,
            content: input.content,
            type: input.attachment?.kind ?? 'text',
            attachment_url: attachmentPath,
            attachment_name: input.attachment?.name ?? null,
            attachment_size: input.attachment?.size ?? null,
            attachment_mime: input.attachment?.mimeType ?? null,
          })
          .select('*')
          .single(),
      );
      return row as ChatMessage;
    },
    onMutate: async (input) => {
      const now = new Date().toISOString();
      const optimistic: ChatMessage = {
        id: input.id,
        match_id: matchId,
        sender_id: user!.id,
        content: input.content,
        type: input.attachment?.kind ?? 'text',
        attachment_url: null,
        attachment_name: input.attachment?.name ?? null,
        attachment_size: input.attachment?.size ?? null,
        attachment_mime: input.attachment?.mimeType ?? null,
        metadata: {},
        seen: false,
        seen_at: null,
        created_at: now,
        pending: true,
        localUri: input.attachment?.uri,
      };
      queryClient.setQueryData<MessagesData>(messagesKey(matchId), (data) =>
        upsertMessageInCache(data, optimistic),
      );
      queryClient.setQueryData<Conversation[]>(conversationsKey, (list) =>
        patchConversation(list, optimistic, user!.id, true),
      );
    },
    onSuccess: (row) => {
      queryClient.setQueryData<MessagesData>(messagesKey(matchId), (data) =>
        upsertMessageInCache(data, row),
      );
    },
    onError: (_error, input) => {
      queryClient.setQueryData<MessagesData>(messagesKey(matchId), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) =>
                page.map((m) => (m.id === input.id ? { ...m, pending: false, failed: true } : m)),
              ),
            }
          : data,
      );
    },
  });
}

export function newMessageId(): string {
  return Crypto.randomUUID();
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      unwrap(await supabase.rpc('mark_conversation_read', { p_match_id: matchId }));
    },
    onMutate: (matchId) => {
      queryClient.setQueryData<Conversation[]>(conversationsKey, (list) =>
        list?.map((c) => (c.match_id === matchId ? { ...c, unread_count: 0 } : c)),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** Signed URLs for private attachments (valid 1 h, cached 50 min). */
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', path],
    enabled: Boolean(path),
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function useMissions(matchId: string) {
  return useQuery({
    queryKey: ['missions', matchId],
    queryFn: async () =>
      (unwrap(
        await supabase
          .from('missions')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: false }),
      ) ?? []) as MissionRow[],
  });
}

export function useProposeMission(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      mode: 'flash' | 'side' | 'equity';
      budget: number | null;
      equity: number | null;
    }) =>
      unwrap(
        await supabase.rpc('propose_mission', {
          p_match_id: matchId,
          p_title: input.title,
          p_description: input.description,
          p_mode: input.mode,
          ...(input.budget !== null ? { p_budget: input.budget } : {}),
          ...(input.equity !== null ? { p_equity_percent: input.equity } : {}),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions', matchId] }),
  });
}

export function useRespondMission(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      missionId: string;
      status: 'accepted' | 'declined' | 'cancelled' | 'done';
    }) =>
      unwrap(
        await supabase.rpc('respond_mission', {
          p_mission_id: input.missionId,
          p_status: input.status,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions', matchId] }),
  });
}
