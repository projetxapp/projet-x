import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import { Avatar, Button, EmptyState, Screen, SkeletonRow, Text, useToast } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { humanError } from '@/lib/errors';
import { fullName, relativeTime } from '@/lib/format';
import type { ContactRequest } from '@/types/app';

import { useCancelContact, useContactRequests, useRespondContact } from './api';

type Item = { type: 'header'; title: string } | { type: 'request'; request: ContactRequest };

const STATUS: Record<ContactRequest['status'], string> = {
  pending: 'En attente',
  accepted: 'Acceptée ✓',
  declined: 'Refusée',
  cancelled: 'Annulée',
};

/** Mises en relation: incoming (accept / decline), sent (cancel), history. */
export function RequestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const requests = useContactRequests();
  const respond = useRespondContact();
  const cancel = useCancelContact();

  const items = useMemo<Item[]>(() => {
    const all = requests.data ?? [];
    const incoming = all.filter((r) => r.direction === 'incoming' && r.status === 'pending');
    const outgoing = all.filter((r) => r.direction === 'outgoing' && r.status === 'pending');
    const past = all.filter((r) => r.status !== 'pending');
    const list: Item[] = [];
    const add = (title: string, rows: ContactRequest[]) => {
      if (rows.length === 0) return;
      list.push({ type: 'header', title });
      rows.forEach((request) => list.push({ type: 'request', request }));
    };
    add('Reçues', incoming);
    add('Envoyées', outgoing);
    add('Historique', past);
    return list;
  }, [requests.data]);

  const onRespond = (request: ContactRequest, accept: boolean) =>
    respond.mutate(
      { requestId: request.id, accept },
      {
        onSuccess: (result) => {
          if (accept && result.match_id)
            router.push({ pathname: '/chat/[id]', params: { id: result.match_id } });
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );

  return (
    <Screen>
      <StackHeader title="Mises en relation" />
      {requests.isPending ? (
        <View className="gap-1">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => (item.type === 'header' ? item.title : item.request.id)}
          getItemType={(item) => item.type}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              emoji="🤝"
              title="Aucune demande"
              text="Depuis l'Explorer, demande une mise en relation aux profils qui t'intéressent."
              actionLabel="Explorer"
              onAction={() => router.push('/explorer')}
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text variant="overline" className="px-5 pb-2 pt-4">
                  {item.title}
                </Text>
              );
            }
            const r = item.request;
            const cfg = MODES[r.from_mode];
            const name = fullName(r.other_first_name, r.other_last_name);
            return (
              <View className="mx-5 mb-3 gap-3 rounded-card border border-line/10 bg-card p-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Voir le profil de ${name}`}
                  onPress={() => router.push({ pathname: '/u/[id]', params: { id: r.other_id } })}
                  className="flex-row items-center gap-3 active:opacity-70">
                  <Avatar
                    uri={r.other_avatar_url}
                    firstName={r.other_first_name}
                    lastName={r.other_last_name}
                    size={48}
                    gradient={cfg.gradient}
                  />
                  <View className="flex-1">
                    <Text variant="subheading" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {r.direction === 'incoming'
                        ? `${cfg.emoji} en tant que ${cfg.label.toLowerCase()}`
                        : `Envoyée en tant que ${cfg.label.toLowerCase()}`}{' '}
                      · {relativeTime(r.created_at)}
                    </Text>
                  </View>
                  {r.status !== 'pending' ? (
                    <Text variant="caption">{STATUS[r.status]}</Text>
                  ) : null}
                </Pressable>
                {r.message ? (
                  <Text
                    variant="body"
                    className="rounded-field bg-surface px-3.5 py-2.5 text-muted">
                    « {r.message} »
                  </Text>
                ) : null}
                {r.status === 'pending' && r.direction === 'incoming' ? (
                  <View className="flex-row gap-3">
                    <Button
                      title="Refuser"
                      variant="outline"
                      size="md"
                      className="flex-1"
                      disabled={respond.isPending}
                      onPress={() => onRespond(r, false)}
                    />
                    <Button
                      title="Accepter"
                      size="md"
                      className="flex-1"
                      loading={respond.isPending}
                      onPress={() => onRespond(r, true)}
                    />
                  </View>
                ) : null}
                {r.status === 'pending' && r.direction === 'outgoing' ? (
                  <Button
                    title="Annuler la demande"
                    variant="ghost"
                    size="sm"
                    loading={cancel.isPending}
                    onPress={() => cancel.mutate(r.id)}
                  />
                ) : null}
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
