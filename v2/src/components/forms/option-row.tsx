import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';

type Props = {
  title: string;
  desc?: string;
  emoji?: string;
  dotColor?: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  multiple?: boolean;
};

/** Selectable row (availability, stage, ticket…) with a radio/checkbox. */
export function OptionRow({
  title,
  desc,
  emoji,
  dotColor,
  selected,
  onPress,
  color = '#6D28D9',
  multiple = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selected } : { selected }}
      accessibilityLabel={desc ? `${title}, ${desc}` : title}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      className={cn(
        'flex-row items-center gap-3 rounded-field border-[1.5px] px-3.5 py-3',
        !selected && 'border-line/10 bg-surface',
      )}
      style={({ pressed }) => [
        selected ? { borderColor: `${color}80`, backgroundColor: `${color}1A` } : null,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      {emoji ? <Text className="text-[20px]">{emoji}</Text> : null}
      {dotColor ? (
        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
      ) : null}
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-text">{title}</Text>
        {desc ? <Text variant="caption">{desc}</Text> : null}
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center border-2',
          multiple ? 'rounded-md' : 'rounded-full',
          !selected && 'border-line/20',
        )}
        style={selected ? { backgroundColor: color, borderColor: color } : undefined}>
        {selected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
