import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { MODES } from '@/constants/modes';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { Mode } from '@/types/app';

import { Text } from './text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  /** Mode whose colors are used when selected. */
  tone?: Mode;
  size?: 'sm' | 'md';
  emoji?: string;
  accessibilityLabel?: string;
};

export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  tone = 'talent',
  size = 'md',
  emoji,
  accessibilityLabel,
}: Props) {
  const { scheme, palette } = useTheme();
  const base = MODES[tone].color;
  const fg = modeTextColor(tone, scheme);
  const textSize = size === 'md' ? 'text-[13px]' : 'text-[11px]';

  const body = (
    <View
      className={cn(
        'flex-row items-center gap-1.5 rounded-chip border',
        size === 'md' ? 'px-3.5 py-2' : 'px-2.5 py-1',
        !selected && 'border-line/10 bg-surface',
      )}
      style={selected ? { backgroundColor: `${base}26`, borderColor: `${base}66` } : undefined}>
      {emoji ? <Text className={textSize}>{emoji}</Text> : null}
      <Text
        className={cn(textSize, 'font-semibold', !selected && 'text-muted')}
        style={selected ? { color: fg } : undefined}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${label}`}
          hitSlop={8}
          onPress={() => {
            haptics.selection();
            onRemove();
          }}>
          <X size={14} color={selected ? fg : palette.muted} />
        </Pressable>
      ) : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}>
      {body}
    </Pressable>
  );
}
