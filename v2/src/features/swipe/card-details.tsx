import { ScrollView, View } from 'react-native';

import { LinksList } from '@/components/app/links-list';
import { Section, TagList } from '@/components/app/tag-list';
import { Avatar, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { placeLabel } from '@/constants/places';
import { COLLAB_MODES, HOURS, WORK_MODES } from '@/constants/profile-options';
import { activityLabel, fullName } from '@/lib/format';
import type { DeckCard, Mode } from '@/types/app';

import { targetKind } from './profile-card';

/** Everything about a deck card (bottom sheet opened with ℹ️ or a tap on the card). */
export function CardDetails({
  card,
  mode,
  myTags,
}: {
  card: DeckCard;
  mode: Mode;
  myTags?: string[];
}) {
  const kind = targetKind(mode);
  const tone: Mode = kind === 'project' ? 'project' : 'talent';
  const hours = HOURS.find((h) => h.id === card.hours_per_week);
  const work = WORK_MODES.find((w) => w.id === card.work_mode);
  const collab = (card.collab_modes ?? [])
    .map((id) => COLLAB_MODES.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const place = placeLabel(card.city);
  const active = activityLabel(card.last_active_at);
  const name = fullName(card.first_name, card.last_name);

  return (
    <ScrollView
      contentContainerClassName="gap-5 px-5 pb-6 pt-2"
      showsVerticalScrollIndicator={false}>
      <View className="gap-2 rounded-card border border-success/25 bg-success/10 p-4">
        <Text className="text-[22px] font-black text-text">{card.score} % compatible</Text>
        {card.reasons.length > 0 ? (
          card.reasons.map((reason) => (
            <Text key={reason} className="text-[14px] font-semibold text-success">
              ✓ {reason}
            </Text>
          ))
        ) : (
          <Text variant="caption">Complète ton profil pour affiner le score.</Text>
        )}
      </View>

      {kind === 'project' ? (
        <>
          <Section title="Le projet">
            <Text className="text-[22px] font-black tracking-tight text-text">
              {card.project_name || 'Projet sans nom'}
            </Text>
            {card.description?.trim() ? (
              <Text variant="body">{card.description.trim()}</Text>
            ) : null}
          </Section>
          {card.needs?.length ? (
            <Section title="Compétences recherchées">
              <TagList tags={card.needs} tone="project" highlight={myTags} />
            </Section>
          ) : null}
          {card.sectors?.length ? (
            <Section title="Secteurs">
              <TagList tags={card.sectors} tone="investor" highlight={myTags} />
            </Section>
          ) : null}
          <Section title="Conditions">
            <View className="gap-1.5">
              {card.stage ? <Text variant="body">🎯 Stade : {card.stage}</Text> : null}
              {work ? (
                <Text variant="body">
                  {work.emoji} {work.label}
                </Text>
              ) : null}
              {card.team_size ? <Text variant="body">👥 Équipe de {card.team_size}</Text> : null}
              {card.budget?.trim() ? (
                <Text variant="body">💶 Budget : {card.budget.trim()}</Text>
              ) : null}
              {card.equity?.trim() ? (
                <Text variant="body">💎 Equity : {card.equity.trim()}</Text>
              ) : null}
            </View>
          </Section>
          <Section title="Porté par">
            <View className="flex-row items-center gap-3">
              <Avatar
                uri={card.avatar_url}
                firstName={card.first_name}
                lastName={card.last_name}
                gradient={MODES.project.gradient}
              />
              <View className="flex-1">
                <Text variant="subheading">
                  {name}
                  {card.age ? `, ${card.age} ans` : ''}
                </Text>
                <Text variant="caption">
                  {[card.statut, card.school].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            {card.founder_bio?.trim() ? (
              <Text variant="body" className="text-muted">
                {card.founder_bio.trim()}
              </Text>
            ) : null}
          </Section>
        </>
      ) : (
        <>
          <Section title="Profil">
            <Text className="text-[22px] font-black tracking-tight text-text">
              {name}
              {card.age ? `, ${card.age} ans` : ''}
            </Text>
            <Text variant="caption">{[card.statut, card.school].filter(Boolean).join(' · ')}</Text>
            {card.bio?.trim() ? <Text variant="body">{card.bio.trim()}</Text> : null}
          </Section>
          {card.skills?.length ? (
            <Section title="Compétences">
              <TagList tags={card.skills} tone="talent" highlight={myTags} />
            </Section>
          ) : null}
          {hours ? (
            <Section title="Disponibilité">
              <Text variant="body">
                {hours.emoji} {hours.label} — {hours.desc}
              </Text>
            </Section>
          ) : null}
        </>
      )}

      {collab.length > 0 ? (
        <Section title="Modes de collaboration">
          <View className="gap-1.5">
            {collab.map((c) => (
              <Text key={c.id} variant="body">
                {c.emoji} {c.label} <Text variant="caption">— {c.desc}</Text>
              </Text>
            ))}
          </View>
        </Section>
      ) : null}

      {place || active ? (
        <Section title="Infos">
          {place ? <Text variant="body">📍 {place}</Text> : null}
          {active ? (
            <Text className="text-[14px] font-semibold text-success">● {active}</Text>
          ) : null}
        </Section>
      ) : null}

      {card.links?.length ? (
        <Section title="Liens">
          <LinksList links={card.links} />
        </Section>
      ) : null}
      <View className="h-2" />
      <Text variant="caption" className="text-center">
        {tone === 'project' ? MODES.project.emoji : MODES.talent.emoji} Profil{' '}
        {tone === 'project' ? 'projet' : 'talent'}
      </Text>
    </ScrollView>
  );
}
