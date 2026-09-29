import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  SkeletonRow,
  Text,
  useToast,
} from '@/components/ui';
import { useMe } from '@/features/me/api';
import { REPORT_REASONS } from '@/features/social/api';
import { confirm } from '@/lib/confirm';
import { humanError } from '@/lib/errors';
import { relativeTime } from '@/lib/format';
import type { ModerationItem } from '@/types/app';

import { useModerate, useModerationQueue } from './api';

type Status = 'open' | 'actioned' | 'dismissed';
const TABS: { id: Status; label: string }[] = [
  { id: 'open', label: 'À traiter' },
  { id: 'actioned', label: 'Sanctionnés' },
  { id: 'dismissed', label: 'Classés' },
];

/** Simple moderation queue (App Store requirement). Admins only (enforced in SQL too). */
export function ModerationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { data: me } = useMe();
  const [status, setStatus] = useState<Status>('open');
  const queue = useModerationQueue(status);
  const moderate = useModerate();

  if (me && !me.is_admin) {
    return (
      <Screen>
        <StackHeader title="Modération" />
        <EmptyState
          emoji="🔒"
          title="Accès réservé"
          text="Cette page est réservée à l'équipe de modération."
        />
      </Screen>
    );
  }

  const act = async (item: ModerationItem, next: 'actioned' | 'dismissed', suspend: boolean) => {
    if (suspend) {
      const ok = await confirm({
        title: `Suspendre ${item.reported_name} ?`,
        message: "Son profil disparaîtra de l'app et ses sessions seront bloquées.",
        confirmLabel: 'Suspendre',
        destructive: true,
      });
      if (!ok) return;
    }
    moderate.mutate(
      { reportId: item.report_id, status: next, suspend },
      {
        onSuccess: () =>
          toast.show({
            title: next === 'dismissed' ? 'Signalement classé' : 'Sanction appliquée',
            tone: 'success',
          }),
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );
  };

  const items = queue.data ?? [];
  return (
    <Screen scroll>
      <StackHeader
        title="Modération"
        subtitle={
          status === 'open' && items.length ? `${items.length} signalement(s) à traiter` : undefined
        }
      />
      <View className="flex-row gap-2 px-5 pb-4">
        {TABS.map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            size="sm"
            selected={status === t.id}
            onPress={() => setStatus(t.id)}
          />
        ))}
      </View>
      <View className="gap-3 px-5">
        {queue.isPending ? (
          <SkeletonRow />
        ) : items.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="Rien à signaler"
            text="Aucun signalement dans cette catégorie."
          />
        ) : (
          items.map((item) => (
            <Card key={item.report_id} className="gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={!item.reported_id}
                onPress={() =>
                  item.reported_id &&
                  router.push({ pathname: '/u/[id]', params: { id: item.reported_id } })
                }
                className="flex-row items-center gap-3">
                <Avatar uri={item.reported_avatar_url} firstName={item.reported_name} size={44} />
                <View className="flex-1">
                  <Text variant="subheading">
                    {item.reported_name}
                    {item.reported_suspended ? ' · suspendu·e' : ''}
                  </Text>
                  <Text variant="caption">
                    {item.reports_against} signalement(s) · par {item.reporter_name} ·{' '}
                    {relativeTime(item.created_at)}
                  </Text>
                </View>
              </Pressable>
              <Text className="text-[14px] font-bold text-danger-fg">
                {REPORT_REASONS.find((r) => r.id === item.reason)?.label ?? item.reason}
              </Text>
              {item.details ? <Text variant="body">{item.details}</Text> : null}
              {item.message_content ? (
                <Text variant="caption" className="rounded-field bg-surface p-3">
                  Message signalé : « {item.message_content} »
                </Text>
              ) : null}
              {status === 'open' ? (
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    title="Classer"
                    variant="outline"
                    size="sm"
                    onPress={() => void act(item, 'dismissed', false)}
                  />
                  <Button
                    title="Avertir"
                    variant="secondary"
                    size="sm"
                    onPress={() => void act(item, 'actioned', false)}
                  />
                  <Button
                    title="Suspendre"
                    variant="danger"
                    size="sm"
                    onPress={() => void act(item, 'actioned', true)}
                  />
                </View>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
