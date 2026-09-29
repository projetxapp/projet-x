import { View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Screen,
  SkeletonRow,
  Text,
  useToast,
} from '@/components/ui';
import { humanError } from '@/lib/errors';
import { fullName, relativeTime } from '@/lib/format';

import { useBlockedUsers, useUnblockUser } from './api';

export function BlockedScreen() {
  const toast = useToast();
  const blocked = useBlockedUsers();
  const unblock = useUnblockUser();
  return (
    <Screen scroll>
      <StackHeader title="Utilisateurs bloqués" />
      <View className="px-5">
        {blocked.isPending ? (
          <SkeletonRow />
        ) : (blocked.data ?? []).length === 0 ? (
          <EmptyState
            emoji="🕊️"
            title="Personne n'est bloqué"
            text="Tu peux bloquer quelqu'un depuis son profil ou une conversation."
          />
        ) : (
          <Card className="p-0">
            {(blocked.data ?? []).map((u, i, all) => (
              <View
                key={u.user_id}
                className={`flex-row items-center gap-3 px-4 py-3 ${i === all.length - 1 ? '' : 'border-b border-line/10'}`}>
                <Avatar
                  uri={u.avatar_url}
                  firstName={u.first_name}
                  lastName={u.last_name}
                  size={44}
                />
                <View className="flex-1">
                  <Text variant="subheading">{fullName(u.first_name, u.last_name)}</Text>
                  <Text variant="caption">Bloqué·e {relativeTime(u.blocked_at)}</Text>
                </View>
                <Button
                  title="Débloquer"
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    unblock.mutate(u.user_id, {
                      onSuccess: () =>
                        toast.show({
                          title: `${fullName(u.first_name, u.last_name)} est débloqué·e`,
                        }),
                      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
                    })
                  }
                />
              </View>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
