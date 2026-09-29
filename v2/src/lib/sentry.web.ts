import type { ComponentType } from 'react';

// Web: crash reporting is not wired yet (native crashes are the priority).
export function initMonitoring(): void {}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') console.error(error, context);
}

export function withMonitoring(Component: ComponentType): ComponentType {
  return Component;
}
