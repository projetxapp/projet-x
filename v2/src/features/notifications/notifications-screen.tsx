import { FlashList } from '@shopify/flash-list';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import { EmptyState, Screen, SkeletonRow, Text } from '@/components/ui';
import { relativeTime } from '@/lib/format';
import { useTheme } from '@/providers/theme-provider';
import type { AppNotification, NotificationType } from '@/types/app';

import { notificationHref, useMarkNotificationsRead, useNotifications } from './api';

const ICONS: Record<NotificationType, string> = {
  match: '💘',
  message: '💬',
  like: '❤️',
  contact: '🤝',
  mission: '💼',
  system: '✦',
};

/** Server titles start with an emoji (useful in push); the list shows it as the icon instead. */
function plainTitle(title: string): string {
  return title.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, '');
}

/** Persistent notification history with deep links. */
export function NotificationsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const items = notifications.data?.pages.flat() ?? [];
  const unread = items.filter((n) => !n.read).length;

  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate([n.id]);
    router.push(notificationHref(n) as Href);
  };

  return (
    <Screen>
      <StackHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : undefined}
        right={
          unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => markRead.mutate(null)}
              hitSlop={8}
              disabled={markRead.isPending}>
              <Text className="text-[14px] font-bold text-talent-fg">Tout lire</Text>
            </Pressable>
          ) : undefined
        }
      />
      {notifications.isPending ? (
        <View className="gap-1">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => n.id}
          onEndReached={() => {
            if (notifications.hasNextPage && !notifications.isFetchingNextPage)
              void notifications.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              emoji="🔔"
              title="Rien de neuf pour l'instant"
              text="Tes matchs, messages et likes apparaîtront ici."
            />
          }
          ListFooterComponent={
            notifications.isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={palette.muted} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.body}${item.read ? '' : ', non lue'}`}
              onPress={() => open(item)}
              className={`flex-row gap-3 px-5 py-3.5 active:bg-surface ${item.read ? '' : 'bg-talent/10'}`}>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface">
                <Text className="text-[20px]">{ICONS[item.type] ?? '✦'}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text
                  className={`text-[15px] text-text ${item.read ? 'font-semibold' : 'font-extrabold'}`}>
                  {plainTitle(item.title)}
                </Text>
                {item.body ? (
                  <Text variant="caption" numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <Text className="text-[11px] text-hint">{relativeTime(item.created_at)}</Text>
              </View>
              {!item.read ? <View className="mt-2 h-2.5 w-2.5 rounded-full bg-notif" /> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
