import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { Button, Text, useToast } from '@/components/ui';
import { humanError } from '@/lib/errors';
import { useTheme } from '@/providers/theme-provider';

import { signInWithProvider, socialProviders, type SocialProvider } from '../social';

/** "Continuer avec Apple / Google" — shown only once the providers are configured. */
export function SocialButtons({ onSignedIn }: { onSignedIn?: () => void }) {
  const toast = useToast();
  const { scheme } = useTheme();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const providers = socialProviders();
  if (providers.length === 0) return null;

  const run = async (provider: SocialProvider) => {
    setBusy(provider);
    try {
      if (await signInWithProvider(provider)) onSignedIn?.();
    } catch (error) {
      toast.show({
        title: humanError(error, 'Connexion impossible pour le moment.'),
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-line/10" />
        <Text variant="caption">ou</Text>
        <View className="h-px flex-1 bg-line/10" />
      </View>
      {providers.includes('apple') ? (
        Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={16}
            style={{ height: 52 }}
            onPress={() => void run('apple')}
          />
        ) : (
          <Button
            title="Continuer avec Apple"
            variant="secondary"
            loading={busy === 'apple'}
            onPress={() => void run('apple')}
          />
        )
      ) : null}
      {providers.includes('google') ? (
        <Button
          title="Continuer avec Google"
          variant="secondary"
          loading={busy === 'google'}
          onPress={() => void run('google')}
        />
      ) : null}
    </View>
  );
}
