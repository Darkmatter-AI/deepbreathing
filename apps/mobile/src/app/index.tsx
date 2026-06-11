// The app's main screen IS the web-parity breathing experience, rendered as an
// Expo DOM component (WebView on native, plain DOM on web) so it is 1:1 with the
// branded website by construction. This native host bridges device locale, theme,
// app-background -> audio-suspend, and sets up the audio session.
//
// The earlier native StyleSheet/Reanimated re-implementation (src/breathing/*,
// components/breathing/*) is retired by this — kept in-repo for reference only.

import { useCallback, useEffect, useRef, useState } from 'react';
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
  RESONANCE_STORAGE_KEYS,
} from '../breathing/resonance-mirror';
import { GA4_FORWARDED_EVENTS, fireGA4Event, warmClientId } from '../breathing/ga4-mp';
import CompletionSummary, { type CompletionSummaryData } from '../components/CompletionSummary';
import ModeLibrarySheet from '../components/ModeLibrarySheet';
import { ModeName } from '../components/breathing-web/constants';

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

  // Track the latest resonance_stats from persist events so completion summary
  // can show totals without re-reading AsyncStorage (avoids a race with the
  // mirror write that happens in the same handleEvent cycle).
  const latestStatsRef = useRef<{ totalMinutes: number | null; sessionsCompleted: number | null }>({
    totalMinutes: null,
    sessionsCompleted: null,
  });

  // Completion summary visibility.
  const [summaryData, setSummaryData] = useState<CompletionSummaryData | null>(null);

  // MOB-5: Mode library state.
  // selectedMode starts as undefined so the webview loads from saved settings.
  // It is only set (non-undefined) after the user picks a mode from the sheet;
  // that value is passed as initialMode and causes the webview to switch.
  // IMPORTANT: we never persist this on the host — the webview's own persist
  // effect writes resonance_settings.mode which mirrors via the MOB-4a bridge.
  const [selectedMode, setSelectedMode] = useState<ModeName | undefined>(undefined);

  // Running-state detection: derived from keep_awake events (active=true while
  // running, active=false on pause/stop/complete). The tab is hidden while running.
  const [isSessionRunning, setIsSessionRunning] = useState(false);

  // Latest active mode name from the persist stream (resonance_settings.mode).
  // Used to show a checkmark on the current mode in the sheet.
  const [activeModeName, setActiveModeName] = useState<string | null>(null);

  // Warm the GA4 client_id cache early so the first event doesn't pay the
  // AsyncStorage round-trip latency.
  useEffect(() => {
    warmClientId();
  }, []);

  // Load the native mirror before mounting the DOM component so the webview's
  // first commit never sees an empty snapshot and clobber the AsyncStorage mirror.
  useEffect(() => {
    loadPersistedSnapshot().then((snapshot) => {
      setPersistedSnapshot(snapshot);
      setSnapshotReady(true);
      // MOB-5: seed the sheet's active-mode checkmark from the saved settings
      // so the first open is correct before any persist event arrives.
      // Snapshot values are encodeURIComponent-encoded (see resonance-mirror.ts).
      const rawSettings = snapshot[RESONANCE_STORAGE_KEYS.SETTINGS];
      if (rawSettings) {
        try {
          const parsed = JSON.parse(decodeURIComponent(rawSettings)) as Record<string, unknown>;
          if (typeof parsed.mode === 'string') setActiveModeName(parsed.mode);
        } catch {
          // Malformed value — checkmark falls back to the persist stream.
        }
      }
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
  const handleSessionComplete = useCallback(async (seconds: number) => {
    // Success haptic — signals a positive completion.
    // NOTE: haptics cannot be felt on the simulator; this is code-path verified
    // only (__DEV__ log below). Confirm the feel on a real device (DAR-395).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (__DEV__) {
      console.log('[MOB-4b] handleSessionComplete fired — haptic: NotificationFeedbackType.Success');
    }

    setSummaryData({
      sessionSeconds: seconds,
      totalMinutes: latestStatsRef.current.totalMinutes,
      sessionsCompleted: latestStatsRef.current.sessionsCompleted,
    });
  }, []);

  const handleEvent = useCallback(async (name: string, params?: Record<string, any>) => {
    if (name === 'haptic') {
      fireHaptic(params?.phase);
      return;
    }
    if (name === 'keep_awake') {
      // Derive session running state from keep_awake so the mode tab hides
      // while a session is active. active=true on start/resume, false on
      // pause/stop/complete — confirmed via BreathingExperience.tsx:422-424.
      setIsSessionRunning(params?.active === true);
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
      // Keep a live copy of resonance_stats so the completion handler can show
      // totals without racing the async mirror write.
      if (params.key === RESONANCE_STORAGE_KEYS.STATS && value != null) {
        try {
          const parsed = JSON.parse(value) as Record<string, unknown>;
          latestStatsRef.current = {
            totalMinutes: typeof parsed.totalMinutes === 'number' ? parsed.totalMinutes : null,
            sessionsCompleted: typeof parsed.sessionsCompleted === 'number' ? parsed.sessionsCompleted : null,
          };
        } catch {
          // Malformed JSON — keep the previous ref value.
        }
      }
      // MOB-5: Track the active mode from resonance_settings so the sheet can
      // show a checkmark on the currently active mode.
      if (params.key === RESONANCE_STORAGE_KEYS.SETTINGS && value != null) {
        try {
          const parsed = JSON.parse(value) as Record<string, unknown>;
          if (typeof parsed.mode === 'string') {
            setActiveModeName(parsed.mode);
          }
        } catch {
          // Malformed JSON — leave activeModeName unchanged.
        }
      }
      await mirrorPersist(params.key, value);
      return;
    }
    // Forward analytics events to GA4 Measurement Protocol (MOB-2).
    // Fire-and-forget — never blocks the event handler.
    if (GA4_FORWARDED_EVENTS.has(name)) {
      fireGA4Event(name, params ?? {});
    }
  }, []);

  // Match the native safe-area backdrop to the experience's --background token
  // (light: cream 32 72% 97%, dark: warm 20 34% 10%) so there's no black strip.
  const backdrop = theme === 'light' ? '#fdf8f2' : '#221711';

  const handleDismissSummary = useCallback(() => {
    setSummaryData(null);
  }, []);

  // MOB-5: Handle mode selection from the sheet.
  // Sets selectedMode → passed as initialMode prop → webview switches mode.
  // Also fires mode_switch to GA4 (matching the webview's own event params).
  // We track from/to using activeModeName (from persist stream) so params align.
  const handleSelectMode = useCallback((mode: ModeName) => {
    const from = activeModeName ?? ModeName.Box;
    // Fire analytics from the host (MOB-2 GA4 bridge), matching webview params.
    fireGA4Event('mode_switch', { from, to: mode });
    setSelectedMode(mode);
    // Update local checkmark immediately so the sheet reflects the choice
    // before the webview's next persist flush.
    setActiveModeName(mode);
  }, [activeModeName]);

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
            // MOB-5: Only pass initialMode when the user explicitly selected one
            // from the sheet. On launch this is undefined so the webview loads
            // from saved resonance_settings (mode choice survives relaunch).
            initialMode={selectedMode}
            onSessionComplete={handleSessionComplete}
            onEvent={handleEvent}
          />
        ) : null}
        {summaryData != null && (
          <CompletionSummary
            data={summaryData}
            theme={theme}
            onDismiss={handleDismissSummary}
          />
        )}
        {/* MOB-5: Mode library pull-up tab — hidden while a session is running. */}
        {!isSessionRunning && (
          <ModeLibrarySheet
            theme={theme}
            activeModeName={activeModeName}
            onSelectMode={handleSelectMode}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
});
