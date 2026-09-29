import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { placeLabel } from '@/constants/places';
import { activityLabel } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { SearchResult } from '@/types/app';

export const ResultCard = memo(function ResultCard({
  result: r,
  onPress,
}: {
  result: SearchResult;
  onPress: (r: SearchResult) => void;
}) {
  const { scheme } = useTheme();
  const cfg = MODES[r.mode];
  const accent = modeTextColor(r.mode, scheme);
  const place = placeLabel(r.city);
  const active = activityLabel(r.last_active_at);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.name}, ${cfg.label}`}
      onPress={() => onPress(r)}
      className="mx-5 mb-3 flex-row gap-3.5 rounded-card border border-line/10 bg-card p-3.5 active:opacity-80">
      {r.mode === 'project' && r.cover_url ? (
        <Image
          source={{ uri: imageUrl(r.cover_url, 64) }}
          style={{ width: 64, height: 64, borderRadius: 16 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Avatar
          uri={r.avatar_url}
          firstName={r.first_name}
          lastName={r.last_name}
          size={64}
          gradient={cfg.gradient}
        />
      )}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text variant="subheading" className="flex-1" numberOfLines={1}>
            {r.name}
          </Text>
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${cfg.color}26` }}>
            <Text className="text-[11px] font-bold" style={{ color: accent }}>
              {cfg.emoji} {cfg.short}
            </Text>
          </View>
        </View>
        {r.subtitle ? (
          <Text variant="caption" numberOfLines={1}>
            {r.subtitle}
          </Text>
        ) : null}
        {r.tags.length > 0 ? (
          <Text className="text-[13px] font-medium" style={{ color: accent }} numberOfLines={1}>
            {r.tags.slice(0, 4).join(' · ')}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-x-3">
          {r.stage ? <Text variant="caption">🎯 {r.stage}</Text> : null}
          {place ? <Text variant="caption">📍 {place}</Text> : null}
          {active ? (
            <Text className="text-[12px] font-semibold text-success">● {active}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
