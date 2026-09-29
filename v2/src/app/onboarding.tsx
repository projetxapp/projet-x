import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { PageHead } from '@/components/app/page-head';
import { useMe } from '@/features/me/api';
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';
import { useAuth } from '@/providers/auth-provider';

/** For accounts created with Apple / Google (or unfinished v1 onboardings). */
export default function Onboarding() {
  const { session, initialized, signOut } = useAuth();
  const { data: me } = useMe();

  if (!initialized) return null;
  if (!session) return <Redirect href="/login" />;
  if (!me) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6D28D9" />
      </View>
    );
  }
  if (me.profile.onboarding_completed) return <Redirect href="/home" />;

  return (
    <>
      <PageHead title="Complète ton profil" noindex />
      <OnboardingFlow
        variant="complete"
        existingAvatar={me.profile.avatar_url}
        defaults={{
          firstName: me.profile.first_name ?? '',
          lastName: me.profile.last_name ?? '',
          age: me.profile.age ? String(me.profile.age) : '',
          city: me.profile.city,
          school: me.profile.school ?? '',
        }}
        onExit={() => void signOut()}
      />
    </>
  );
}
