import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Card({ children, className, onPress, accessibilityLabel }: Props) {
  const classes = cn('rounded-card border border-line/10 bg-card p-4', className);
  if (!onPress) return <View className={classes}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={classes}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      {children}
    </Pressable>
  );
}
