import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { BRAND_GRADIENT } from '@/constants/modes';

type Props = {
  colors?: readonly [string, string, ...string[]];
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Diagonal (default) or horizontal. */
  direction?: 'diagonal' | 'horizontal' | 'vertical';
};

const DIRECTIONS = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
} as const;

export function Gradient({
  colors = BRAND_GRADIENT,
  className,
  style,
  children,
  direction = 'diagonal',
}: Props) {
  return (
    <LinearGradient colors={colors} {...DIRECTIONS[direction]} className={className} style={style}>
      {children}
    </LinearGradient>
  );
}
