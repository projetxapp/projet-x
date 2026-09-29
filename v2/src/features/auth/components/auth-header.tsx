import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';

type Props = { title: string; subtitle?: string; onBack?: () => void };

export function AuthHeader({ title, subtitle, onBack }: Props) {
  const router = useRouter();
  const { palette } = useTheme();
  return (
    <View className="flex-row items-center gap-3 px-6 pb-4 pt-4">
      <IconButton
        accessibilityLabel="Retour"
        icon={<ArrowLeft size={18} color={palette.muted} />}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      />
      <View className="flex-1">
        <Text variant="heading">{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
