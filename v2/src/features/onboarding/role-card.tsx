import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Gradient, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { Mode } from '@/types/app';

export function RoleCard({
  mode,
  selected,
  onPress,
}: {
  mode: Mode;
  selected: boolean;
  onPress: () => void;
}) {
  const cfg = MODES[mode];
  const { scheme } = useTheme();
  return (
    <Pressable
      testID={`role-${mode}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${cfg.label} : ${cfg.desc}`}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      className={cn(
        'flex-row items-center gap-3.5 rounded-card border-2 p-4',
        !selected && 'border-line/10 bg-surface',
      )}
      style={({ pressed }) => [
        selected ? { borderColor: `${cfg.color}99`, backgroundColor: `${cfg.color}14` } : null,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      {selected ? (
        <Gradient
          colors={cfg.gradient}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text className="text-[22px]">{cfg.emoji}</Text>
        </Gradient>
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-line/5">
          <Text className="text-[22px]">{cfg.emoji}</Text>
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text
          className="text-[16px] font-extrabold"
          style={{ color: selected ? modeTextColor(mode, scheme) : undefined }}>
          {cfg.label}
        </Text>
        <Text variant="caption">{cfg.desc}</Text>
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border-2',
          !selected && 'border-line/20',
        )}
        style={selected ? { backgroundColor: cfg.color, borderColor: cfg.color } : undefined}>
        {selected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
