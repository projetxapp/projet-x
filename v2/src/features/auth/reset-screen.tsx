import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, KeyboardScroll, Screen, Text, TextField } from '@/components/ui';
import { webUrl } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { AuthHeader } from './components/auth-header';

const schema = z.object({ email: z.string().trim().pipe(z.email('Adresse email invalide')) });

export function ResetScreen() {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    const address = email.toLowerCase();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: webUrl('/update-password'),
    });
    if (resetError) setError(humanError(resetError));
    else setSentTo(address);
  });

  if (sentTo) {
    return (
      <Screen
        edges={['top', 'bottom']}
        contentClassName="flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-[52px]">📧</Text>
        <Text variant="title">Email envoyé !</Text>
        <Text variant="body" className="text-center text-muted">
          Si un compte existe pour <Text className="font-bold text-talent-fg">{sentTo}</Text>, tu
          vas recevoir un lien pour choisir un nouveau mot de passe.
        </Text>
        <Button
          title="Retour à la connexion"
          onPress={() => router.replace('/login')}
          className="mt-4 w-full"
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AuthHeader
        title="Mot de passe oublié ?"
        subtitle="On t'envoie un lien de réinitialisation"
      />
      <KeyboardScroll contentContainerClassName="gap-4 px-6 pt-2">
        {error ? (
          <View className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
            <Text className="text-[13px] font-semibold text-danger-fg">⚠️ {error}</Text>
          </View>
        ) : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="ton@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onSubmitEditing={() => void onSubmit()}
              error={fieldState.error?.message}
            />
          )}
        />
        <Button
          title="Envoyer le lien →"
          loading={form.formState.isSubmitting}
          onPress={() => void onSubmit()}
        />
      </KeyboardScroll>
    </Screen>
  );
}
