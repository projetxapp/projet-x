import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button, Logo, Screen, Text } from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';

const PITCH = {
  talent: {
    title: 'Tu as un talent ?',
    text: 'Rejoins des projets ambitieux et décroche des missions rémunérées.',
  },
  project: {
    title: 'Tu as un projet ?',
    text: "Trouve les talents qu'il te faut et tes premiers investisseurs.",
  },
  investor: {
    title: 'Tu veux investir ?',
    text: 'Repère les pépites de demain avant tout le monde.',
  },
} as const;

export function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']} contentClassName="flex-1 justify-center px-7">
      <Animated.View entering={FadeInUp.duration(400)} className="mb-9 items-center gap-3">
        <Logo size={76} withName={false} />
        <Text variant="display" className="mt-2">
          Projet X
        </Text>
        <Text variant="body" className="text-muted">
          Le Tinder de l'entrepreneuriat
        </Text>
      </Animated.View>

      <View className="mb-9 gap-2.5">
        {MODE_ORDER.map((mode, i) => (
          <Animated.View key={mode} entering={FadeInUp.delay(120 + i * 80).duration(400)}>
            <View className="flex-row items-start gap-3.5 rounded-2xl border border-line/10 bg-surface px-4 py-3.5">
              <Text className="text-[22px]">{MODES[mode].emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="text-[14px] font-bold text-text">{PITCH[mode].title}</Text>
                <Text variant="caption">{PITCH[mode].text}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(400).duration(400)} className="gap-2.5">
        <Button
          testID="cta-signup"
          title="Créer mon profil gratuitement"
          onPress={() => router.push('/signup')}
        />
        <Button
          testID="cta-login"
          title="J'ai déjà un compte"
          variant="outline"
          onPress={() => router.push('/login')}
        />
      </Animated.View>

      <Text variant="caption" className="mt-5 text-center">
        En continuant, tu acceptes nos{' '}
        <Link href="/cgu" className="text-talent-fg">
          CGU
        </Link>{' '}
        et notre{' '}
        <Link href="/confidentialite" className="text-talent-fg">
          politique de confidentialité
        </Link>
      </Text>
    </Screen>
  );
}
