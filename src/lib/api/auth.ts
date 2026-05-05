import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  return supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
  });
}

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'recipeorganizer' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (error || !data.url) return { data: null, error: error ?? new Error('No URL') };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type === 'success') {
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (code) {
      return supabase.auth.exchangeCodeForSession(code);
    }
  }

  return { data: null, error: new Error('OAuth cancelled') };
}
