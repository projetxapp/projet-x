import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Gradient, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { placeLabel } from '@/constants/places';
import { COLLAB_MODES, HOURS, STAGES } from '@/constants/profile-options';
import { activityLabel, fullName, initials } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { DeckCard, Mode } from '@/types/app';

/** What kind of profile a card shows: projects for talents & investors, talents for projects. */
export function targetKind(viewerMode: Mode): 'talent' | 'project' {
  return viewerMode === 'project' ? 'talent' : 'project';
}

export function cardTitle(card: DeckCard, kind: 'talent' | 'project'): string {
  if (kind === 'project' && card.project_name?.trim()) return card.project_name.trim();
  const name = fullName(card.first_name, card.last_name);
  return card.age ? `${name}, ${card.age}` : name;
}

export function cardSubtitle(card: DeckCard, kind: 'talent' | 'project'): string {
  if (kind === 'project') {
    const founder = fullName(card.first_name, card.last_name);
    return [card.sectors?.[0], `par ${founder}`].filter(Boolean).join(' · ');
  }
  return [card.statut, card.school].filter(Boolean).join(' · ');
}

type Props = {
  card: DeckCard;
  /** The viewer's mode (decides whether the card is read as a project or a talent). */
  mode: Mode;
  /** Hidden for the "how others see me" preview. */
  showScore?: boolean;
  compact?: boolean;
};

/** Swipe card: big media, name, real score + reasons, key tags. */
export function ProfileCard({ card, mode, showScore = true, compact = false }: Props) {
  const { scheme } = useTheme();
  const kind = targetKind(mode);
  const targetMode: Mode = kind === 'project' ? 'project' : 'talent';
  const cfg = MODES[targetMode];
  const accent = modeTextColor(targetMode, scheme);
  const media = kind === 'project' ? (card.cover_url ?? card.avatar_url) : card.avatar_url;
  const tags = (kind === 'project' ? card.needs : card.skills) ?? [];
  const text = kind === 'project' ? card.description : card.bio;
  const place = placeLabel(card.city);
  const hours = HOURS.find((h) => h.id === card.hours_per_week);
  const stage = STAGES.find((s) => s.id === card.stage);
  const active = activityLabel(card.last_active_at);
  const collab = (card.collab_modes ?? [])
    .map((id) => COLLAB_MODES.find((c) => c.id === id))
    .filter((c) => c !== undefined);

  return (
    <View className="flex-1 overflow-hidden rounded-[28px] border border-line/10 bg-card">
      <View style={{ flex: compact ? 1 : 1.2 }}>
        {media ? (
          <Image
            source={{ uri: imageUrl(media, 600) }}
            style={{ position: 'absolute', inset: 0 }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
            recyclingKey={media}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Gradient
            colors={cfg.gradient}
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text className="text-[72px] font-black text-white/90">
              {kind === 'project' ? '🚀' : initials(card.first_name, card.last_name)}
            </Text>
          </Gradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(8,7,15,0.82)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
        />
        <View className="absolute left-3 right-3 top-3 flex-row items-start justify-between">
          {showScore ? (
            <View
              accessibilityLabel={`${card.score} % de compatibilité`}
              className="rounded-full bg-black/45 px-3 py-1.5">
              <Text className="text-[13px] font-black text-white">{card.score} % compatible</Text>
            </View>
          ) : (
            <View />
          )}
          <View className="items-end gap-1.5">
            {stage ? (
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: `${stage.color}E6` }}>
                <Text className="text-[11px] font-extrabold text-white">{stage.label}</Text>
              </View>
            ) : null}
            {card.is_pro ? (
              <View className="rounded-full bg-investor px-2.5 py-1">
                <Text className="text-[11px] font-extrabold text-white">PRO</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View className="absolute bottom-3 left-4 right-4 gap-0.5">
          <Text className="text-[26px] font-black tracking-tight text-white" numberOfLines={1}>
            {cardTitle(card, kind)}
          </Text>
          <Text className="text-[14px] font-semibold text-white/85" numberOfLines={1}>
            {cardSubtitle(card, kind)}
          </Text>
        </View>
      </View>

      <View className="flex-1 gap-2.5 p-4">
        {showScore && card.reasons.length > 0 ? (
          <View className="gap-1">
            {card.reasons.slice(0, compact ? 1 : 2).map((reason) => (
              <Text
                key={reason}
                className="text-[13px] font-semibold text-success"
                numberOfLines={1}>
                ✓ {reason}
              </Text>
            ))}
          </View>
        ) : null}
        {text?.trim() ? (
          <Text variant="body" className="text-muted" numberOfLines={compact ? 2 : 3}>
            {text.trim()}
          </Text>
        ) : null}
        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {kind === 'project' ? (
              <Text className="self-center text-[12px] font-semibold text-hint">Recherche :</Text>
            ) : null}
            {tags.slice(0, compact ? 3 : 5).map((tag) => (
              <View
                key={tag}
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: `${cfg.color}22` }}>
                <Text className="text-[12px] font-semibold" style={{ color: accent }}>
                  {tag}
                </Text>
              </View>
            ))}
            {tags.length > (compact ? 3 : 5) ? (
              <Text className="self-center text-[12px] text-hint">
                +{tags.length - (compact ? 3 : 5)}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View className="mt-auto flex-row flex-wrap gap-x-3 gap-y-1">
          {collab.map((c) => (
            <Text key={c.id} variant="caption">
              {c.emoji} {c.id}
            </Text>
          ))}
          {hours ? <Text variant="caption">⏱ {hours.label}</Text> : null}
          {place ? <Text variant="caption">📍 {place}</Text> : null}
          {active ? (
            <Text className="text-[12px] font-semibold text-success">● {active}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
