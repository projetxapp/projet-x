import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';
import { z } from 'zod';

import { Button, KeyboardScroll, Logo, Screen, Text, TextField } from '@/components/ui';
import { urlParams } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

import { sessionFromUrl } from './social';
import { useIncomingUrl } from './use-incoming-url';

const schema = z
  .object({
    password: z.string().min(8, '8 caractères minimum'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Les mots de passe ne correspondent pas',
  });

export function UpdatePasswordScreen() {
  const router = useRouter();
  const url = useIncomingUrl();
  const handled = useRef(false);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    void (async () => {
      try {
        const params = urlParams(url);
        const tokenHash = params.get('token_hash');
        if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (verifyError) throw verifyError;
        } else {
          await sessionFromUrl(url);
        }
        const { data } = await supabase.auth.getSession();
        setState(data.session ? 'ready' : 'invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [url]);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(humanError(updateError));
      return;
    }
    haptics.success();
    setState('done');
    setTimeout(() => router.replace('/home'), 1500);
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardScroll contentContainerClassName="flex-grow justify-center gap-4 px-7 py-10">
        <View className="items-center">
          <Logo size={68} withName={false} />
        </View>
        {state === 'checking' ? <ActivityIndicator size="large" color="#6D28D9" /> : null}
        {state === 'invalid' ? (
          <>
            <Text variant="title" className="text-center">
              Lien invalide ou expiré
            </Text>
            <Text variant="body" className="text-center text-muted">
              Demande un nouveau lien de réinitialisation.
            </Text>
            <Button title="Renvoyer un lien" onPress={() => router.replace('/reset')} />
          </>
        ) : null}
        {state === 'done' ? (
          <>
            <Text className="text-center text-[48px]">✅</Text>
            <Text variant="title" className="text-center">
              Mot de passe mis à jour !
            </Text>
          </>
        ) : null}
        {state === 'ready' ? (
          <>
            <Text variant="title">Nouveau mot de passe</Text>
            <Text variant="body" className="text-muted">
              Choisis un mot de passe solide (8 caractères minimum).
            </Text>
            {error ? (
              <Text className="text-[13px] font-semibold text-danger-fg">⚠️ {error}</Text>
            ) : null}
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField
                  label="Nouveau mot de passe"
                  value={field.value}
                  onChangeText={field.onChange}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="confirm"
              render={({ field, fieldState }) => (
                <TextField
                  label="Confirmation"
                  value={field.value}
                  onChangeText={field.onChange}
                  secureTextEntry
                  autoComplete="new-password"
                  onSubmitEditing={() => void onSubmit()}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button
              title="Mettre à jour →"
              loading={form.formState.isSubmitting}
              onPress={() => void onSubmit()}
            />
          </>
        ) : null}
      </KeyboardScroll>
    </Screen>
  );
}
