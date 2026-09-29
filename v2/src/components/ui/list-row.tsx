import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/providers/theme-provider';

import { Text } from './text';

type Props = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  last?: boolean;
  accessibilityHint?: string;
};

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
  last,
  accessibilityHint,
}: Props) {
  const { palette } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      className={cn('flex-row items-center gap-3 px-4 py-3.5', !last && 'border-b border-line/10')}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {icon ? (
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface">{icon}</View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-[15px] font-semibold', danger ? 'text-danger-fg' : 'text-text')}>
          {title}
        </Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      {right ??
        (onPress ? (
          <ChevronRight size={18} color={danger ? palette.danger : palette.hint} />
        ) : null)}
    </Pressable>
  );
}
