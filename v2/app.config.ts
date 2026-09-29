import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic layer on top of app.json.
 * Only public values end up here (URL + publishable key are meant to ship in the client).
 * Secrets (Sentry auth token, service role key, ...) must stay in EAS / Vercel / Supabase secrets.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';
  const easProjectId = process.env.EAS_PROJECT_ID;
  const sentryOrg = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;

  const plugins = [...(config.plugins ?? [])];
  if (sentryOrg && sentryProject) {
    plugins.push([
      '@sentry/react-native/expo',
      { organization: sentryOrg, project: sentryProject, url: 'https://sentry.io/' },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'Projet X',
    slug: config.slug ?? 'projet-x',
    plugins,
    runtimeVersion: { policy: 'appVersion' },
    ...(easProjectId
      ? {
          updates: {
            url: `https://u.expo.dev/${easProjectId}`,
            checkAutomatically: 'ON_LOAD',
            fallbackToCacheTimeout: 0,
          },
        }
      : {}),
    extra: {
      ...config.extra,
      supabaseUrl,
      supabaseKey,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  };
};
