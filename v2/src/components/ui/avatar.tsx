import { Image } from 'expo-image';
import { View } from 'react-native';

import { BRAND_GRADIENT } from '@/constants/modes';
import { initials } from '@/lib/format';
import { imageUrl } from '@/lib/images';

import { Gradient } from './gradient';
import { Text } from './text';

type Props = {
  uri?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
  gradient?: readonly [string, string];
  ring?: string;
  online?: boolean;
};

export function Avatar({
  uri,
  firstName,
  lastName,
  size = 44,
  gradient = BRAND_GRADIENT,
  ring,
  online,
}: Props) {
  const radius = size / 2;
  const label = `Photo de ${[firstName, lastName].filter(Boolean).join(' ') || 'profil'}`;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}>
      {uri ? (
        <Image
          source={{ uri: imageUrl(uri, size) }}
          style={{ width: '100%', height: '100%', borderRadius: radius }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={uri}
        />
      ) : (
        <Gradient
          colors={gradient}
          style={{ flex: 1, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="font-black text-white" style={{ fontSize: Math.max(12, size * 0.36) }}>
            {initials(firstName, lastName)}
          </Text>
        </Gradient>
      )}
      {online ? (
        <View
          className="absolute rounded-full border-2 border-bg bg-success"
          style={{ width: size * 0.28, height: size * 0.28, right: 0, bottom: 0 }}
        />
      ) : null}
    </View>
  );
}
