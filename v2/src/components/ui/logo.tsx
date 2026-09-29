import { View } from 'react-native';

import { Gradient } from './gradient';
import { Text } from './text';

type Props = { size?: number; withName?: boolean; colors?: readonly [string, string] };

/** ✦ in a rounded gradient square + "Projet X". */
export function Logo({ size = 28, withName = true, colors }: Props) {
  return (
    <View
      className="flex-row items-center gap-2"
      accessibilityRole="image"
      accessibilityLabel="Projet X">
      <Gradient
        colors={colors}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          className="font-black text-white"
          style={{ fontSize: size * 0.48, lineHeight: size * 0.62 }}>
          ✦
        </Text>
      </Gradient>
      {withName ? (
        <Text className="font-black tracking-tight text-text" style={{ fontSize: size * 0.62 }}>
          Projet X
        </Text>
      ) : null}
    </View>
  );
}
