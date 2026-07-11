import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { authClient } from './auth-client';

interface Props {
  theme: 'light' | 'dark';
  onAuthenticated?: () => void;
}

export default function AuthActions({ theme, onAuthenticated }: Props) {
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const [pending, setPending] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const continueWithApple = async () => {
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
      const result = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: credential.identityToken },
      });
      if (result.error) throw new Error(result.error.message ?? 'Apple sign-in failed');
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
    setPending('google');
    setError(null);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (result.error) throw new Error(result.error.message ?? 'Google sign-in failed');
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
          />
          {pending === 'apple' && (
            <View pointerEvents="none" style={styles.spinnerOverlay}>
              <ActivityIndicator color={dark ? '#15100d' : '#fff'} />
            </View>
          )}
        </View>
      )}

      <Pressable
        disabled={pending !== null}
        onPress={continueWithGoogle}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.googleButton,
          { borderColor: dark ? '#5a4538' : '#d8c0ad' },
          pressed && styles.pressed,
        ]}
      >
        {pending === 'google' ? (
          <ActivityIndicator color={dark ? '#f1dfce' : '#422a1c'} />
        ) : (
          <>
            <Text style={styles.googleMark}>G</Text>
            <Text style={[styles.googleLabel, { color: dark ? '#f1dfce' : '#422a1c' }]}>
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  googleMark: { color: '#4285f4', fontSize: 18, fontWeight: '700' },
  googleLabel: { fontSize: 16, fontWeight: '600' },
  error: { color: '#c85b4a', fontSize: 12, textAlign: 'center' },
});
