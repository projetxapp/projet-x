import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { pendingAvatar } from '@/features/auth/pending';
import { notificationHref } from '@/features/notifications/api';
import { onNotificationTap, registerForPush, setBadgeCount } from '@/lib/push';
import { captureError } from '@/lib/sentry';
import { useAuth } from '@/providers/auth-provider';
import type { AppNotification } from '@/types/app';

import { useMe } from './api';

/** Side effects of being signed in: signup photo, push token, notification taps, badge. */
export function useAppBootstrap() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    pendingAvatar
      .uploadIfAny(userId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['me'] }))
      .catch(captureError);
    // Silent: only registers if the permission was already granted.
    registerForPush(false).catch(captureError);
  }, [userId, queryClient]);

  useEffect(
    () =>
      onNotificationTap((data) => {
        const type =
          typeof data.type === 'string' ? (data.type as AppNotification['type']) : 'system';
        router.push(notificationHref({ type, data: data as AppNotification['data'] }) as Href);
      }),
    [router],
  );

  useEffect(() => {
    void setBadgeCount(me?.unread_notifications ?? 0);
  }, [me?.unread_notifications]);
}
