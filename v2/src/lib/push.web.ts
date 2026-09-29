// Web: in-app notifications + realtime only (no Web Push in v2).
export async function getPushPermission(): Promise<'denied'> {
  return 'denied';
}
export async function registerForPush(_ask: boolean): Promise<string | null> {
  return null;
}
export async function unregisterPush(): Promise<void> {}
export async function setBadgeCount(_count: number): Promise<void> {}
export function onNotificationTap(_callback: (data: Record<string, unknown>) => void): () => void {
  return () => undefined;
}
