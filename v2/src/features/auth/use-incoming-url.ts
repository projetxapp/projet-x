import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** Full URL that opened the screen (query + #hash), on web and native. */
export function useIncomingUrl(): string | null {
  const nativeUrl = Linking.useLinkingURL();
  if (Platform.OS === 'web') return typeof window === 'undefined' ? null : window.location.href;
  return nativeUrl;
}
