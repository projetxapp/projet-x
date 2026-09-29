import { View } from 'react-native';

import { Gradient } from './gradient';

export function ProgressBar({
  value,
  colors,
  height = 6,
}: {
  value: number;
  colors?: readonly [string, string];
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className="w-full overflow-hidden rounded-full bg-surface"
      style={{ height }}>
      <Gradient
        colors={colors}
        direction="horizontal"
        style={{ width: `${pct}%`, height: '100%', borderRadius: height }}
      />
    </View>
  );
}
