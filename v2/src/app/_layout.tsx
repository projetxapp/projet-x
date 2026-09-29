import '@/global.css';
import '@/lib/interop';

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { initMonitoring, withMonitoring } from '@/lib/sentry';
import { AppProviders } from '@/providers/app-providers';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';

initMonitoring();
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootStack() {
  const { initialized } = useAuth();
  const { scheme, palette } = useTheme();

  useEffect(() => {
    if (initialized) SplashScreen.hideAsync().catch(() => undefined);
  }, [initialized]);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.bg,
        card: palette.card,
        text: palette.text,
        border: palette.line,
        primary: '#6D28D9',
      },
    };
  }, [scheme, palette]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}
      />
    </NavigationThemeProvider>
  );
}

function RootLayout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}

export default withMonitoring(RootLayout);
