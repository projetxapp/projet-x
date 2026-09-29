import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { PageHead } from '@/components/app/page-head';
import { LandingScreen } from '@/features/landing/landing-screen';
import { useAuth } from '@/providers/auth-provider';

/** Web: landing page (statically rendered). Mobile: straight to the app or the welcome screen. */
export default function Index() {
  const { session, initialized } = useAuth();
  if (Platform.OS === 'web') {
    if (initialized && session) return <Redirect href="/home" />;
    return (
      <>
        <PageHead path="/" />
        <LandingScreen />
      </>
    );
  }
  if (!initialized) return null;
  return <Redirect href={session ? '/home' : '/welcome'} />;
}
