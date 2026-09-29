import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { env } from './env';

/** Where auth emails / OAuth send the user back. */
export function webUrl(path: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `${window.location.origin}${path}`;
  return `${env.siteUrl}${path}`;
}

/** Deep link back into the native app (projetx://…), or the web URL on web. */
export function appUrl(path: string): string {
  return Platform.OS === 'web' ? webUrl(path) : Linking.createURL(path);
}

/** Parses both `?a=b` and `#a=b` parameters of a URL. */
export function urlParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const [beforeHash, hash] = url.split('#');
  const query = beforeHash?.split('?')[1];
  for (const part of [query, hash]) {
    if (!part) continue;
    new URLSearchParams(part).forEach((value, key) => params.set(key, value));
  }
  return params;
}
