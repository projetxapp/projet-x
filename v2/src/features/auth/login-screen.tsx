import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, KeyboardScroll, Screen, Text, TextField } from '@/components/ui';
import { webUrl } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

import { AuthHeader } from './components/auth-header';
import { SocialButtons } from './components/social-buttons';

const schema = z.object({
  email: z.string().trim().pipe(z.email('Adresse email invalide')),
  password: z.string().min(1, 'Ton mot de passe est requis'),
});
type Values = z.infer<typeof schema>;

export function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resent, setResent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.email ?? '', password: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setError(null);
    setUnconfirmed(false);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    if (signInError) {
      haptics.warning();
      setUnconfirmed(/not confirmed/i.test(signInError.message));
      setError(humanError(signInError));
      return;
    }
    haptics.success();
    // The (auth) layout redirects to the app as soon as the session exists.
  });

  const resend = async () => {
    const email = form.getValues('email').trim().toLowerCase();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: webUrl('/confirm') },
    });
    if (resendError) setError(humanError(resendError));
    else setResent(true);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AuthHeader title="Bon retour 👋" subtitle="Connecte-toi à ton compte" />
      <KeyboardScroll contentContainerClassName="gap-4 px-6 pb-10 pt-2">
        {error ? (
          <View
            accessibilityLiveRegion="polite"
            className="gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
            <Text className="text-[13px] font-semibold text-danger-fg">⚠️ {error}</Text>
            {unconfirmed ? (
              resent ? (
                <Text className="text-[12px] text-success">
                  Email renvoyé ✓ Vérifie ta boîte (et tes spams).
                </Text>
              ) : (
                <Button
                  title="Renvoyer l'email de confirmation"
                  variant="outline"
                  size="sm"
                  onPress={() => void resend()}
                />
              )
            ) : null}
          </View>
        ) : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              testID="login-email"
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="ton@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              testID="login-password"
              label="Mot de passe"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void onSubmit()}
              error={fieldState.error?.message}
            />
          )}
        />
        <Link href="/reset" className="self-end text-[14px] font-semibold text-talent-fg">
          Mot de passe oublié ?
        </Link>
        <Button
          testID="login-submit"
          title="Se connecter →"
          loading={form.formState.isSubmitting}
          onPress={() => void onSubmit()}
        />
        <SocialButtons />
        <View className="mt-2 flex-row justify-center gap-1">
          <Text variant="caption">Pas encore de compte ?</Text>
          <Text
            className="text-[12px] font-bold text-talent-fg"
            accessibilityRole="link"
            onPress={() => router.replace('/signup')}>
            Créer mon profil
          </Text>
        </View>
      </KeyboardScroll>
    </Screen>
  );
}
