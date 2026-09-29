import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useMe } from '@/features/me/api';
import { useAppBootstrap } from '@/features/me/use-app-bootstrap';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';

/** Signed-in area: auth guard, onboarding guard, push registration. */
export default function AppLayout() {
  const { session, initialized } = useAuth();
  const pathname = usePathname();
  const { palette } = useTheme();
  const { data: me } = useMe();
  useAppBootstrap();

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6D28D9" />
      </View>
    );
  }
  if (!session) return <Redirect href={{ pathname: '/login', params: { next: pathname } }} />;
  if (me && !me.profile.onboarding_completed) return <Redirect href="/onboarding" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
