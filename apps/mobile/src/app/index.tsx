// The app's main screen IS the web-parity breathing experience, rendered as an
// Expo DOM component (WebView on native, plain DOM on web) so it is 1:1 with the
// branded website by construction. This native host bridges device locale, theme,
// app-background -> audio-suspend, and sets up the audio session.
//
// The earlier native StyleSheet/Reanimated re-implementation (src/breathing/*,
// components/breathing/*) is retired by this — kept in-repo for reference only.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import {
  useBackgroundAudio,
  type NativeAudioState,
} from '../breathing/use-background-audio';
import CompletionSummary, { type CompletionSummaryData } from '../components/CompletionSummary';
import ModeLibrarySheet from '../components/ModeLibrarySheet';
import { ModeName } from '../components/breathing-web/constants';
import type { BreathingMode, SessionEndReason } from '@resonance/domain';
import { randomUUID } from 'expo-crypto';
import { useSession } from '../auth/auth-client';
import {
  enqueueSessionEvent,
  flushSessionOutbox,
  getClientVersion,
  getOrCreateGuestId,
  hydrateAccountState,
} from '../sync/session-sync-client';
import { createSessionSegment, localCalendarDate } from '../sync/session-sync';
import AccountSheet from '../auth/AccountSheet';

// Scopes the screen-awake lock to an active session so it releases on pause/stop.
const KEEP_AWAKE_TAG = 'breathing-session';

// Native haptics bridge. The DOM experience emits this event in the same function
// call that starts each audio cue, and the native host turns it into the shortest,
// lightest system haptic. A phase change should feel like a quiet metronome tick,
// not a notification or alert.
// NOTE: the simulator produces no haptics, so the *feel* is unverified — confirm
// the intensities on a real device (see docs/expo-attempt-2-progress.md).
const firePhaseHaptic = () => {
  Haptics.selectionAsync().catch(() => {});
};

const toBreathingAppState = (status: AppStateStatus): 'active' | 'background' =>
  status === 'active' ? 'active' : 'background';

export default function HomeScreen() {
  const { data: authSession } = useSession();
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  const safeAreaInsets = useSafeAreaInsets();

  const [appState, setAppState] = useState<'active' | 'background'>(
    toBreathingAppState(AppState.currentState),
  );
  const [nativeAudioState, setNativeAudioState] = useState<NativeAudioState>({
    active: false,
    muted: false,
    elapsedSeconds: 0,
    duration: null,
    reportedAtMs: Date.now(),
  });
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [persistedSnapshot, setPersistedSnapshot] = useState<ResonancePersistedSnapshot>({});
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const guestIdRef = useRef<string | null>(null);
  const practiceIdRef = useRef<string | null>(null);
  const committedSecondsRef = useRef(0);
  const hydratedUserIdRef = useRef<string | null>(null);

  // Completion summary visibility.
  const [summaryData, setSummaryData] = useState<CompletionSummaryData | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

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

  useBackgroundAudio({ appState, audioState: nativeAudioState });

  // Warm the GA4 client_id cache early so the first event doesn't pay the
  // AsyncStorage round-trip latency.
  useEffect(() => {
    warmClientId();
  }, []);

  // Load the native mirror before mounting the DOM component so the webview's
  // first commit never sees an empty snapshot and clobber the AsyncStorage mirror.
  useEffect(() => {
    getOrCreateGuestId().then((guestId) => {
      guestIdRef.current = guestId;
    });
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

  // A successful account bootstrap refreshes the DOM mirror while idle. This
  // is what makes web practice appear on phone (and vice versa) without ever
  // making the breathing runtime depend on the network.
  useEffect(() => {
    const userId = authSession?.user.id;
    if (!userId) {
      hydratedUserIdRef.current = null;
      return;
    }
    if (hydratedUserIdRef.current === userId) return;
    hydratedUserIdRef.current = userId;

    hydrateAccountState().then(async (hydrated) => {
      if (!hydrated || isSessionRunning) return;
      const snapshot = await loadPersistedSnapshot();
      setPersistedSnapshot(snapshot);
      setSnapshotVersion((version) => version + 1);
    });
  }, [authSession?.user.id, isSessionRunning]);

  useEffect(() => {
    if (appState === 'active' && authSession?.user.id) {
      void flushSessionOutbox();
    }
  }, [appState, authSession?.user.id]);

  // Best-effort audio session setup on mount (so cues play with the ringer off).
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          allowsRecording: false,
          shouldPlayInBackground: true,
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
  const handleSessionComplete = useCallback(async (
    seconds: number,
    stats: { totalMinutes: number; sessionsCompleted: number },
  ) => {
    // Success haptic — signals a positive completion.
    // NOTE: haptics cannot be felt on the simulator; this is code-path verified
    // only (__DEV__ log below). Confirm the feel on a real device (DAR-395).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (__DEV__) {
      console.log('[MOB-4b] handleSessionComplete fired — haptic: NotificationFeedbackType.Success');
    }

    setSummaryData({
      sessionSeconds: seconds,
      totalMinutes: stats.totalMinutes,
      sessionsCompleted: stats.sessionsCompleted,
    });
  }, []);

  const handleEvent = useCallback(async (name: string, params?: Record<string, any>) => {
    if (
      authSession?.user.id &&
      (name === 'breathing_session_start' || name === 'mode_switch')
    ) {
      setSummaryData(null);
    }
    if (name === 'phase_haptic') {
      firePhaseHaptic();
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
    if (name === 'audio_state') {
      setNativeAudioState({
        active: params?.active === true,
        muted: params?.muted === true,
        elapsedSeconds:
          typeof params?.elapsedSeconds === 'number' ? Math.max(0, params.elapsedSeconds) : 0,
        duration:
          typeof params?.duration === 'number' && params.duration > 0 ? params.duration : null,
        reportedAtMs: Date.now(),
      });
      return;
    }
    if (name === 'breathing_session_start') {
      practiceIdRef.current = randomUUID();
      committedSecondsRef.current = 0;
    }
    if (name === 'breathing_session_end') {
      const elapsedSeconds =
        typeof params?.seconds_elapsed === 'number'
          ? Math.max(0, Math.floor(params.seconds_elapsed))
          : 0;
      const reason = params?.reason as SessionEndReason | undefined;
      const mode = params?.mode as BreathingMode | undefined;
      const guestId = guestIdRef.current ?? (await getOrCreateGuestId());
      guestIdRef.current = guestId;
      const practiceId = practiceIdRef.current ?? randomUUID();
      practiceIdRef.current = practiceId;
      if (reason && mode) {
        const endedAt = new Date();
        const event = createSessionSegment({
          eventId: randomUUID(),
          practiceId,
          guestId,
          mode,
          reason,
          elapsedSeconds,
          previouslyCommittedSeconds: committedSecondsRef.current,
          endedAt,
          localDate: localCalendarDate(endedAt),
          clientVersion: getClientVersion(),
        });
        if (event) {
          await enqueueSessionEvent(event);
          committedSecondsRef.current = elapsedSeconds;
          if (authSession?.user.id) void flushSessionOutbox();
        }
      }
      if (reason === 'completed' || reason === 'mode_switched') {
        practiceIdRef.current = null;
        committedSecondsRef.current = 0;
      }
    }
    if (name === 'persist' && typeof params?.key === 'string') {
      const value = typeof params.value === 'string' ? params.value : null;
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
  }, [authSession?.user.id]);

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
            key={snapshotVersion}
            dom={{
              style: { flex: 1 },
              contentInsetAdjustmentBehavior: 'never',
              automaticallyAdjustContentInsets: false,
              automaticallyAdjustsScrollIndicatorInsets: false,
              contentInset: { top: 0, right: 0, bottom: 0, left: 0 },
            }}
            locale={locale}
            forcedTheme={theme}
            appState={appState}
            isNativeApp
            safeAreaInsets={safeAreaInsets}
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
            isAuthenticated={Boolean(authSession?.user.id)}
            safeAreaTop={safeAreaInsets.top}
            onDismiss={handleDismissSummary}
          />
        )}
        {!isSessionRunning && (
          <Pressable
            onPress={() => setAccountOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={authSession?.user ? 'Open account' : 'Sign in to sync'}
            style={[
              styles.accountButton,
              {
                top: safeAreaInsets.top + 14,
                backgroundColor: theme === 'dark' ? 'rgba(49,31,24,0.78)' : 'rgba(255,249,243,0.82)',
                borderColor: theme === 'dark' ? '#604536' : '#e3cdbb',
              },
            ]}
          >
            <Text style={[styles.accountGlyph, { color: theme === 'dark' ? '#f0dac8' : '#5a3826' }]}>
              {authSession?.user ? (authSession.user.name?.[0] ?? '✓').toUpperCase() : '↗'}
            </Text>
          </Pressable>
        )}
        {/* MOB-5: Mode library pull-up tab — hidden while a session is running. */}
        {!isSessionRunning && (
          <ModeLibrarySheet
            theme={theme}
            activeModeName={activeModeName}
            onSelectMode={handleSelectMode}
          />
        )}
        <AccountSheet
          open={accountOpen}
          theme={theme}
          user={authSession?.user ?? null}
          onClose={() => setAccountOpen(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  accountButton: {
    position: 'absolute',
    left: 16,
    zIndex: 95,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountGlyph: { fontSize: 16, fontWeight: '800' },
});
