import { Stack, useRouter } from 'expo-router';

import { Button, Logo, Screen, Text } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { PageHead } from '@/components/app/page-head';

export default function NotFound() {
  const router = useRouter();
  const { session } = useAuth();
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <PageHead title="Page introuvable" noindex />
      <Screen
        edges={['top', 'bottom']}
        contentClassName="flex-1 items-center justify-center gap-3 px-8">
        <Logo size={68} withName={false} />
        <Text className="mt-4 text-[72px] font-black tracking-tightest text-talent">404</Text>
        <Text variant="title" className="text-center">
          Page introuvable
        </Text>
        <Text variant="body" className="mb-6 text-center text-muted">
          Cette page n'existe pas ou a été déplacée. Pas de panique, la suite est par ici 👇
        </Text>
        <Button
          title={session ? "Retour à l'accueil" : 'Découvrir Projet X'}
          onPress={() => router.replace(session ? '/home' : '/')}
          className="w-full"
        />
        {!session ? (
          <Button
            title="Se connecter"
            variant="outline"
            onPress={() => router.replace('/login')}
            className="w-full"
          />
        ) : null}
      </Screen>
    </>
  );
}
