import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';

import { PageHead } from '@/components/app/page-head';
import { IconButton, Logo, Screen, Text } from '@/components/ui';
import { CONTACT_EMAIL } from '@/constants/brand';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';

import { LEGAL_UPDATED_AT, type LegalSection } from './content';

type Props = { title: string; description: string; sections: LegalSection[] };

/** CGU / Confidentialité — public, indexable, readable signed out (App Store requirement). */
export function LegalScreen({ title, description, sections }: Props) {
  const router = useRouter();
  const { palette } = useTheme();
  const { session } = useAuth();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHead title={title} description={description} />
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <IconButton
          icon={<ChevronLeft size={22} color={palette.text} />}
          accessibilityLabel="Retour"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(session ? '/parametres' : '/')
          }
        />
        <Logo size={24} />
      </View>
      <View className="gap-4 px-5">
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="caption">Dernière mise à jour : {LEGAL_UPDATED_AT}</Text>
        {sections.map((s) => (
          <View key={s.title} className="gap-2 rounded-card border border-line/10 bg-card p-4">
            <Text level={2} className="text-[15px] font-bold text-talent-fg">
              {s.title}
            </Text>
            <Text variant="body" className="text-muted">
              {s.body}
            </Text>
          </View>
        ))}
        <Text variant="caption" className="pb-4 text-center">
          Une question ? {CONTACT_EMAIL}
        </Text>
      </View>
    </Screen>
  );
}
