import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import { Avatar, EmptyState, Screen, SkeletonRow, Text, useToast } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useSwipe } from '@/features/swipe/api';
import { humanError } from '@/lib/errors';
import { fullName, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import type { LikeReceived, Mode } from '@/types/app';

import { useLikesReceived } from './api';

/** The mode I like someone back with: projects answer talents & investors, talents answer projects. */
function answerMode(like: LikeReceived): Mode {
  return like.mode === 'project' ? 'talent' : 'project';
}

export function LikesScreen() {
  const router = useRouter();
  const toast = useToast();
  const likes = useLikesReceived();
  const swipe = useSwipe();

  const answer = (like: LikeReceived, direction: 'like' | 'pass') => {
    if (direction === 'like') haptics.medium();
    swipe.mutate(
      { target: like.user_id, mode: answerMode(like), direction },
      {
        onSuccess: (result) => {
          void likes.refetch();
          if (result.matched && result.match_id) {
            haptics.success();
            toast.show({
              title: "C'est un match ! 🎉",
              body: 'La conversation est ouverte.',
              tone: 'brand',
            });
            router.push({ pathname: '/chat/[id]', params: { id: result.match_id } });
          }
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );
  };

  return (
    <Screen>
      <StackHeader title="Ils t'ont liké" subtitle="Like en retour pour matcher" />
      {likes.isPending ? (
        <View className="gap-1">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={likes.data ?? []}
          keyExtractor={(l) => `${l.user_id}:${l.mode}`}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              emoji="💌"
              title="Pas de nouveau like"
              text="Complète ton profil et swipe : les likes arrivent vite !"
              actionLabel="Swiper"
              onAction={() => router.push('/swipe')}
            />
          }
          renderItem={({ item }) => {
            const cfg = MODES[item.mode];
            const name = fullName(item.first_name, item.last_name);
            return (
              <View className="mx-5 mb-3 flex-row items-center gap-3 rounded-card border border-line/10 bg-card p-3.5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Voir le profil de ${name}`}
                  onPress={() =>
                    router.push({
                      pathname: '/u/[id]',
                      params: { id: item.user_id, mode: item.mode },
                    })
                  }
                  className="flex-1 flex-row items-center gap-3 active:opacity-70">
                  <Avatar
                    uri={item.avatar_url}
                    firstName={item.first_name}
                    lastName={item.last_name}
                    size={54}
                    gradient={cfg.gradient}
                    ring={item.direction === 'super' ? '#38BDF8' : undefined}
                  />
                  <View className="flex-1 gap-0.5">
                    <Text variant="subheading" numberOfLines={1}>
                      {name}
                      {item.direction === 'super' ? ' ⭐' : ''}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {cfg.emoji}{' '}
                      {item.mode === 'project' && item.project_name
                        ? item.project_name
                        : item.statut || cfg.label}
                    </Text>
                    <Text className="text-[11px] text-hint">
                      {item.direction === 'super' ? 'Super like' : 'Like'}{' '}
                      {relativeTime(item.liked_at)}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Passer ${name}`}
                  onPress={() => answer(item, 'pass')}
                  className="h-11 w-11 items-center justify-center rounded-full bg-surface active:scale-90">
                  <X size={20} color="#F87171" strokeWidth={3} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Liker ${name} en retour`}
                  onPress={() => answer(item, 'like')}
                  className="h-11 w-11 items-center justify-center rounded-full active:scale-90"
                  style={{ backgroundColor: MODES[answerMode(item)].color }}>
                  <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
