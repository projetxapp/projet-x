import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Compass, Heart, Inbox, Sparkles, Users } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, RefreshControl, View } from 'react-native';

import { AppHeader } from '@/components/app/app-header';
import {
  Avatar,
  Card,
  CountBadge,
  Gradient,
  ProgressBar,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useConversations } from '@/features/chat/api';
import { useActiveMode, useMe } from '@/features/me/api';
import { profileCompletion } from '@/lib/completion';
import { chatTime, fullName, greeting, plural } from '@/lib/format';
import { getPushPermission, registerForPush } from '@/lib/push';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { Conversation, Mode } from '@/types/app';

import { useHomeStats } from './api';

const CTA: Record<Mode, { title: string; text: string }> = {
  talent: {
    title: "Des projets t'attendent",
    text: 'Swipe les projets qui cherchent tes compétences.',
  },
  project: { title: 'Trouve tes talents', text: 'Swipe les talents qui matchent tes besoins.' },
  investor: { title: 'Découvre les pépites', text: 'Swipe les projets alignés avec ta thèse.' },
};

/** Accueil: 3 requests (get_me cached, get_home_stats, get_conversations_summary). */
export function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { palette, scheme } = useTheme();
  const { data: me } = useMe();
  const { mode } = useActiveMode();
  const stats = useHomeStats(mode);
  const conversations = useConversations();
  const [refreshing, setRefreshing] = useState(false);
  const cfg = MODES[mode];
  const accent = modeTextColor(mode, scheme);

  const push = useQuery({
    queryKey: ['push-permission'],
    queryFn: getPushPermission,
    enabled: Platform.OS !== 'web',
    staleTime: Infinity,
  });

  const completion = me ? profileCompletion(me, mode) : null;
  const latestMatches = useMemo(
    () =>
      [...(conversations.data ?? [])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 3),
    [conversations.data],
  );
  const matchCount = conversations.data?.length ?? 0;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      stats.refetch(),
      conversations.refetch(),
    ]);
    setRefreshing(false);
  };

  const enablePush = async () => {
    await registerForPush(true);
    await push.refetch();
  };

  return (
    <Screen
      scroll
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.muted} />
        ),
      }}>
      <AppHeader />
      <View className="gap-5 px-5">
        <View className="gap-1">
          <Text variant="display">{greeting(me?.profile.first_name)}</Text>
          <Text variant="body" className="text-muted">
            {cfg.emoji} Mode {cfg.label.toLowerCase()}
          </Text>
        </View>

        {completion && completion.percent < 100 ? (
          <Card
            onPress={() => router.push('/profil/modifier')}
            accessibilityLabel="Compléter mon profil">
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="subheading">Profil complété à {completion.percent} %</Text>
              <ChevronRight size={18} color={palette.hint} />
            </View>
            <ProgressBar value={completion.percent} colors={cfg.gradient} />
            {completion.missing[0] ? (
              <Text variant="caption" className="mt-2.5">
                {completion.missing[0].label} (+{completion.missing[0].weight} %) — un profil
                complet reçoit plus de matchs.
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Pressable
          testID="home-swipe-cta"
          accessibilityRole="button"
          accessibilityLabel={`${CTA[mode].title}. Commencer à swiper`}
          onPress={() => router.push('/swipe')}
          className="active:scale-[0.98]">
          <Gradient
            colors={cfg.gradient}
            className="gap-2 rounded-card p-5"
            style={{ boxShadow: `0px 10px 30px ${cfg.color}55` }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[22px] font-black tracking-tight text-white">
                {CTA[mode].title}
              </Text>
              <Text className="text-[30px]">🔥</Text>
            </View>
            <Text className="text-[15px] leading-[21px] text-white/90">{CTA[mode].text}</Text>
            {stats.data && stats.data.new_compatible > 0 ? (
              <View className="mt-1 self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="text-[12px] font-bold text-white">
                  {plural(
                    stats.data.new_compatible,
                    'nouveau profil compatible',
                    'nouveaux profils compatibles',
                  )}{' '}
                  cette semaine
                </Text>
              </View>
            ) : null}
            <View className="mt-2 self-start rounded-btn bg-white px-5 py-2.5">
              <Text className="text-[14px] font-extrabold" style={{ color: cfg.color }}>
                Swiper maintenant →
              </Text>
            </View>
          </Gradient>
        </Pressable>

        <View className="flex-row gap-3">
          <Stat
            loading={!stats.data}
            value={stats.data?.likes_week}
            label="likes reçus cette semaine"
            icon={<Heart size={16} color={accent} />}
          />
          <Stat
            loading={!stats.data}
            value={stats.data?.matches_total}
            label={
              stats.data && stats.data.matches_week > 0
                ? `matchs (+${stats.data.matches_week} cette semaine)`
                : 'matchs'
            }
            icon={<Sparkles size={16} color={accent} />}
          />
          <Stat
            loading={!stats.data}
            value={stats.data?.new_compatible}
            label="nouveaux profils compatibles"
            icon={<Users size={16} color={accent} />}
          />
        </View>

        {stats.data && stats.data.likes_pending > 0 ? (
          <ActionCard
            icon={<Heart size={20} color="#F97316" fill="#F97316" />}
            title={`${plural(stats.data.likes_pending, 'personne', 'personnes')} ${stats.data.likes_pending > 1 ? "t'ont" : "t'a"} liké`}
            text="Découvre qui et matche en un geste."
            onPress={() => router.push('/likes')}
          />
        ) : null}
        {stats.data && stats.data.pending_contacts > 0 ? (
          <ActionCard
            icon={<Inbox size={20} color={accent} />}
            title={plural(
              stats.data.pending_contacts,
              'demande de mise en relation',
              'demandes de mise en relation',
            )}
            text="Accepte pour ouvrir la conversation."
            onPress={() => router.push('/demandes')}
          />
        ) : null}
        {push.data === 'undetermined' ? (
          <ActionCard
            icon={<Bell size={20} color={accent} />}
            title="Active les notifications"
            text="Sois prévenu·e dès qu'un match ou un message arrive."
            onPress={enablePush}
          />
        ) : null}

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="heading" level={2}>
              Derniers matchs
            </Text>
            {matchCount > 3 ? (
              <Pressable accessibilityRole="link" onPress={() => router.push('/chat')} hitSlop={8}>
                <Text className="text-[14px] font-bold" style={{ color: accent }}>
                  Voir les {matchCount} →
                </Text>
              </Pressable>
            ) : null}
          </View>
          {conversations.isPending ? (
            <Card className="gap-4">
              {[0, 1, 2].map((i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Skeleton width={44} height={44} radius={22} />
                  <View className="flex-1 gap-2">
                    <Skeleton width="50%" height={14} />
                    <Skeleton width="75%" height={12} />
                  </View>
                </View>
              ))}
            </Card>
          ) : latestMatches.length === 0 ? (
            <Card className="items-center gap-2 py-6">
              <Text className="text-[34px]">🤝</Text>
              <Text variant="subheading">Pas encore de match</Text>
              <Text variant="caption" className="text-center">
                Swipe à droite sur les profils qui te plaisent : s'ils te likent aussi, c'est un
                match !
              </Text>
            </Card>
          ) : (
            <Card className="p-0">
              {latestMatches.map((c, i) => (
                <MatchRow
                  key={c.match_id}
                  conversation={c}
                  last={i === latestMatches.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/chat/[id]', params: { id: c.match_id } })
                  }
                />
              ))}
            </Card>
          )}
        </View>

        <Card
          onPress={() => router.push('/explorer')}
          accessibilityLabel="Ouvrir l'Explorer"
          className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface">
            <Compass size={24} color={accent} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="subheading">Explore la communauté</Text>
            <Text variant="caption">Cherche par compétence, secteur, école ou département.</Text>
          </View>
          <ChevronRight size={18} color={palette.hint} />
        </Card>
      </View>
    </Screen>
  );
}

function Stat({
  value,
  label,
  icon,
  loading,
}: {
  value?: number;
  label: string;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <View className="flex-1 gap-1.5 rounded-card border border-line/10 bg-card p-3.5">
      {icon}
      {loading ? (
        <Skeleton width={36} height={26} />
      ) : (
        <Text className="text-[26px] font-black tracking-tight text-text">{value ?? 0}</Text>
      )}
      <Text variant="caption" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  text,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={title} className="flex-row items-center gap-3.5">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text variant="subheading">{title}</Text>
        <Text variant="caption">{text}</Text>
      </View>
      <ChevronRight size={18} color={palette.hint} />
    </Card>
  );
}

function MatchRow({
  conversation: c,
  last,
  onPress,
}: {
  conversation: Conversation;
  last: boolean;
  onPress: () => void;
}) {
  const other = MODES[c.other_mode];
  const name = fullName(c.other_first_name, c.other_last_name);
  const subtitle = c.last_message_content
    ? c.last_message_content
    : c.other_mode === 'project' && c.other_project_name
      ? `${other.emoji} ${c.other_project_name}`
      : `${other.emoji} ${c.other_statut || other.label}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${name}`}
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${last ? '' : 'border-b border-line/10'}`}>
      <Avatar
        uri={c.other_avatar_url}
        firstName={c.other_first_name}
        lastName={c.other_last_name}
        gradient={other.gradient}
      />
      <View className="flex-1 gap-0.5">
        <Text variant="subheading" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {c.unread_count > 0 ? (
        <CountBadge count={c.unread_count} />
      ) : c.last_message_id ? (
        <Text variant="caption">{chatTime(c.last_message_created_at)}</Text>
      ) : (
        <View className="rounded-full bg-success/15 px-2.5 py-1">
          <Text className="text-[11px] font-bold text-success">Nouveau</Text>
        </View>
      )}
    </Pressable>
  );
}
