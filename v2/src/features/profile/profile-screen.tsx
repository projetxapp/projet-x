import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  Eye,
  Heart,
  Inbox,
  PencilLine,
  Settings,
  ShieldCheck,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { AppHeader } from '@/components/app/app-header';
import { LinksList } from '@/components/app/links-list';
import { Section, TagList } from '@/components/app/tag-list';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  ListRow,
  ProgressBar,
  Screen,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { MODES } from '@/constants/modes';
import { placeLabel } from '@/constants/places';
import { useActiveMode, useMe } from '@/features/me/api';
import { ProfileCard } from '@/features/swipe/profile-card';
import { profileCompletion } from '@/lib/completion';
import { humanError } from '@/lib/errors';
import { fullName } from '@/lib/format';
import { PermissionDeniedError } from '@/lib/images';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { DeckCard, Me, Mode, ProfileLink } from '@/types/app';

import { useProfileStats, useUploadPhoto } from './api';

/** My profile as a swipe card, for « comment les autres me voient ». */
export function myDeckCard(me: Me, mode: Mode): DeckCard {
  const p = me.profile;
  const t = mode === 'talent' ? me.talent : null;
  const pp = mode === 'project' ? me.project : null;
  return {
    user_id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    age: p.age,
    city: p.city,
    avatar_url: p.avatar_url,
    school: p.school,
    last_active_at: p.last_active_at,
    is_pro: p.is_pro,
    statut: t?.statut ?? pp?.statut ?? null,
    bio: t?.bio ?? null,
    skills: t?.skills ?? null,
    hours_per_week: (t?.hours_per_week as DeckCard['hours_per_week']) ?? null,
    project_name: pp?.project_name ?? null,
    description: pp?.description ?? null,
    founder_bio: pp?.founder_bio ?? null,
    stage: (pp?.stage as DeckCard['stage']) ?? null,
    sectors: pp?.sectors ?? null,
    needs: pp?.needs ?? null,
    work_mode: (pp?.work_mode as DeckCard['work_mode']) ?? null,
    equity: pp?.equity ?? null,
    budget: pp?.budget ?? null,
    team_size: pp?.team_size ?? null,
    cover_url: pp?.cover_url ?? null,
    collab_modes: ((t ?? pp)?.collab_modes as DeckCard['collab_modes']) ?? null,
    links: ((t ?? pp)?.links as unknown as ProfileLink[]) ?? null,
    score: 0,
    reasons: [],
  };
}

export function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette, scheme } = useTheme();
  const { data: me, refetch } = useMe();
  const { mode } = useActiveMode();
  const stats = useProfileStats(mode);
  const upload = useUploadPhoto();
  const [preview, setPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cfg = MODES[mode];
  const accent = modeTextColor(mode, scheme);

  if (!me) {
    return (
      <Screen>
        <AppHeader title="Profil" />
        <View className="items-center gap-3 p-5">
          <Skeleton width={96} height={96} radius={48} />
          <Skeleton width="50%" height={24} />
          <Skeleton height={120} radius={20} />
        </View>
      </Screen>
    );
  }

  const p = me.profile;
  const completion = profileCompletion(me, mode);
  const sub = mode === 'talent' ? me.talent : mode === 'project' ? me.project : me.investor;
  const headline =
    mode === 'project' ? me.project?.project_name || me.project?.statut : sub?.statut;
  const tags =
    mode === 'talent'
      ? me.talent?.skills
      : mode === 'project'
        ? me.project?.needs
        : me.investor?.sectors;
  const about =
    mode === 'talent'
      ? me.talent?.bio
      : mode === 'project'
        ? me.project?.description
        : me.investor?.bio;
  const links = (sub?.links as unknown as ProfileLink[] | undefined) ?? [];

  const changePhoto = () =>
    upload.mutate('avatar', {
      onSuccess: (url) => url && toast.show({ title: 'Photo mise à jour 📸', tone: 'success' }),
      onError: (error) =>
        toast.show({
          title: error instanceof PermissionDeniedError ? error.message : humanError(error),
          tone: 'error',
        }),
    });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), stats.refetch()]);
    setRefreshing(false);
  };

  const s = stats.data;
  const statItems: { label: string; value: number | undefined }[] = [
    { label: 'likes reçus', value: s?.likes_received },
    mode === 'project'
      ? { label: "likes d'investisseurs", value: s?.investor_likes }
      : { label: 'likes donnés', value: s?.likes_given },
    { label: 'matchs', value: s?.matches },
    { label: 'conversations', value: s?.conversations },
    { label: 'missions en cours', value: s?.missions_active },
    { label: 'missions terminées', value: s?.missions_done },
  ];

  return (
    <Screen
      scroll
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.muted} />
        ),
      }}>
      <AppHeader
        title="Profil"
        right={
          <IconButton
            icon={<Settings size={20} color={palette.text} />}
            accessibilityLabel="Paramètres"
            onPress={() => router.push('/parametres')}
          />
        }
      />
      <View className="gap-5 px-5">
        <View className="items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Changer ma photo"
            onPress={changePhoto}
            disabled={upload.isPending}>
            <Avatar
              uri={p.avatar_url}
              firstName={p.first_name}
              lastName={p.last_name}
              size={104}
              gradient={cfg.gradient}
              ring={cfg.color}
            />
            <View
              className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-bg"
              style={{ backgroundColor: cfg.color }}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text variant="title" className="text-center">
            {fullName(p.first_name, p.last_name)}
            {p.age ? `, ${p.age}` : ''}
          </Text>
          {headline ? (
            <Text variant="subheading" className="text-center" style={{ color: accent }}>
              {cfg.emoji} {headline}
            </Text>
          ) : null}
          <Text variant="caption" className="text-center">
            {[p.school, placeLabel(p.city)].filter(Boolean).join(' · ') ||
              'Ajoute ton école et ton département'}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Button
            title="Modifier"
            icon={<PencilLine size={16} color="#FFFFFF" />}
            gradient={cfg.gradient}
            size="md"
            className="flex-1"
            onPress={() => router.push('/profil/modifier')}
          />
          <Button
            title="Aperçu"
            variant="secondary"
            size="md"
            icon={<Eye size={16} color={palette.text} />}
            className="flex-1"
            onPress={() =>
              mode === 'investor'
                ? router.push({ pathname: '/u/[id]', params: { id: p.id, mode } })
                : setPreview(true)
            }
            accessibilityHint="Voir mon profil comme les autres le voient"
          />
        </View>

        {completion.percent < 100 ? (
          <Card
            onPress={() => router.push('/profil/modifier')}
            accessibilityLabel="Compléter mon profil"
            className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="subheading">
                Profil {cfg.short.toLowerCase()} complété à {completion.percent} %
              </Text>
              <ChevronRight size={18} color={palette.hint} />
            </View>
            <ProgressBar value={completion.percent} colors={cfg.gradient} />
            {completion.missing.slice(0, 3).map((m) => (
              <Text key={m.label} variant="caption">
                ○ {m.label}{' '}
                <Text className="text-[12px] font-bold" style={{ color: accent }}>
                  +{m.weight} %
                </Text>
              </Text>
            ))}
          </Card>
        ) : (
          <Card className="flex-row items-center gap-3">
            <Text className="text-[26px]">🏆</Text>
            <View className="flex-1">
              <Text variant="subheading">Profil complet à 100 %</Text>
              <Text variant="caption">Tu maximises tes chances de matcher.</Text>
            </View>
          </Card>
        )}

        <View className="flex-row flex-wrap gap-3">
          {statItems.map((item) => (
            <Stat key={item.label} label={item.label} value={item.value} loading={!s} />
          ))}
        </View>

        {about?.trim() ? (
          <Section title={mode === 'project' ? 'Le projet' : 'À propos'}>
            <Text variant="body">{about.trim()}</Text>
          </Section>
        ) : null}
        {tags?.length ? (
          <Section
            title={
              mode === 'talent' ? 'Compétences' : mode === 'project' ? 'Je recherche' : 'Secteurs'
            }>
            <TagList tags={tags} tone={mode === 'investor' ? 'investor' : mode} />
          </Section>
        ) : null}
        {links.length ? (
          <Section title="Mes liens">
            <LinksList links={links} />
          </Section>
        ) : null}

        <Card className="p-0">
          <ListRow
            icon={<Heart size={18} color={accent} />}
            title="Ils m'ont liké"
            onPress={() => router.push('/likes')}
          />
          <ListRow
            icon={<Inbox size={18} color={accent} />}
            title="Mises en relation"
            onPress={() => router.push('/demandes')}
          />
          {me.is_admin ? (
            <ListRow
              icon={<ShieldCheck size={18} color={accent} />}
              title="Modération"
              onPress={() => router.push('/moderation')}
            />
          ) : null}
          <ListRow
            icon={<Settings size={18} color={accent} />}
            title="Paramètres"
            onPress={() => router.push('/parametres')}
            last
          />
        </Card>
      </View>

      <Sheet
        visible={preview}
        onClose={() => setPreview(false)}
        title="Comment les autres me voient">
        <View className="px-5 pb-4" style={{ height: 520 }}>
          <ProfileCard
            card={myDeckCard(me, mode)}
            mode={mode === 'project' ? 'talent' : 'project'}
            showScore={false}
          />
        </View>
        <Text variant="caption" className="px-5 pb-2 text-center">
          Aperçu de ta carte dans le swipe{' '}
          {mode === 'project' ? 'des talents et investisseurs' : 'des porteurs de projet'}.
        </Text>
      </Sheet>
    </Screen>
  );
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}): ReactNode {
  return (
    <View className="min-w-[30%] flex-1 gap-1 rounded-card border border-line/10 bg-card p-3.5">
      {loading ? (
        <Skeleton width={32} height={24} />
      ) : (
        <Text className="text-[24px] font-black tracking-tight text-text">{value ?? 0}</Text>
      )}
      <Text variant="caption" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
