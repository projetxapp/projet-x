import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

import { env } from './env';

/** Crash reporting (native). Disabled when EXPO_PUBLIC_SENTRY_DSN is not set. */
export function initMonitoring(): void {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (env.sentryDsn) Sentry.captureException(error, context ? { extra: context } : undefined);
  else if (__DEV__) console.error(error, context);
}

export function withMonitoring(Component: ComponentType): ComponentType {
  return env.sentryDsn ? Sentry.wrap(Component) : Component;
}
