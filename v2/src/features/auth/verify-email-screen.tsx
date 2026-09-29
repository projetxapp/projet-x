import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Logo, Screen, Text } from '@/components/ui';
import { webUrl } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { pendingSignup } from './pending';

export function VerifyEmailScreen() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const confirmed = async () => {
    const credentials = pendingSignup.get();
    if (!credentials || credentials.email !== email) {
      router.replace({ pathname: '/login', params: { email } });
      return;
    }
    setChecking(true);
    const { error } = await supabase.auth.signInWithPassword(credentials);
    setChecking(false);
    if (error) {
      setMessage({
        text: /not confirmed/i.test(error.message)
          ? "Ton email n'est pas encore confirmé. Clique sur le lien reçu 📬"
          : humanError(error),
        ok: false,
      });
      return;
    }
    pendingSignup.clear();
  };

  const resend = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: webUrl('/confirm') },
    });
    if (error) setMessage({ text: humanError(error), ok: false });
    else {
      setMessage({ text: 'Email renvoyé ✓ Pense à vérifier tes spams.', ok: true });
      setCooldown(60);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      contentClassName="flex-1 items-center justify-center gap-4 px-8">
      <Logo size={68} withName={false} />
      <Text className="mt-2 text-[52px]">📧</Text>
      <Text variant="title" className="text-center">
        Vérifie ton email
      </Text>
      <Text variant="body" className="text-center text-muted">
        On a envoyé un lien de confirmation à
      </Text>
      <Text className="text-[16px] font-bold text-talent-fg">{email}</Text>
      <View className="w-full rounded-2xl border border-talent/25 bg-talent/10 px-5 py-4">
        <Text className="text-center text-[13px] leading-[20px] text-muted">
          Clique sur le lien dans l'email pour activer ton compte. Il peut mettre une minute à
          arriver — vérifie aussi tes spams.
        </Text>
      </View>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          className={`text-center text-[13px] font-semibold ${message.ok ? 'text-success' : 'text-danger-fg'}`}>
          {message.text}
        </Text>
      ) : null}
      <Button
        title="J'ai confirmé → Me connecter"
        loading={checking}
        onPress={() => void confirmed()}
        className="w-full"
      />
      <Button
        title={cooldown > 0 ? `Renvoyer l'email (${cooldown} s)` : "Renvoyer l'email"}
        variant="ghost"
        size="md"
        disabled={cooldown > 0}
        onPress={() => void resend()}
      />
      <Button
        title="Mauvaise adresse ? Recommencer"
        variant="ghost"
        size="sm"
        onPress={() => router.replace('/signup')}
      />
    </Screen>
  );
}
