import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/app/app-header';
import { Avatar, Chip, EmptyState, Screen, SkeletonRow, Text, TextField } from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';
import { useActiveMode } from '@/features/me/api';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import type { Conversation, Mode } from '@/types/app';

import { useConversations } from './api';
import { ConversationRow, conversationTitle } from './conversation-row';

type Filter = 'all' | Mode;
type Item =
  { type: 'header'; title: string } | { type: 'conversation'; conversation: Conversation };

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useTheme();
  const { mode } = useActiveMode();
  const conversations = useConversations();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (conversations.data ?? []).filter((c) => {
      if (filter !== 'all' && c.my_mode !== filter) return false;
      if (!q) return true;
      return normalize(
        [conversationTitle(c), c.other_project_name, c.other_statut, c.last_message_content]
          .filter(Boolean)
          .join(' '),
      ).includes(q);
    });
  }, [conversations.data, filter, query]);

  const newMatches = filtered.filter((c) => !c.last_message_id);
  const items = useMemo<Item[]>(() => {
    const withMessages = filtered.filter((c) => c.last_message_id);
    const unread = withMessages.filter((c) => c.unread_count > 0);
    const read = withMessages.filter((c) => c.unread_count === 0);
    const list: Item[] = [];
    if (unread.length > 0) {
      list.push({ type: 'header', title: 'Nouveaux messages' });
      unread.forEach((c) => list.push({ type: 'conversation', conversation: c }));
    }
    if (read.length > 0) {
      if (unread.length > 0) list.push({ type: 'header', title: 'Conversations' });
      read.forEach((c) => list.push({ type: 'conversation', conversation: c }));
    }
    return list;
  }, [filtered]);

  const open = (c: Conversation) =>
    router.push({ pathname: '/chat/[id]', params: { id: c.match_id } });
  const refresh = async () => {
    setRefreshing(true);
    await conversations.refetch();
    setRefreshing(false);
  };

  const total = conversations.data?.length ?? 0;

  return (
    <Screen>
      <AppHeader title="Messages" />
      {total > 0 ? (
        <View className="gap-3 px-5 pb-2">
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une conversation"
            accessibilityLabel="Rechercher une conversation"
            left={<Search size={18} color={palette.hint} />}
            returnKeyType="search"
            autoCorrect={false}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2">
            <Chip
              label="Tous"
              size="sm"
              tone={mode}
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {MODE_ORDER.map((m) => (
              <Chip
                key={m}
                label={MODES[m].short}
                emoji={MODES[m].emoji}
                size="sm"
                tone={m}
                selected={filter === m}
                onPress={() => setFilter(filter === m ? 'all' : m)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {conversations.isPending ? (
        <View className="gap-1 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : total === 0 ? (
        <EmptyState
          emoji="💬"
          title="Pas encore de conversation"
          text="Quand tu matches avec quelqu'un, la conversation apparaît ici. Lance-toi !"
          actionLabel="Swiper des profils"
          onAction={() => router.push('/swipe')}
          gradient={MODES[mode].gradient}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) =>
            item.type === 'header' ? `h-${item.title}` : item.conversation.match_id
          }
          getItemType={(item) => item.type}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.muted} />
          }
          ListHeaderComponent={
            newMatches.length > 0 ? (
              <View className="gap-3 pb-2 pt-3">
                <Text variant="overline" className="px-5">
                  Nouveaux matchs · {newMatches.length}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-4 px-5">
                  {newMatches.map((c) => (
                    <Pressable
                      key={c.match_id}
                      accessibilityRole="button"
                      accessibilityLabel={`Nouveau match avec ${conversationTitle(c)}`}
                      onPress={() => open(c)}
                      className="w-[72px] items-center gap-1.5 active:opacity-70">
                      <Avatar
                        uri={c.other_avatar_url}
                        firstName={c.other_first_name}
                        lastName={c.other_last_name}
                        size={64}
                        gradient={MODES[c.other_mode].gradient}
                        ring={MODES[c.other_mode].color}
                      />
                      <Text className="text-[12px] font-semibold text-text" numberOfLines={1}>
                        {c.other_first_name || conversationTitle(c)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            newMatches.length === 0 ? (
              <EmptyState
                emoji="🔍"
                title="Aucun résultat"
                text="Essaie un autre nom ou retire le filtre."
              />
            ) : null
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text variant="overline" className="px-5 pb-1 pt-4">
                {item.title}
              </Text>
            ) : (
              <ConversationRow conversation={item.conversation} myId={user?.id} onPress={open} />
            )
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
