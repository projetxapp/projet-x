import { View } from 'react-native';

import { Button, Text, useToast } from '@/components/ui';
import { humanError } from '@/lib/errors';
import { formatEuros } from '@/lib/format';
import type { MissionRow } from '@/types/app';

import { useRespondMission } from './api';

const MODE_LABEL: Record<string, string> = {
  flash: '⚡ Mission Flash',
  side: '🚀 Side project',
  equity: '💎 Equity',
};
const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'En attente de réponse', cls: 'bg-notif/15 text-notif' },
  accepted: { label: 'Acceptée', cls: 'bg-success/15 text-success' },
  declined: { label: 'Refusée', cls: 'bg-danger/15 text-danger-fg' },
  cancelled: { label: 'Annulée', cls: 'bg-surface text-muted' },
  done: { label: 'Terminée 🏁', cls: 'bg-success/15 text-success' },
};

/** Mission proposed in a conversation, with the actions allowed for the viewer. */
export function MissionCard({
  mission,
  matchId,
  myId,
}: {
  mission: MissionRow;
  matchId: string;
  myId: string | undefined;
}) {
  const toast = useToast();
  const respond = useRespondMission(matchId);
  const mine = mission.proposed_by === myId;
  const status = STATUS[mission.status] ?? STATUS.open!;

  const act = (next: 'accepted' | 'declined' | 'cancelled' | 'done') =>
    respond.mutate(
      { missionId: mission.id, status: next },
      { onError: (error) => toast.show({ title: humanError(error), tone: 'error' }) },
    );

  return (
    <View className="w-[280px] gap-2.5 rounded-card border border-line/10 bg-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="overline">{MODE_LABEL[mission.mode] ?? 'Mission'}</Text>
        <View className={`rounded-full px-2 py-0.5 ${status.cls.split(' ')[0]}`}>
          <Text className={`text-[11px] font-bold ${status.cls.split(' ')[1]}`}>
            {status.label}
          </Text>
        </View>
      </View>
      <Text variant="subheading">{mission.title}</Text>
      {mission.description?.trim() ? (
        <Text variant="caption" numberOfLines={4}>
          {mission.description.trim()}
        </Text>
      ) : null}
      {mission.budget != null || mission.equity_percent != null ? (
        <View className="flex-row gap-3">
          {mission.budget != null ? (
            <Text className="text-[14px] font-bold text-text">
              💶 {formatEuros(Number(mission.budget))}
            </Text>
          ) : null}
          {mission.equity_percent != null ? (
            <Text className="text-[14px] font-bold text-text">
              💎 {Number(mission.equity_percent)} %
            </Text>
          ) : null}
        </View>
      ) : null}
      {mission.status === 'open' && !mine ? (
        <View className="flex-row gap-2">
          <Button
            title="Refuser"
            variant="outline"
            size="sm"
            className="flex-1"
            loading={respond.isPending}
            onPress={() => act('declined')}
          />
          <Button
            title="Accepter"
            size="sm"
            className="flex-1"
            loading={respond.isPending}
            onPress={() => act('accepted')}
          />
        </View>
      ) : null}
      {mission.status === 'open' && mine ? (
        <Button
          title="Annuler la proposition"
          variant="ghost"
          size="sm"
          loading={respond.isPending}
          onPress={() => act('cancelled')}
        />
      ) : null}
      {mission.status === 'accepted' ? (
        <Button
          title="Marquer comme terminée"
          variant="secondary"
          size="sm"
          loading={respond.isPending}
          onPress={() => act('done')}
        />
      ) : null}
    </View>
  );
}
