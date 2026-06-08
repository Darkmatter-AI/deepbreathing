// The app's main screen IS the web-parity breathing experience, rendered as an
// Expo DOM component (WebView on native, plain DOM on web) so it is 1:1 with the
// branded website by construction. This native host bridges device locale, theme,
// app-background -> audio-suspend, and sets up the audio session.
//
// The earlier native StyleSheet/Reanimated re-implementation (src/breathing/*,
// components/breathing/*) is retired by this — kept in-repo for reference only.

import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Localization from 'expo-localization';
import { setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import BreathingExperienceDom from '../components/breathing-web/BreathingExperience.dom';

// Native haptics bridge — the DOM component's navigator.vibrate is a no-op in the
// iOS WKWebView, so it emits an onEvent('haptic', {phase}) that we map to expo-haptics.
const fireHaptic = (phase: unknown) => {
  switch (phase) {
    case 'Inhale':
    case 'Inhale (Top up)':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      break;
    case 'Hold In':
    case 'Hold Out':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
        130,
      );
      break;
    case 'Exhale':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      break;
    default:
      break;
  }
};

const toBreathingAppState = (status: AppStateStatus): 'active' | 'background' =>
  status === 'active' ? 'active' : 'background';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';

  const [appState, setAppState] = useState<'active' | 'background'>(
    toBreathingAppState(AppState.currentState),
  );

  // Best-effort audio session setup on mount (so cues play with the ringer off).
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          allowsRecording: false,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch {
        // Non-fatal — audio degrades gracefully.
      }
    })();
  }, []);

  // Bridge native foreground/background so the DOM component suspends/resumes audio.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppState(toBreathingAppState(next));
    });
    return () => sub.remove();
  }, []);

  // Match the native safe-area backdrop to the experience's --background token
  // (light: cream 32 72% 97%, dark: warm 20 34% 10%) so there's no black strip.
  const backdrop = theme === 'light' ? '#fdf8f2' : '#221711';

  return (
    <View style={[styles.container, { backgroundColor: backdrop }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <BreathingExperienceDom
          dom={{ style: { flex: 1 } }}
          locale={locale}
          forcedTheme={theme}
          appState={appState}
          onSessionComplete={async (_seconds) => {}}
          onEvent={async (name, params) => {
            if (name === 'haptic') fireHaptic((params as { phase?: unknown })?.phase);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
});
