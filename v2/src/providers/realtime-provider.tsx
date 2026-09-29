import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';

import { useToast } from '@/components/ui';
import {
  conversationsKey,
  messagesKey,
  patchConversation,
  upsertMessageInCache,
  type ChatMessage,
} from '@/features/chat/api';
import { notificationHref, notificationsKey } from '@/features/notifications/api';
import { activeConversation } from '@/lib/active-conversation';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import type { AppNotification, Conversation } from '@/types/app';

import { useAuth } from './auth-provider';

/**
 * ONE private channel per user ("user:{id}"), fed by the database: new messages,
 * read receipts and notifications. Caches are updated in place (no refetch storm).
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const onMessage = (message: ChatMessage) => {
      const viewing = activeConversation.get() === message.match_id;
      queryClient.setQueryData<InfiniteData<ChatMessage[], string | null>>(
        messagesKey(message.match_id),
        (data) => upsertMessageInCache(data, message),
      );
      const list = queryClient.getQueryData<Conversation[]>(conversationsKey);
      if (!list?.some((c) => c.match_id === message.match_id)) {
        void queryClient.invalidateQueries({ queryKey: conversationsKey });
      } else {
        queryClient.setQueryData<Conversation[]>(conversationsKey, (current) =>
          patchConversation(current, message, userId, viewing),
        );
      }
      if (message.sender_id !== userId && !viewing)
        void queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    const onRead = (payload: { match_id: string; seen_at: string }) => {
      queryClient.setQueryData<InfiniteData<ChatMessage[], string | null>>(
        messagesKey(payload.match_id),
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) =>
                  page.map((m) =>
                    m.sender_id === userId && !m.seen
                      ? { ...m, seen: true, seen_at: payload.seen_at }
                      : m,
                  ),
                ),
              }
            : data,
      );
      queryClient.setQueryData<Conversation[]>(conversationsKey, (list) =>
        list?.map((c) =>
          c.match_id === payload.match_id && c.last_message_sender_id === userId
            ? { ...c, last_message_seen: true }
            : c,
        ),
      );
    };

    const onNotification = (notification: AppNotification) => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      if (notification.read) return;

      switch (notification.type) {
        case 'match':
          void queryClient.invalidateQueries({ queryKey: conversationsKey });
          void queryClient.invalidateQueries({ queryKey: ['home-stats'] });
          haptics.success();
          break;
        case 'like':
          void queryClient.invalidateQueries({ queryKey: ['likes-received'] });
          void queryClient.invalidateQueries({ queryKey: ['home-stats'] });
          break;
        case 'contact':
          void queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
          void queryClient.invalidateQueries({ queryKey: conversationsKey });
          break;
        case 'mission':
          if (notification.data.match_id)
            void queryClient.invalidateQueries({
              queryKey: ['missions', notification.data.match_id],
            });
          break;
        default:
          break;
      }
      if (notification.data.match_id && notification.data.match_id === activeConversation.get())
        return;
      toast.show({
        title: notification.title,
        body: notification.body,
        tone: notification.type === 'match' ? 'brand' : 'default',
        onPress: () => router.push(notificationHref(notification) as never),
      });
    };

    const channel = supabase
      .channel(`user:${userId}`, { config: { private: true } })
      .on('broadcast', { event: 'message' }, ({ payload }) =>
        onMessage((payload as { message: ChatMessage }).message),
      )
      .on('broadcast', { event: 'conversation_read' }, ({ payload }) =>
        onRead(payload as { match_id: string; seen_at: string }),
      )
      .on('broadcast', { event: 'notification' }, ({ payload }) =>
        onNotification((payload as { notification: AppNotification }).notification),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient, toast, router]);

  return <>{children}</>;
}
