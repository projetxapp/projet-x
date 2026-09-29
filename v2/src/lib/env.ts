import Constants from 'expo-constants';

type Extra = { supabaseUrl?: string; supabaseKey?: string; sentryDsn?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** Public runtime configuration (EXPO_PUBLIC_* are inlined at build time). */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || extra.supabaseKey || '',
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL || 'https://projetx.app',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || extra.sentryDsn || '',
  authGoogle: process.env.EXPO_PUBLIC_AUTH_GOOGLE === '1',
  authApple: process.env.EXPO_PUBLIC_AUTH_APPLE === '1',
  imageTransforms: process.env.EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORMS === '1',
} as const;
