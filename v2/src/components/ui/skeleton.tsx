import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  className?: string;
};

/** Pulsing placeholder — used everywhere instead of full-screen spinners. */
export function Skeleton({ width = '100%', height = 16, radius = 10, className }: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    if (!reduced) opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn('bg-surface', className)}
      style={[{ width, height, borderRadius: radius }, style]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <Skeleton width={48} height={48} radius={24} />
      <View className="flex-1 gap-2">
        <Skeleton width="55%" height={14} />
        <Skeleton width="80%" height={12} />
      </View>
    </View>
  );
}
