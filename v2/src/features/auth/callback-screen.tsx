import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { humanError } from '@/lib/errors';

import { sessionFromUrl } from './social';
import { useIncomingUrl } from './use-incoming-url';

/** OAuth redirect target (Google / Apple on web, deep link fallback on mobile). */
export function AuthCallbackScreen() {
  const router = useRouter();
  const url = useIncomingUrl();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    sessionFromUrl(url)
      .then((ok) => (ok ? router.replace('/home') : setError('Connexion annulée.')))
      .catch((e: unknown) => setError(humanError(e)));
  }, [url, router]);

  return (
    <Screen
      edges={['top', 'bottom']}
      contentClassName="flex-1 items-center justify-center gap-4 px-8">
      {error ? (
        <>
          <Text variant="heading" className="text-center">
            {error}
          </Text>
          <Button title="Retour à la connexion" onPress={() => router.replace('/login')} />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text variant="body" className="text-muted">
            Connexion en cours…
          </Text>
        </>
      )}
    </Screen>
  );
}
