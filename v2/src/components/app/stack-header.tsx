import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Defaults to going back, or to the home tab when there is no history (deep link, web). */
  onBack?: () => void;
};

/** Header of pushed (non-tab) screens: back button, title, optional action. */
export function StackHeader({ title, subtitle, right, onBack }: Props) {
  const router = useRouter();
  const { palette } = useTheme();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
      <IconButton
        icon={<ChevronLeft size={22} color={palette.text} />}
        accessibilityLabel="Retour"
        onPress={back}
      />
      <View className="flex-1">
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
