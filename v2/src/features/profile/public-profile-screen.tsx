import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ban, ChevronLeft, Flag, MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LinksList } from '@/components/app/links-list';
import { PageHead } from '@/components/app/page-head';
import { Section, TagList } from '@/components/app/tag-list';
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  Gradient,
  IconButton,
  ListRow,
  Logo,
  Screen,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';
import { placeLabel } from '@/constants/places';
import { COLLAB_MODES, HOURS, WORK_MODES } from '@/constants/profile-options';
import { useMe } from '@/features/me/api';
import {
  useBlockUser,
  useCancelContact,
  useRespondContact,
  useUnblockUser,
} from '@/features/social/api';
import { ReportSheet } from '@/features/social/report-sheet';
import { useMatchDetails } from '@/features/swipe/api';
import { confirm } from '@/lib/confirm';
import { humanError } from '@/lib/errors';
import { activityLabel, fullName, ticketLabel } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import type { Mode, ProfileLink, PublicProfile } from '@/types/app';

import { usePublicProfile } from './api';
import { ContactSheet } from './contact-sheet';

/** Which of my modes scores a profile shown in `tab` (null: no score for that pair). */
function scoringMode(tab: Mode, myModes: Mode[], active: Mode): Mode | null {
  if (tab === 'talent') return myModes.includes('project') ? 'project' : null;
  if (tab === 'project') {
    if (active === 'talent' || active === 'investor')
      return myModes.includes(active) ? active : null;
    return myModes.includes('talent') ? 'talent' : myModes.includes('investor') ? 'investor' : null;
  }
  return null;
}

export function PublicProfileScreen({
  userId,
  initialMode,
}: {
  userId: string;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const { palette } = useTheme();
  const { data: me } = useMe();
  const profileQuery = usePublicProfile(userId);
  const data = profileQuery.data;
  const [tab, setTab] = useState<Mode | null>(initialMode ?? null);
  const [contact, setContact] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const respond = useRespondContact();
  const cancel = useCancelContact();
  const block = useBlockUser();
  const unblock = useUnblockUser();

  const modes = data ? MODE_ORDER.filter((m) => data.modes.includes(m)) : [];
  const current: Mode | null =
    tab && modes.includes(tab)
      ? tab
      : (modes.find((m) => m === data?.profile.active_mode) ?? modes[0] ?? null);
  const myModes = me?.modes ?? [];
  const activeMine = (me?.profile.active_mode as Mode | undefined) ?? 'talent';
  const scoreMode =
    current && session && data && !data.viewer?.is_me
      ? scoringMode(current, myModes, activeMine)
      : null;
  const details = useMatchDetails(scoreMode ? userId : undefined, scoreMode ?? undefined);

  const back = () =>
    router.canGoBack() ? router.back() : router.replace(session ? '/explorer' : '/');

  if (profileQuery.isPending) {
    return (
      <Screen>
        <View className="gap-4 p-5">
          <Skeleton height={160} radius={24} />
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={16} />
          <Skeleton height={90} radius={20} />
        </View>
      </Screen>
    );
  }
  if (!data || profileQuery.isError) {
    return (
      <Screen>
        <PageHead title="Profil introuvable" noindex />
        <EmptyState
          emoji="🫥"
          title="Profil introuvable"
          text="Ce profil n'existe plus ou n'est pas disponible."
          actionLabel={session ? 'Explorer la communauté' : 'Découvrir Projet X'}
          onAction={() => router.replace(session ? '/explorer' : '/')}
        />
      </Screen>
    );
  }

  const p = data.profile;
  const name = fullName(p.first_name, p.last_name);
  const viewer = data.viewer;
  const cover = current === 'project' ? data.project?.cover_url : null;
  const cfg = MODES[current ?? 'talent'];
  const place = placeLabel(p.city);
  const active = activityLabel(p.last_active_at);
  const headline =
    current === 'project' && data.project?.project_name
      ? data.project.project_name
      : current === 'talent'
        ? data.talent?.statut
        : current === 'investor'
          ? data.investor?.statut
          : null;

  const onBlock = async () => {
    setMenu(false);
    const ok = await confirm({
      title: `Bloquer ${name} ?`,
      message: 'Vous ne pourrez plus vous voir ni vous écrire.',
      confirmLabel: 'Bloquer',
      destructive: true,
    });
    if (!ok) return;
    block.mutate(userId, {
      onSuccess: () => toast.show({ title: `${name} est bloqué·e` }),
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    });
  };

  const respondTo = (accept: boolean) => {
    if (!viewer?.contact_request_id) return;
    respond.mutate(
      { requestId: viewer.contact_request_id, accept },
      {
        onSuccess: (result) => {
          if (accept && result.match_id)
            router.push({ pathname: '/chat/[id]', params: { id: result.match_id } });
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <PageHead
        title={headline ? `${name} · ${headline}` : name}
        description={
          (current === 'project'
            ? data.project?.description
            : current === 'investor'
              ? data.investor?.bio
              : data.talent?.bio) || undefined
        }
        noindex
      />
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        {session ? (
          <IconButton
            icon={<ChevronLeft size={22} color={palette.text} />}
            accessibilityLabel="Retour"
            onPress={back}
          />
        ) : (
          <Logo size={26} />
        )}
        {session && viewer && !viewer.is_me ? (
          <IconButton
            icon={<MoreVertical size={20} color={palette.text} />}
            accessibilityLabel="Options"
            onPress={() => setMenu(true)}
          />
        ) : null}
      </View>

      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View className="mx-5 overflow-hidden rounded-card">
          {cover ? (
            <Image
              source={{ uri: imageUrl(cover, 560) }}
              style={{ height: 150 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Gradient colors={cfg.gradient} style={{ height: 150 }} />
          )}
        </View>
        <View className="-mt-12 items-center gap-2 px-5">
          <Avatar
            uri={p.avatar_url}
            firstName={p.first_name}
            lastName={p.last_name}
            size={96}
            gradient={cfg.gradient}
            ring={palette.bg}
          />
          <Text variant="title" className="text-center">
            {name}
            {p.age ? `, ${p.age}` : ''}
          </Text>
          {headline ? (
            <Text variant="subheading" className="text-center text-muted">
              {headline}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1">
            {p.school ? <Text variant="caption">🎓 {p.school}</Text> : null}
            {place ? <Text variant="caption">📍 {place}</Text> : null}
            {active ? (
              <Text className="text-[12px] font-semibold text-success">● {active}</Text>
            ) : null}
            {p.is_pro ? <Text className="text-[12px] font-bold text-investor-fg">PRO</Text> : null}
          </View>
        </View>

        {modes.length > 1 ? (
          <View className="flex-row justify-center gap-2 px-5 pt-4">
            {modes.map((m) => (
              <Chip
                key={m}
                label={MODES[m].short}
                emoji={MODES[m].emoji}
                tone={m}
                selected={current === m}
                onPress={() => setTab(m)}
                size="sm"
              />
            ))}
          </View>
        ) : null}

        <View className="gap-6 px-5 pt-5">
          {scoreMode && details.data ? (
            <View className="gap-1.5 rounded-card border border-success/25 bg-success/10 p-4">
              <Text className="text-[18px] font-black text-text">
                {details.data.score} % compatible avec toi
              </Text>
              {details.data.reasons.map((r) => (
                <Text key={r} className="text-[13px] font-semibold text-success">
                  ✓ {r}
                </Text>
              ))}
            </View>
          ) : null}
          {current ? <ModeSection data={data} mode={current} /> : null}
        </View>
      </ScrollView>

      <View className="gap-2 border-t border-line/10 px-5 pb-2 pt-3">
        {!session ? (
          <Button
            title={`Rejoins Projet X pour contacter ${p.first_name ?? name}`}
            href="/signup"
          />
        ) : viewer?.is_me ? (
          <Button
            title="Modifier mon profil"
            variant="secondary"
            onPress={() => router.push('/profil/modifier')}
          />
        ) : viewer?.blocked ? (
          <Button
            title="Débloquer"
            variant="outline"
            loading={unblock.isPending}
            onPress={() =>
              unblock.mutate(userId, {
                onError: (e) => toast.show({ title: humanError(e), tone: 'error' }),
              })
            }
          />
        ) : viewer?.match_id ? (
          <Button
            title="Envoyer un message"
            gradient={cfg.gradient}
            onPress={() =>
              router.push({ pathname: '/chat/[id]', params: { id: viewer.match_id! } })
            }
          />
        ) : viewer?.contact_status === 'received' ? (
          <View className="flex-row gap-3">
            <Button
              title="Refuser"
              variant="outline"
              className="flex-1"
              loading={respond.isPending}
              onPress={() => respondTo(false)}
            />
            <Button
              title="Accepter"
              className="flex-1"
              loading={respond.isPending}
              onPress={() => respondTo(true)}
            />
          </View>
        ) : viewer?.contact_status === 'sent' ? (
          <Button
            title="Demande envoyée · Annuler"
            variant="secondary"
            loading={cancel.isPending}
            onPress={() => viewer.contact_request_id && cancel.mutate(viewer.contact_request_id)}
          />
        ) : myModes.length > 0 ? (
          <Button
            testID="request-contact"
            title="Demander une mise en relation"
            gradient={cfg.gradient}
            onPress={() => setContact(true)}
          />
        ) : null}
      </View>

      {session && viewer && !viewer.is_me ? (
        <>
          <ContactSheet
            visible={contact}
            onClose={() => setContact(false)}
            userId={userId}
            name={p.first_name ?? name}
            myModes={myModes}
            defaultMode={myModes.includes(activeMine) ? activeMine : (myModes[0] ?? 'talent')}
          />
          <Sheet visible={menu} onClose={() => setMenu(false)}>
            <View className="px-2 pb-2">
              <ListRow
                icon={<Flag size={18} color={palette.danger} />}
                title="Signaler"
                danger
                onPress={() => {
                  setMenu(false);
                  setReporting(true);
                }}
              />
              <ListRow
                icon={<Ban size={18} color={palette.danger} />}
                title={`Bloquer ${name}`}
                danger
                onPress={() => void onBlock()}
                last
              />
            </View>
          </Sheet>
          <ReportSheet
            visible={reporting}
            onClose={() => setReporting(false)}
            userId={userId}
            name={name}
            onDone={(blocked) => blocked && back()}
          />
        </>
      ) : null}
    </Screen>
  );
}

function Collab({ modes }: { modes: string[] | null | undefined }) {
  const items = (modes ?? [])
    .map((id) => COLLAB_MODES.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  if (items.length === 0) return null;
  return (
    <Section title="Modes de collaboration">
      {items.map((c) => (
        <Text key={c.id} variant="body">
          {c.emoji} {c.label}
        </Text>
      ))}
    </Section>
  );
}

function ModeSection({ data, mode }: { data: PublicProfile; mode: Mode }) {
  if (mode === 'talent' && data.talent) {
    const t = data.talent;
    const hours = HOURS.find((h) => h.id === t.hours_per_week);
    return (
      <>
        {t.bio?.trim() ? (
          <Section title="À propos">
            <Text variant="body">{t.bio.trim()}</Text>
          </Section>
        ) : null}
        {t.skills.length ? (
          <Section title="Compétences">
            <TagList tags={t.skills} tone="talent" />
          </Section>
        ) : null}
        {hours ? (
          <Section title="Disponibilité">
            <Text variant="body">
              {hours.emoji} {hours.label}
            </Text>
          </Section>
        ) : null}
        <Collab modes={t.collab_modes} />
        {Array.isArray(t.links) && t.links.length ? (
          <Section title="Liens">
            <LinksList links={t.links as unknown as ProfileLink[]} />
          </Section>
        ) : null}
      </>
    );
  }
  if (mode === 'project' && data.project) {
    const pp = data.project;
    const work = WORK_MODES.find((w) => w.id === pp.work_mode);
    return (
      <>
        <Section title="Le projet">
          <Text className="text-[20px] font-black text-text">
            {pp.project_name || 'Projet sans nom'}
          </Text>
          {pp.stage ? <Text variant="caption">🎯 {pp.stage}</Text> : null}
          {pp.description?.trim() ? <Text variant="body">{pp.description.trim()}</Text> : null}
        </Section>
        {pp.needs.length ? (
          <Section title="Recherche">
            <TagList tags={pp.needs} tone="project" />
          </Section>
        ) : null}
        {pp.sectors.length ? (
          <Section title="Secteurs">
            <TagList tags={pp.sectors} tone="investor" />
          </Section>
        ) : null}
        {work || pp.team_size || pp.budget?.trim() || pp.equity?.trim() ? (
          <Section title="Conditions">
            {work ? (
              <Text variant="body">
                {work.emoji} {work.label}
              </Text>
            ) : null}
            {pp.team_size ? <Text variant="body">👥 Équipe de {pp.team_size}</Text> : null}
            {pp.budget?.trim() ? <Text variant="body">💶 {pp.budget.trim()}</Text> : null}
            {pp.equity?.trim() ? <Text variant="body">💎 {pp.equity.trim()}</Text> : null}
          </Section>
        ) : null}
        <Collab modes={pp.collab_modes} />
        {pp.founder_bio?.trim() ? (
          <Section title="Le fondateur">
            <Text variant="body">{pp.founder_bio.trim()}</Text>
          </Section>
        ) : null}
        {Array.isArray(pp.links) && pp.links.length ? (
          <Section title="Liens">
            <LinksList links={pp.links as unknown as ProfileLink[]} />
          </Section>
        ) : null}
      </>
    );
  }
  if (mode === 'investor' && data.investor) {
    const i = data.investor;
    const ticket = ticketLabel(i.ticket_min, i.ticket_max);
    return (
      <>
        {i.bio?.trim() ? (
          <Section title="À propos">
            <Text variant="body">{i.bio.trim()}</Text>
          </Section>
        ) : null}
        {i.thesis?.trim() ? (
          <Section title="Thèse d'investissement">
            <Text variant="body">{i.thesis.trim()}</Text>
          </Section>
        ) : null}
        {i.sectors.length ? (
          <Section title="Secteurs">
            <TagList tags={i.sectors} tone="investor" />
          </Section>
        ) : null}
        {i.preferred_stages.length ? (
          <Section title="Stades">
            <TagList tags={i.preferred_stages} tone="project" />
          </Section>
        ) : null}
        {ticket ? (
          <Section title="Ticket">
            <Text variant="body">💰 {ticket}</Text>
          </Section>
        ) : null}
        {Array.isArray(i.links) && i.links.length ? (
          <Section title="Liens">
            <LinksList links={i.links as unknown as ProfileLink[]} />
          </Section>
        ) : null}
      </>
    );
  }
  return (
    <Text variant="body" className="text-muted">
      Ce profil n'est pas encore complété.
    </Text>
  );
}
