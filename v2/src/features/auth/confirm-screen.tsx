import type { EmailOtpType } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';

import { Button, Logo, Screen, Text } from '@/components/ui';
import { urlParams } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { sessionFromUrl } from './social';
import { useIncomingUrl } from './use-incoming-url';

type Status =
  | { kind: 'loading' }
  | { kind: 'success'; emailChange: boolean }
  | { kind: 'error'; message: string };

const OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'signup',
  'magiclink',
  'email_change',
  'invite',
  'recovery',
]);

/**
 * /confirm — handles every link format (token_hash, ?code=, #access_token, existing session)
 * and always ends up signed in as the account the link belongs to (v1 bug: another account).
 */
export function ConfirmScreen() {
  const router = useRouter();
  const url = useIncomingUrl();
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    void (async () => {
      try {
        const params = urlParams(url);
        const linkError = params.get('error_description') ?? params.get('error');
        if (linkError) throw new Error(linkError);

        const tokenHash = params.get('token_hash');
        const type = params.get('type') as EmailOtpType | null;
        const hasTokens = Boolean(tokenHash || params.get('access_token') || params.get('code'));

        // A link always wins over whatever session this browser/device already has.
        if (hasTokens) {
          const { data } = await supabase.auth.getSession();
          if (data.session && type !== 'email_change')
            await supabase.auth.signOut({ scope: 'local' });
        }

        if (tokenHash && type && OTP_TYPES.has(type)) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (!(await sessionFromUrl(url))) {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error('Email link is invalid or has expired');
        }

        if (Platform.OS === 'web' && typeof window !== 'undefined')
          window.history.replaceState(null, '', '/confirm');
        setStatus({ kind: 'success', emailChange: type === 'email_change' });
      } catch (error) {
        setStatus({
          kind: 'error',
          message: humanError(error, 'Ce lien est invalide ou a expiré.'),
        });
      }
    })();
  }, [url]);

  useEffect(() => {
    if (status.kind !== 'success' || Platform.OS !== 'web') return;
    const timer = setTimeout(() => router.replace('/home'), 1800);
    return () => clearTimeout(timer);
  }, [status, router]);

  const mobileBrowser =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    /iphone|ipad|android/i.test(navigator.userAgent);

  return (
    <Screen
      edges={['top', 'bottom']}
      contentClassName="flex-1 items-center justify-center gap-4 px-8">
      <Logo size={68} withName={false} />
      {status.kind === 'loading' ? (
        <>
          <ActivityIndicator size="large" color="#6D28D9" className="mt-6" />
          <Text variant="heading">Confirmation en cours…</Text>
        </>
      ) : null}
      {status.kind === 'success' ? (
        <>
          <Text className="mt-4 text-[52px]">✅</Text>
          <Text variant="title" className="text-center">
            {status.emailChange ? 'Adresse email mise à jour !' : 'Email confirmé !'}
          </Text>
          <Text variant="body" className="text-center text-muted">
            {status.emailChange
              ? 'Ta nouvelle adresse est active.'
              : 'Bienvenue dans Projet X ⚡ Ton compte est actif.'}
          </Text>
          <View className="mt-4 w-full gap-2.5">
            <Button title="Continuer →" onPress={() => router.replace('/home')} />
            {mobileBrowser ? (
              <Button
                title="Ouvrir l'application"
                variant="outline"
                onPress={() => void Linking.openURL('projetx://home')}
              />
            ) : null}
          </View>
        </>
      ) : null}
      {status.kind === 'error' ? (
        <>
          <Text className="mt-4 text-[52px]">⏳</Text>
          <Text variant="title" className="text-center">
            Lien invalide ou expiré
          </Text>
          <Text variant="body" className="text-center text-muted">
            {status.message}
          </Text>
          <View className="mt-4 w-full gap-2.5">
            <Button title="Me connecter" onPress={() => router.replace('/login')} />
            <Button
              title="Retour à l'accueil"
              variant="ghost"
              onPress={() => router.replace('/')}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
