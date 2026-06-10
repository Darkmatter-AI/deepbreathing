// The app's main screen IS the web-parity breathing experience, rendered as an
// Expo DOM component (WebView on native, plain DOM on web) so it is 1:1 with the
// branded website by construction. This native host bridges device locale, theme,
// app-background -> audio-suspend, and sets up the audio session.
//
// The earlier native StyleSheet/Reanimated re-implementation (src/breathing/*,
// components/breathing/*) is retired by this — kept in-repo for reference only.

import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Localization from 'expo-localization';
import { setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import BreathingExperienceDom from '../components/breathing-web/BreathingExperience.dom';
import {
  loadPersistedSnapshot,
  mirrorPersist,
  type ResonancePersistedSnapshot,
} from '../breathing/resonance-mirror';

// Scopes the screen-awake lock to an active session so it releases on pause/stop.
const KEEP_AWAKE_TAG = 'breathing-session';

// Native haptics bridge — the DOM component's navigator.vibrate is a no-op in the
// iOS WKWebView, so it emits onEvent('haptic', {phase}) and we map each breath
// phase to a single, calm expo-haptics tap: a light cue to begin the inhale, a
// gentle marker at the hold, and a slightly firmer "grounding" tap on the exhale.
// (The earlier mapping used Heavy on the exhale + a setTimeout double-buzz on the
// holds — both read as alerts, too jarring for a calming app.)
// NOTE: the simulator produces no haptics, so the *feel* is unverified — confirm
// the intensities on a real device (see docs/expo-attempt-2-progress.md).
const fireHaptic = (phase: unknown) => {
  switch (phase) {
    case 'Inhale':
    case 'Inhale (Top up)':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      break;
    case 'Hold In':
    case 'Hold Out':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      break;
    case 'Exhale':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [persistedSnapshot, setPersistedSnapshot] = useState<ResonancePersistedSnapshot>({});

  // Load the native mirror before mounting the DOM component so the webview's
  // first commit never sees an empty snapshot and clobber the AsyncStorage mirror.
  useEffect(() => {
    loadPersistedSnapshot().then((snapshot) => {
      setPersistedSnapshot(snapshot);
      setSnapshotReady(true);
    });
  }, []);

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

  // Release the screen-awake lock if we unmount mid-session.
  useEffect(() => {
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  // Stable handler identities so the DOM component's effects don't re-fire (and
  // double-tap haptics) on unrelated host re-renders. The DOM bridge requires
  // async callbacks.
  const handleSessionComplete = useCallback(async (_seconds: number) => {}, []);

  const handleEvent = useCallback(async (name: string, params?: Record<string, any>) => {
    if (name === 'haptic') {
      fireHaptic(params?.phase);
      return;
    }
    if (name === 'keep_awake') {
      try {
        if (params?.active) await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
        else await deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch {
        // Non-fatal — keep-awake is best-effort.
      }
      return;
    }
    if (name === 'persist' && typeof params?.key === 'string') {
      const value = typeof params.value === 'string' ? params.value : null;
      await mirrorPersist(params.key, value);
    }
  }, []);

  // Match the native safe-area backdrop to the experience's --background token
  // (light: cream 32 72% 97%, dark: warm 20 34% 10%) so there's no black strip.
  const backdrop = theme === 'light' ? '#fdf8f2' : '#221711';

  return (
    <View style={[styles.container, { backgroundColor: backdrop }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {snapshotReady ? (
          <BreathingExperienceDom
            dom={{ style: { flex: 1 } }}
            locale={locale}
            forcedTheme={theme}
            appState={appState}
            isNativeApp
            initialPersistedSnapshot={persistedSnapshot}
            onSessionComplete={handleSessionComplete}
            onEvent={handleEvent}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
});
