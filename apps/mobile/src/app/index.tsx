// The app's main screen IS the web-parity breathing experience, rendered as an
// Expo DOM component (WebView on native, plain DOM on web) so it is 1:1 with the
// branded website by construction. This native host bridges device locale, theme,
// app-background -> audio-suspend, and sets up the audio session.
//
// The earlier native StyleSheet/Reanimated re-implementation (src/breathing/*,
// components/breathing/*) is retired by this — kept in-repo for reference only.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Linking,
  type AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Localization from 'expo-localization';
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
import { useNativeSoundscape } from '../breathing/native-soundscape';
import CompletionSummary, { type CompletionSummaryData } from '../components/CompletionSummary';
import ModeLibrarySheet from '../components/ModeLibrarySheet';
import { BREATHING_PATTERNS, ModeName } from '../components/breathing-web/constants';
import type { BreathingMode, SessionEndReason } from '@resonance/domain';
import { randomUUID } from 'expo-crypto';
import { authClient, useSession } from '../auth/auth-client';
import {
  claimAccountDeletionPrompt,
  parseAccountDeletionDeepLink,
  releaseAccountDeletionPrompt,
} from '../auth/account-deletion-deeplink';
import {
  enqueueSessionEvent,
  flushSessionOutbox,
  getClientVersion,
  getOrCreateGuestId,
  hydrateAccountState,
  loadAccountPracticeSummary,
  type AccountPracticeSummary,
} from '../sync/session-sync-client';
import { createSessionSegment, localCalendarDate } from '../sync/session-sync';
import AccountSheet from '../auth/AccountSheet';
import { accountAvatarUri } from '../auth/account-avatar';

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

function blendHex(base: string, tint: string, amount: number) {
  const channel = (hex: string, offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  const mixed = [1, 3, 5].map((offset) =>
    Math.round(channel(base, offset) * (1 - amount) + channel(tint, offset) * amount)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${mixed.join('')}`;
}

export default function HomeScreen() {
  const { data: authSession } = useSession();
  const colorScheme = useColorScheme();
  const theme: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  const [experienceTheme, setExperienceTheme] = useState<'light' | 'dark'>(theme);
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  const safeAreaInsets = useSafeAreaInsets();

  const [appState, setAppState] = useState<'active' | 'background'>(
    toBreathingAppState(AppState.currentState),
  );
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [persistedSnapshot, setPersistedSnapshot] = useState<ResonancePersistedSnapshot>({});
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const guestIdRef = useRef<string | null>(null);
  const practiceIdRef = useRef<string | null>(null);
  const committedSecondsRef = useRef(0);
  const hydratedUserIdRef = useRef<string | null>(null);
  const edgeGlowOpacity = useRef(new Animated.Value(0)).current;
  const accountButtonOpacity = useRef(new Animated.Value(1)).current;
  const soundscape = useNativeSoundscape();
  const { onSessionComplete } = soundscape;

  // Completion summary visibility.
  const [summaryData, setSummaryData] = useState<CompletionSummaryData | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [practiceSummary, setPracticeSummary] = useState<AccountPracticeSummary | null>(null);
  const pendingDeletionTokensRef = useRef(new Set<string>());
  const handledDeletionTokensRef = useRef(new Set<string>());
  const deletionInFlightRef = useRef(false);

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

  // True while the webview's full-page settings covers the screen. Native
  // overlays (mode drawer, account button) hide so they don't float above it.
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keep the native-to-WebView handoff visually identical to the launch screen.
  // The DOM experience emits page_viewed_breathing once its client has mounted;
  // until then, show the light loader instead of briefly exposing the host theme.
  const [experienceReady, setExperienceReady] = useState(false);

  // Latest active mode name from the persist stream (resonance_settings.mode).
  // Used to show a checkmark on the current mode in the sheet.
  const [activeModeName, setActiveModeName] = useState<string | null>(null);

  const confirmAccountDeletion = useCallback(
    async (token: string) => {
      releaseAccountDeletionPrompt(token, pendingDeletionTokensRef.current);
      if (deletionInFlightRef.current) return;
      handledDeletionTokensRef.current.add(token);
      deletionInFlightRef.current = true;
      try {
        const result = await authClient.deleteUser({ token });
        if (result.error) throw new Error(result.error.message ?? 'Account deletion failed.');
        Alert.alert(
          'Account deleted',
          'Your account and synced practice data have been permanently deleted.',
        );
      } catch {
        // Keep a failed/cancelled token retryable without ever showing the
        // bearer token in an error message or log.
        handledDeletionTokensRef.current.delete(token);
        Alert.alert(
          'Could not delete account',
          'Keep the app open, make sure you are signed in, and try the email link again.',
        );
      } finally {
        deletionInFlightRef.current = false;
      }
    },
    [],
  );

  const handleAccountDeletionURL = useCallback(
    (rawURL: string | null) => {
      const request = parseAccountDeletionDeepLink(rawURL);
      if (!request || deletionInFlightRef.current) return;
      if (
        !claimAccountDeletionPrompt(
          request.token,
          pendingDeletionTokensRef.current,
          handledDeletionTokensRef.current,
        )
      ) {
        return;
      }
      Alert.alert(
        'Confirm account deletion',
        'This permanently deletes your account and all synced practice data. This cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () =>
              releaseAccountDeletionPrompt(
                request.token,
                pendingDeletionTokensRef.current,
              ),
          },
          {
            text: 'Delete account',
            style: 'destructive',
            onPress: () => void confirmAccountDeletion(request.token),
          },
        ],
      );
    },
    [confirmAccountDeletion],
  );

  // Account deletion emails opened in Safari hand off to this app-root URL.
  // GET/listener handling never mutates state; only the explicit Alert action
  // calls Better Auth's existing token-confirmation branch.
  useEffect(() => {
    let disposed = false;
    const receive = (url: string | null) => {
      if (!disposed) handleAccountDeletionURL(url);
    };
    void Linking.getInitialURL().then(receive).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => receive(url));
    return () => {
      disposed = true;
      subscription.remove();
    };
  }, [handleAccountDeletionURL]);

  useEffect(() => {
    soundscape.onAppState(appState);
  }, [appState, soundscape]);

  useEffect(() => {
    Animated.timing(edgeGlowOpacity, {
      toValue: isSessionRunning ? 0.18 : 0,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [edgeGlowOpacity, isSessionRunning]);

  // Native overlays fade instead of popping out when a session starts or the
  // full-page settings covers the screen (matches the webview's own fades).
  const overlaysVisible = experienceReady && !isSessionRunning && !settingsOpen;
  useEffect(() => {
    Animated.timing(accountButtonOpacity, {
      toValue: overlaysVisible ? 1 : 0,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [accountButtonOpacity, overlaysVisible]);

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
      setPracticeSummary(await loadAccountPracticeSummary());
    });
  }, [authSession?.user.id, isSessionRunning]);

  useEffect(() => {
    if (appState === 'active' && authSession?.user.id) {
      void flushSessionOutbox();
    }
  }, [appState, authSession?.user.id]);

  // AVAudioSession config now lives in useNativeSoundscape (react-native-audio-api
  // AudioManager, category 'playback') — a second library configuring the session
  // here would fight it.

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
    stats: { totalMinutes: number; sessionsCompleted: number; sessionMode: string },
  ) => {
    // The native hook queues this until the webview's audio_state {active:false}
    // stop has completed, so the stop path cannot cut off or duplicate it.
    onSessionComplete();
    // Success haptic — signals a positive completion.
    // NOTE: haptics cannot be felt on the simulator; this is code-path verified
    // only (__DEV__ log below). Confirm the feel on a real device (DAR-395).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (__DEV__) {
      console.log('[MOB-4b] handleSessionComplete fired — haptic: NotificationFeedbackType.Success');
    }

    setSummaryData({
      sessionSeconds: seconds,
      sessionMode: stats.sessionMode,
      totalMinutes: stats.totalMinutes,
      sessionsCompleted: stats.sessionsCompleted,
    });
  }, [onSessionComplete]);

  const handleEvent = useCallback(async (name: string, params?: Record<string, any>) => {
    if (name === 'page_viewed_breathing') {
      setExperienceReady(true);
    }
    if (name === 'theme_change' && (params?.theme === 'light' || params?.theme === 'dark')) {
      setExperienceTheme(params.theme);
      return;
    }
    if (
      authSession?.user.id &&
      (name === 'breathing_session_start' || name === 'mode_switch')
    ) {
      setSummaryData(null);
    }
    if (name === 'phase_haptic') {
      soundscape.onPhase(params?.phase, params?.color);
      edgeGlowOpacity.stopAnimation();
      edgeGlowOpacity.setValue(0.32);
      Animated.timing(edgeGlowOpacity, {
        toValue: 0.18,
        duration: 380,
        useNativeDriver: true,
      }).start();
      firePhaseHaptic();
      return;
    }
    if (name === 'pace_haptic') {
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    if (name === 'settings_open') {
      setSettingsOpen(params?.open === true);
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
      soundscape.onAudioState(params ?? {});
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
          if (typeof parsed.speed === 'number') {
            soundscape.onSpeedMultiplier(parsed.speed);
          }
          if (typeof parsed.binauralEnabled === 'boolean') {
            soundscape.onBinauralEnabled(parsed.binauralEnabled);
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
  }, [authSession?.user.id, edgeGlowOpacity, soundscape]);

  // Match the native safe-area backdrop to the experience's --background token
  // (light: cream 32 72% 97%, dark: warm 20 34% 10%) so there's no black strip.
  const baseBackdrop = experienceTheme === 'light' ? '#fdf8f2' : '#221711';
  const modeColor = BREATHING_PATTERNS[
    (activeModeName as ModeName | null) ?? ModeName.Box
  ]?.color ?? BREATHING_PATTERNS[ModeName.Box].color;
  const backdrop = isSessionRunning ? blendHex(baseBackdrop, modeColor, 0.16) : baseBackdrop;
  const screenBackdrop = experienceReady ? backdrop : '#fdf8f2';
  // The launch overlay is always light, even when the device is in dark mode.
  // Keep the system indicators readable while the WebView theme is handed off,
  // then follow the user's in-app theme once the experience is ready.
  const statusBarStyle: 'light' | 'dark' =
    !experienceReady || experienceTheme === 'light' ? 'dark' : 'light';

  const handleDismissSummary = useCallback(() => {
    setSummaryData(null);
  }, []);

  const handleOpenAccount = useCallback(() => {
    // Opening account controls is a deliberate next action. Registered users'
    // saved-practice banner should not reappear after the sheet closes.
    if (authSession?.user.id) setSummaryData(null);
    setAccountOpen(true);
    void loadAccountPracticeSummary().then(setPracticeSummary);
    if (authSession?.user.id) {
      void hydrateAccountState().then(async (hydrated) => {
        if (hydrated) setPracticeSummary(await loadAccountPracticeSummary());
      });
    }
  }, [authSession?.user.id]);

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
    <View style={[styles.container, { backgroundColor: screenBackdrop }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={statusBarStyle} animated />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: modeColor, opacity: edgeGlowOpacity }]}
      />
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
        {!experienceReady && (
          <View pointerEvents="none" style={styles.launchLoader}>
            <Image
              source={require('../../assets/images/splash-icon.png')}
              style={styles.launchLoaderOrb}
              contentFit="contain"
              alt=""
            />
          </View>
        )}
        {summaryData != null && (
          <CompletionSummary
            data={summaryData}
            theme={experienceTheme}
            isAuthenticated={Boolean(authSession?.user.id)}
            safeAreaTop={safeAreaInsets.top}
            onDismiss={handleDismissSummary}
          />
        )}
        <Animated.View
          pointerEvents={overlaysVisible ? 'auto' : 'none'}
          style={[
            styles.accountButtonWrap,
            // Mirror the webview header geometry (paddingTop: safeArea.top + 24,
            // horizontal inset 24) so this native button aligns with the
            // webview-rendered settings button in the opposite corner.
            { top: safeAreaInsets.top + 24, opacity: accountButtonOpacity },
          ]}
        >
          <Pressable
            onPress={handleOpenAccount}
            accessibilityRole="button"
            accessibilityLabel={authSession?.user ? 'Open account' : 'Sign in to sync'}
            accessibilityElementsHidden={!overlaysVisible}
            style={[
              styles.accountButton,
              {
                backgroundColor: experienceTheme === 'dark' ? 'rgba(49,31,24,0.78)' : 'rgba(255,249,243,0.82)',
                borderColor: experienceTheme === 'dark' ? '#604536' : '#e3cdbb',
              },
            ]}
          >
            {authSession?.user ? (
              <Image
                source={accountAvatarUri(authSession.user)}
                style={styles.accountImage}
                contentFit="cover"
                alt="Account portrait"
              />
            ) : (
              <View style={styles.guestPortrait}>
                <View style={[styles.guestHead, { borderColor: experienceTheme === 'dark' ? '#f0dac8' : '#5a3826' }]} />
                <View style={[styles.guestShoulders, { borderColor: experienceTheme === 'dark' ? '#f0dac8' : '#5a3826' }]} />
              </View>
            )}
          </Pressable>
        </Animated.View>
        {/* MOB-5: Mode library pull-up tab — slides away while a session is
            running or the full-page settings covers the screen. */}
        <ModeLibrarySheet
          theme={experienceTheme}
          hidden={!overlaysVisible}
          activeModeName={activeModeName}
          onSelectMode={handleSelectMode}
        />
        <AccountSheet
          open={accountOpen}
          theme={experienceTheme}
          user={authSession?.user ?? null}
          practice={practiceSummary}
          onClose={() => setAccountOpen(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  launchLoader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf8f2',
  },
  launchLoaderOrb: { width: 220, height: 220 },
  accountButtonWrap: {
    position: 'absolute',
    left: 24,
    zIndex: 95,
  },
  accountButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountImage: { width: 38, height: 38, borderRadius: 19 },
  guestPortrait: { width: 24, height: 24, alignItems: 'center' },
  guestHead: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  guestShoulders: { width: 17, height: 9, marginTop: 3, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderWidth: 1.5, borderBottomWidth: 0 },
});
