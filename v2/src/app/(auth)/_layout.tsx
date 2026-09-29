import { Redirect, Stack, useGlobalSearchParams, type Href } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

/** Signed-in users never see the auth screens (they go back where they wanted to go). */
export default function AuthLayout() {
  const { session, initialized } = useAuth();
  const { next } = useGlobalSearchParams<{ next?: string }>();
  if (initialized && session) {
    const target =
      typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
    return <Redirect href={target as Href} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
