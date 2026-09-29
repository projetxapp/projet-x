import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { kv } from './storage';
import { supabase } from './supabase';

const TOKEN_KEY = 'px-push-token';

Notifications.setNotificationHandler({
  // In the foreground the realtime channel already shows an in-app toast.
  handleNotification: async () => ({
    shouldShowBanner: AppState.currentState !== 'active',
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function getPushPermission(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === 'web') return Notifications.PermissionStatus.DENIED;
  return (await Notifications.getPermissionsAsync()).status;
}

/**
 * Asks for permission (if `ask`), gets the Expo push token and stores it server-side.
 * Returns the token, or null (web, simulator, denied, EAS project not configured yet).
 */
export async function registerForPush(ask: boolean): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Projet X',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#6D28D9',
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && ask) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const id = projectId();
  if (!id) return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  if (error) throw error;
  kv.setItem(TOKEN_KEY, token);
  return token;
}

/** Forgets this device's token (sign-out): no push for the next account on this phone. */
export async function unregisterPush(): Promise<void> {
  const token = kv.getItem(TOKEN_KEY);
  if (!token) return;
  await supabase.rpc('unregister_push_token', { p_token: token });
  kv.removeItem(TOKEN_KEY);
}

export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.setBadgeCountAsync(count).catch(() => undefined);
}

/** Tap on a push notification → callback with its data (also handles cold starts). */
export function onNotificationTap(callback: (data: Record<string, unknown>) => void): () => void {
  if (Platform.OS === 'web') return () => undefined;
  let cancelled = false;
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!cancelled && response) callback(response.notification.request.content.data ?? {});
  });
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data ?? {});
  });
  return () => {
    cancelled = true;
    sub.remove();
  };
}
