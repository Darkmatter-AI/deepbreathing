import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';

import { authClient } from './auth-client';

const GOOGLE_G_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+CiAgPHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTIyLjU2IDEyLjI1YzAtLjc4LS4wNy0xLjUzLS4yLTIuMjVIMTJ2NC4yNmg1LjkyYTUuMDYgNS4wNiAwIDAgMS0yLjIgMy4zMnYyLjc3aDMuNTdjMi4wOC0xLjkyIDMuMjgtNC43NCAzLjI4LTguMXoiLz4KICA8cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMTIgMjNjMi45NyAwIDUuNDYtLjk4IDcuMjgtMi42NmwtMy41Ny0yLjc3Yy0uOTguNjYtMi4yMyAxLjA2LTMuNzEgMS4wNi0yLjg2IDAtNS4yOS0xLjkzLTYuMTYtNC41M0gyLjE4djIuODRDMy45OSAyMC41MyA3LjcgMjMgMTIgMjN6Ii8+CiAgPHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTUuODQgMTQuMDlBNi40IDYuNCAwIDAgMSA1LjQ5IDEyYzAtLjczLjEzLTEuNDMuMzUtMi4wOVY3LjA3SDIuMThBMTEgMTEgMCAwIDAgMSAxMmMwIDEuNzguNDMgMy40NSAxLjE4IDQuOTN6Ii8+CiAgPHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTEyIDUuMzhjMS42MiAwIDMuMDYuNTYgNC4yMSAxLjY0bDMuMTUtMy4xNUMxNy40NSAyLjA5IDE0Ljk3IDEgMTIgMSA3LjcgMSAzLjk5IDMuNDcgMi4xOCA3LjA3bDMuNjYgMi44NGMuODctMi42IDMuMy00LjUzIDYuMTYtNC41M3oiLz4KPC9zdmc+Cg==';

interface Props {
  theme: 'light' | 'dark';
  onAuthenticated?: () => void;
}

export default function AuthActions({ theme, onAuthenticated }: Props) {
  const [appleAvailable, setAppleAvailable] = useState(process.env.EXPO_OS === 'ios');
  const [pending, setPending] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (pending === 'apple') {
      AccessibilityInfo.announceForAccessibility('Signing in with Apple.');
    } else if (pending === 'google') {
      AccessibilityInfo.announceForAccessibility('Signing in with Google.');
    } else if (error) {
      AccessibilityInfo.announceForAccessibility(`Sign in failed. ${error}`);
    }
  }, [error, pending]);

  const continueWithApple = async () => {
    if (pending !== null) return;
    setPending('apple');
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token');
      if (!credential.authorizationCode) {
        throw new Error('Apple did not return an authorization code');
      }
      const result = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: credential.identityToken },
        // The server exchanges this one-time code for an Apple refresh token
        // before Better Auth persists the account. Keeping the exchange on the
        // server means the Apple private key never reaches the app bundle.
        additionalData: { authorizationCode: credential.authorizationCode },
      });
      if (result.error) throw new Error(result.error.message ?? 'Apple sign-in failed');
      AccessibilityInfo.announceForAccessibility('Signed in with Apple.');
      onAuthenticated?.();
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(caught instanceof Error ? caught.message : 'Apple sign-in failed');
      }
    } finally {
      setPending(null);
    }
  };

  const continueWithGoogle = async () => {
    if (pending !== null) return;
    setPending('google');
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (result.error) throw new Error(result.error.message ?? 'Google sign-in failed');
      AccessibilityInfo.announceForAccessibility('Signed in with Google.');
      onAuthenticated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-in failed');
    } finally {
      setPending(null);
    }
  };

  const dark = theme === 'dark';
  return (
    <View style={styles.stack}>
      {appleAvailable && (
        <View style={styles.buttonFrame}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              dark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={13}
            style={styles.appleButton}
            onPress={continueWithApple}
            accessible
            accessibilityRole="button"
            accessibilityLabel={pending === 'apple' ? 'Signing in with Apple' : 'Continue with Apple'}
            accessibilityHint="Uses your Apple ID to sync your practice"
            accessibilityState={{ disabled: pending !== null, busy: pending === 'apple' }}
          />
          {pending === 'apple' && (
            <View pointerEvents="none" style={styles.spinnerOverlay}>
              <ActivityIndicator color={dark ? '#15100d' : '#fff'} accessibilityLabel="Signing in with Apple" />
            </View>
          )}
        </View>
      )}

      <Pressable
        disabled={pending !== null}
        onPress={continueWithGoogle}
        accessibilityRole="button"
        accessibilityLabel={pending === 'google' ? 'Signing in with Google' : 'Continue with Google'}
        accessibilityHint="Uses your Google account to sync your practice"
        accessibilityState={{ disabled: pending !== null, busy: pending === 'google' }}
        style={({ pressed }) => [
          styles.googleButton,
          { borderColor: dark ? '#5a4538' : '#d8c0ad' },
          pressed && styles.pressed,
        ]}
      >
        {pending === 'google' ? (
          <ActivityIndicator color={dark ? '#f1dfce' : '#422a1c'} accessibilityLabel="Signing in with Google" />
        ) : (
          <>
            <Image
              source={GOOGLE_G_ICON}
              style={styles.googleIcon}
              contentFit="contain"
              alt="Google"
            />
            <Text style={[styles.googleLabel, { color: dark ? '#f1dfce' : '#422a1c' }]}>
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
      {pending ? (
        <Text style={[styles.status, { color: dark ? '#b9957c' : '#8e6b53' }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {pending === 'apple' ? 'Signing in with Apple…' : 'Signing in with Google…'}
        </Text>
      ) : null}
      {error ? <Text style={[styles.error, { color: dark ? '#f0a08c' : '#9f352b' }]} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10, width: '100%' },
  buttonFrame: { height: 50, position: 'relative' },
  appleButton: { width: '100%', height: 50 },
  spinnerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    height: 50,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.72 },
  googleIcon: { width: 20, height: 20 },
  googleLabel: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12, textAlign: 'center' },
  error: { fontSize: 12, textAlign: 'center' },
});
