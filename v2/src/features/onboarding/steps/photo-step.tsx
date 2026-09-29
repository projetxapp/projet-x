import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Gradient, Text, useToast } from '@/components/ui';
import { compressImage, pickImage, type PickedImage } from '@/lib/images';
import { humanError } from '@/lib/errors';

type Props = {
  value: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
  existingUrl?: string | null;
  onSkip: () => void;
};

export function PhotoStep({ value, onChange, existingUrl, onSkip }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const preview = value?.uri ?? existingUrl ?? null;

  const choose = async () => {
    setLoading(true);
    try {
      const picked = await pickImage({ aspect: [1, 1] });
      if (picked) onChange(await compressImage(picked, 720));
    } catch (error) {
      toast.show({
        title: humanError(error, error instanceof Error ? error.message : undefined),
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="items-center gap-6 pt-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choisir une photo de profil"
        onPress={() => void choose()}>
        {preview ? (
          <Image
            source={{ uri: preview }}
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              borderWidth: 3,
              borderColor: '#6D28D9',
            }}
            contentFit="cover"
          />
        ) : (
          <Gradient
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 16px 48px rgba(109,40,217,0.4)',
            }}>
            <Camera size={44} color="#FFFFFF" />
            <Text className="mt-1 text-[12px] font-semibold text-white/80">Ajouter</Text>
          </Gradient>
        )}
      </Pressable>
      <View className="items-center gap-2 px-4">
        <Text variant="subheading" className="text-center">
          {preview ? '✅ Super photo !' : 'Ajoute ta photo de profil'}
        </Text>
        <Text variant="body" className="text-center text-muted">
          {preview
            ? 'Tu feras une excellente première impression 🔥'
            : 'Les profils avec photo matchent beaucoup plus. Tu peux aussi en ajouter une plus tard.'}
        </Text>
      </View>
      <Button
        title={preview ? '🔄 Changer la photo' : '📷 Choisir une photo'}
        variant={preview ? 'secondary' : 'primary'}
        size="md"
        loading={loading}
        onPress={() => void choose()}
        className="self-stretch"
      />
      {!preview ? (
        <Button title="Passer pour l'instant →" variant="ghost" size="sm" onPress={onSkip} />
      ) : null}
    </View>
  );
}
