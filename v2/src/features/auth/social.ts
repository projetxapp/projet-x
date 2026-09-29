import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { appUrl, urlParams, webUrl } from '@/lib/auth-links';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'apple' | 'google';

export function socialProviders(): SocialProvider[] {
  const providers: SocialProvider[] = [];
  if (env.authApple) providers.push('apple');
  if (env.authGoogle) providers.push('google');
  return providers;
}

/** Applies the tokens found in an OAuth redirect URL (implicit flow `#access_token`, or `?code=`). */
export async function sessionFromUrl(url: string): Promise<boolean> {
  const params = urlParams(url);
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error(error);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setError) throw setError;
    return true;
  }
  const code = params.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }
  return false;
}

async function signInWithAppleNative(): Promise<boolean> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple ne nous a pas renvoyé de jeton.');
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  // Apple only shares the name on the very first sign-in: keep it.
  const first = credential.fullName?.givenName;
  const last = credential.fullName?.familyName;
  if (data.user && (first || last)) {
    await supabase
      .from('profiles')
      .update({ ...(first ? { first_name: first } : {}), ...(last ? { last_name: last } : {}) })
      .eq('id', data.user.id);
  }
  return true;
}

/**
 * Social sign-in. iOS uses the native Sign in with Apple sheet; everything else goes
 * through Supabase OAuth (in-app browser on mobile, redirect on web).
 * Returns true when a session was created (false if the user cancelled).
 */
export async function signInWithProvider(provider: SocialProvider): Promise<boolean> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    try {
      return await signInWithAppleNative();
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
      throw error;
    }
  }

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: webUrl('/auth/callback') },
    });
    if (error) throw error;
    return false; // the browser navigates away
  }

  const redirectTo = appUrl('/auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;
  return sessionFromUrl(result.url);
}
