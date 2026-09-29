import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { Mode } from '@/types/app';

/** Read-only tags (skills, needs, sectors) tinted with a mode color. */
export function TagList({
  tags,
  tone,
  highlight,
}: {
  tags: string[] | null | undefined;
  tone: Mode;
  highlight?: string[];
}) {
  const { scheme } = useTheme();
  if (!tags?.length) return null;
  const color = MODES[tone].color;
  const fg = modeTextColor(tone, scheme);
  const shared = new Set((highlight ?? []).map((t) => t.toLowerCase()));
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => {
        const match = shared.has(tag.toLowerCase());
        return (
          <View
            key={tag}
            className="rounded-full px-3 py-1.5"
            style={{
              backgroundColor: match ? `${color}40` : `${color}1F`,
              borderWidth: match ? 1 : 0,
              borderColor: fg,
            }}>
            <Text className="text-[13px] font-semibold" style={{ color: fg }}>
              {match ? '✓ ' : ''}
              {tag}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Small titled section used on profile sheets and pages. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="overline">{title}</Text>
      {children}
    </View>
  );
}
