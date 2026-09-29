const { jest } = require('@jest/globals');

// Supabase env for modules that read it at import time (never hits the network in unit tests).
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_test';

// lucide ships .mjs only; icons are irrelevant in unit tests.
jest.mock(
  'lucide-react-native',
  () => new Proxy({}, { get: (_target, name) => (name === '__esModule' ? true : () => null) }),
);

// NativeWind's runtime needs the compiled CSS (darkMode: 'class') to switch schemes.
jest.mock('nativewind', () => ({
  ...jest.requireActual('nativewind'),
  useColorScheme: () => ({
    colorScheme: 'dark',
    setColorScheme: () => undefined,
    toggleColorScheme: () => undefined,
  }),
}));
