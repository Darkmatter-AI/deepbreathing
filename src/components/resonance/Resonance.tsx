'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Volume2, VolumeX, Eye, EyeOff, Activity, Waves, Wind, Sun, Moon, Turtle, Rabbit, X, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { BreathingPhase, ModeName, AIRecommendation, ProtocolPhase, ProtocolState } from './types';
import { BREATHING_PATTERNS, DEFAULT_SPEED_MULTIPLIER, WIM_HOF_PROTOCOL } from './constants';
import { AudioService } from './services/audioService';
import Visualizer from './components/Visualizer';
import { createRuntimePhraseResolver, detectRuntimeLocale, RuntimePhraseKey } from './runtime-phrases';
import { LanguageSwitcherInline } from '@/components/language-switcher';

// GA4 event helper — safe to call even if gtag isn't loaded
function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', name, params);
  }
}

// Lazy-load ParticleBackground to reduce initial bundle size
const ParticleBackground = dynamic(
  () => import('./components/ParticleBackground'),
  { ssr: false }
);
const SnowBackground = dynamic(
  () => import('./components/SnowBackground'),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 z-0" />
  }
);
import { modeToBreathingPage } from '@/data/breathing-pages';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/auth-client';
import { useConversionTriggers } from '@/lib/conversion/use-conversion-triggers';
import { SessionCompletePrompt } from '@/components/auth/session-complete-prompt';
import { ConversionNudge } from '@/components/auth/conversion-nudge';
import { SignInSheet } from '@/components/auth/sign-in-sheet';

const STORAGE_KEYS = {
  STATS: 'resonance_stats',
  SETTINGS: 'resonance_settings',
  THEME: 'resonance_theme',
  SOUND_OK: 'resonance_sound_ok'
};

interface ResonanceProps {
  apiKey?: string;
  className?: string;
  defaultMode?: ModeName;
  immersive?: boolean;
  snowMode?: boolean;
  forcedTheme?: 'light' | 'dark';
  backgroundVariant?: 'default' | 'winter-blue';
  embedMode?: boolean;
  noMobileBottomPad?: boolean;
}

// Valid duration values in seconds (clamped to prevent abuse)
const VALID_DURATIONS = [30, 60, 180, 300, 600] as const;
const MAX_DURATION = 600; // 10 minutes max
const DEFAULT_DURATION = 60; // 1 min default for new users

function parseAndClampDuration(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return undefined;
  // Clamp to max duration
  return Math.min(parsed, MAX_DURATION);
}

function durationLabel(seconds: number): string {
  return seconds < 60 ? `${seconds}s` : `${seconds / 60} min`;
}

type ThemePreference = 'system' | 'light' | 'dark';

const DURATION_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Open', value: null },
  ...VALID_DURATIONS.map((duration) => ({
    label: durationLabel(duration),
    value: duration
  }))
];

const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Resonance: React.FC<ResonanceProps> = ({ apiKey, className = '', defaultMode, immersive, snowMode = false, forcedTheme, backgroundVariant = 'default', embedMode = false, noMobileBottomPad = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse duration from URL params client-side (keeps page static)
  const durationFromUrl = useMemo(
    () => parseAndClampDuration(searchParams.get('duration')),
    [searchParams]
  );

  // --- State ---
  const initialMode = defaultMode ?? ModeName.Box;
  const [selectedDuration, setSelectedDuration] = useState<number | null>(() => durationFromUrl ?? DEFAULT_DURATION);
  const [activeMode, setActiveMode] = useState<ModeName>(initialMode);
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED_MULTIPLIER);
  const [themeColor, setThemeColor] = useState(BREATHING_PATTERNS[initialMode].color);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  // Identity of the in-progress session. Set on first start, kept across
  // pause/resume, cleared on hard-end (complete/mode-switch). committed
  // tracks how many seconds of THIS session have already been credited
  // to totalMinutes — so resume → next pause only commits the new delta.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCommittedSeconds, setSessionCommittedSeconds] = useState(0);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const isIOS = useMemo(
    () => (typeof navigator !== 'undefined' ? /iP(hone|od|ad)/i.test(navigator.userAgent) : false),
    []
  );

  // Auth + conversion triggers
  const { isAuthenticated, user, syncSettings, syncStats } = useAuth();
  const {
    showSessionPrompt,
    showSettingsNudge,
    onSessionComplete,
    onSettingsChange,
    dismissSession,
    dismissSettings,
    markConverted,
    setShowSessionPrompt,
  } = useConversionTriggers(isAuthenticated);
  const [showSignInSheet, setShowSignInSheet] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Client-side hydration check
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRuntimeLocale(detectRuntimeLocale());

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (!defaultMode && parsed.mode) setActiveMode(parsed.mode);
      if (parsed.speed) setSpeedMultiplier(parsed.speed);
      if (!defaultMode && parsed.color) setThemeColor(parsed.color);
    } else if (!defaultMode) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setThemeColor("#0d9488");
      else if (hour >= 18 || hour < 5) setThemeColor("#ea580c");
    }

    if (defaultMode) {
      setActiveMode(defaultMode);
      setThemeColor(BREATHING_PATTERNS[defaultMode].color);
    }

    const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setTotalMinutes(parsed.totalMinutes || 0);
      setSessionsCompleted(parsed.sessionsCompleted || 0);
    }

    const soundFlag = localStorage.getItem(STORAGE_KEYS.SOUND_OK);
    if (soundFlag === 'true') {
      setSoundStatus('confirmed');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemePreference(savedTheme);
    } else {
      setThemePreference('system');
    }

    setThemeReady(true);
  }, [defaultMode]);

  useEffect(() => {
    if (durationFromUrl === undefined) return;
    setSelectedDuration(durationFromUrl);
  }, [durationFromUrl]);

  useEffect(() => {
    if (!mounted || durationFromUrl !== undefined) return;
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!savedSettings) return;
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.duration === null) {
        setSelectedDuration(null);
      } else if (typeof parsed.duration === 'number') {
        setSelectedDuration(Math.min(parsed.duration, MAX_DURATION));
      }
    } catch (_err) {
      // Ignore invalid persisted settings.
    }
  }, [mounted, durationFromUrl]);

  const [phase, setPhase] = useState<BreathingPhase>(BreathingPhase.Idle);
  const [isRunning, setIsRunning] = useState(false);

  // Protocol mode state (for Wim Hof and similar multi-round techniques)
  const [isProtocolMode, setIsProtocolMode] = useState(false);
  const [protocolState, setProtocolState] = useState<ProtocolState>({
    currentRound: 1,
    currentBreathIndex: 0,
    phase: ProtocolPhase.Idle,
    retentionTime: 0,
    isUserControlledHold: false
  });
  const protocolPhaseStartRef = useRef<number>(0);
  const retentionStartRef = useRef<number>(0);
  const [muted, setMuted] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [soundStatus, setSoundStatus] = useState<'unknown' | 'confirmed'>('unknown');
  const [soundHintVisible, setSoundHintVisible] = useState(false);
  const [soundHintMounted, setSoundHintMounted] = useState(false);

  // Animation State
  const [scale, setScale] = useState(0);
  const [runtimeLocale, setRuntimeLocale] = useState('en');
  const runtimePhrases = useMemo(() => createRuntimePhraseResolver(runtimeLocale), [runtimeLocale]);
  const [instruction, setInstruction] = useState(() => runtimePhrases.resolve('session.ready_to_start').text);
  const [runtimeFallbackCount, setRuntimeFallbackCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Refs
  const audioServiceRef = useRef<AudioService | null>(null);
  const soundHintTimeoutRef = useRef<number | null>(null);
  const soundHintUnmountRef = useRef<number | null>(null);
  const lastSafeRuntimeTextRef = useRef<Partial<Record<RuntimePhraseKey, string>>>({
    'session.ready_to_start': runtimePhrases.resolve('session.ready_to_start').text
  });

  const getAudioService = useCallback(() => {
    if (!audioServiceRef.current) {
      const debugEnabled =
        typeof window !== 'undefined' &&
        (window as any).__RESONANCE_DEBUG === true;
      audioServiceRef.current = new AudioService({ debug: debugEnabled });
    }
    return audioServiceRef.current;
  }, []);

  const requestRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number>(0);

  const applyThemePreference = useCallback((mode: 'dark' | 'light') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = mode;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const resolvePhrase = useCallback((key: RuntimePhraseKey, vars?: Record<string, string | number>) => {
    const resolved = runtimePhrases.resolve(key, vars);
    if (resolved.source === 'fallback_en' && runtimePhrases.locale !== 'en') {
      setRuntimeFallbackCount(prev => prev + 1);
      trackEvent('runtime_translation_miss', { key, locale: runtimePhrases.locale });
    }
    return resolved;
  }, [runtimePhrases]);

  const getSafePhrase = useCallback((key: RuntimePhraseKey, vars?: Record<string, string | number>) => {
    const resolved = resolvePhrase(key, vars);
    if (resolved.source === 'fallback_en' && runtimePhrases.locale !== 'en') {
      return lastSafeRuntimeTextRef.current[key] || runtimePhrases.neutral(key);
    }
    lastSafeRuntimeTextRef.current[key] = resolved.text;
    return resolved.text;
  }, [resolvePhrase, runtimePhrases]);

  const setInstructionKey = useCallback((key: RuntimePhraseKey, vars?: Record<string, string | number>) => {
    setInstruction(getSafePhrase(key, vars));
  }, [getSafePhrase]);

  useEffect(() => {
    getAudioService().setThemeColor(themeColor);
  }, [getAudioService, themeColor]);

  useEffect(() => {
    getAudioService().setBreathingMode(activeMode);
  }, [getAudioService, activeMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (typeof window === 'undefined') return;

    const audio = getAudioService();

    const handleBackground = () => {
      if (!isRunning) return;
      setIsRunning(false);
      setInstructionKey('session.paused');
      void audio.fadeOutAndSuspend({ fadeSeconds: 0.25 });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleBackground();
      }
    };

    const handlePageHide = () => {
      handleBackground();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [getAudioService, isRunning, setInstructionKey]);

  // Proactively unlock mobile audio on the first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = getAudioService();
    let unlocked = false;

    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      void audio.resume();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void audio.resume();
      }
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [getAudioService]);

  useEffect(() => {
    if (soundHintVisible) {
      setSoundHintMounted(true);
      if (soundHintUnmountRef.current) window.clearTimeout(soundHintUnmountRef.current);
    } else if (soundHintMounted) {
      soundHintUnmountRef.current = window.setTimeout(() => setSoundHintMounted(false), 400);
    }
  }, [soundHintVisible, soundHintMounted]);

  useEffect(() => {
    return () => {
      if (soundHintTimeoutRef.current) window.clearTimeout(soundHintTimeoutRef.current);
      if (soundHintUnmountRef.current) window.clearTimeout(soundHintUnmountRef.current);
    };
  }, []);

  // --- Persistence Effects ---
  const settingsChangeCountRef = useRef(0);
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      mode: activeMode,
      speed: speedMultiplier,
      color: themeColor,
      duration: selectedDuration
    }));
    // Track settings changes for conversion trigger (skip initial mount)
    settingsChangeCountRef.current++;
    if (settingsChangeCountRef.current > 1) {
      onSettingsChange();
      syncSettings({ mode: activeMode, speed: speedMultiplier, duration: selectedDuration });
    }
  }, [activeMode, speedMultiplier, themeColor, selectedDuration, mounted, onSettingsChange, syncSettings]);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({
      totalMinutes,
      sessionsCompleted
    }));
  }, [totalMinutes, sessionsCompleted, mounted]);

  useEffect(() => {
    if (!mounted || !themeReady) return;
    if (themePreference === 'system') {
      localStorage.removeItem(STORAGE_KEYS.THEME);
    } else {
      localStorage.setItem(STORAGE_KEYS.THEME, themePreference);
    }
  }, [themePreference, mounted, themeReady]);

  // --- Haptics Effect ---
  useEffect(() => {
    if (!isRunning || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

    // Trigger haptics on phase change
    switch (phase) {
      case BreathingPhase.Inhale:
      case BreathingPhase.Inhale2:
        navigator.vibrate(100); // Short buzz to start
        break;
      case BreathingPhase.HoldIn:
      case BreathingPhase.HoldOut:
        // Heartbeat pattern
        navigator.vibrate([50, 100, 50]);
        break;
      case BreathingPhase.Exhale:
        navigator.vibrate(200); // Long grounding buzz
        break;
    }
  }, [phase, isRunning]);

  // forcedTheme overrides user preference (used for holiday pages)
  const activeTheme = forcedTheme ?? (themePreference === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themePreference);

  useEffect(() => {
    if (!themeReady) return;
    applyThemePreference(activeTheme);
  }, [activeTheme, applyThemePreference, themeReady]);

  // --- Logic ---

  const currentPattern = BREATHING_PATTERNS[activeMode];
  const isDarkTheme = activeTheme === 'dark';
  const appearanceLabel = themePreference === 'system'
    ? `Auto (${systemPrefersDark ? 'Dark' : 'Light'})`
    : themePreference === 'dark'
      ? 'Dark'
      : 'Light';

  const handleThemeToggle = useCallback(() => {
    setThemePreference(prev => {
      const current = prev === 'system' ? (systemPrefersDark ? 'dark' : 'light') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemPrefersDark]);

  const handleThemeReset = useCallback(() => {
    setThemePreference('system');
  }, []);

  const updateDurationParam = useCallback((value: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete('duration');
    } else {
      params.set('duration', String(value));
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleDurationSelect = useCallback((value: number | null) => {
    setSelectedDuration(value);
    updateDurationParam(value);
  }, [updateDurationParam]);

  // End the in-progress session. `hard` resets seconds + sessionId so a
  // future togglePlay starts fresh; soft (pause) keeps seconds + id so
  // resume picks up where the user left off, and a later commit only
  // credits the new delta (no double-count).
  const endSession = useCallback(
    (
      reason: 'paused' | 'completed' | 'mode_switched',
      seconds: number,
      hard: boolean
    ) => {
      const delta = seconds - sessionCommittedSeconds;
      let newMinutes = totalMinutes;
      let newSessions = sessionsCompleted;
      if (delta > 0) {
        newMinutes = totalMinutes + Math.floor(delta / 60);
        // Count the session exactly once — on the first commit. Subsequent
        // pause→resume→pause cycles update minutes but not the session count.
        if (sessionCommittedSeconds === 0) newSessions = sessionsCompleted + 1;
        setTotalMinutes(newMinutes);
        if (newSessions !== sessionsCompleted) setSessionsCompleted(newSessions);
        setSessionCommittedSeconds(seconds);
        if (reason === 'completed' || reason === 'mode_switched') {
          onSessionComplete(seconds);
        }
        syncStats(newMinutes, newSessions);
      }
      trackEvent('breathing_session_end', {
        mode: activeMode,
        reason,
        seconds_elapsed: seconds,
      });
      if (hard) {
        setSessionSeconds(0);
        setSessionId(null);
        setSessionCommittedSeconds(0);
      }
    },
    [
      activeMode,
      onSessionComplete,
      sessionCommittedSeconds,
      sessionsCompleted,
      syncStats,
      totalMinutes,
    ]
  );

  const handleTogglePlay = useCallback(async () => {
    const audio = getAudioService();
    if (!isRunning) {
      // Resume audio context first (critical for mobile)
      const resumed = await audio.resume();
      if (!resumed) {
        setInstructionKey('session.tap_enable_sound');
        return;
      }

      setIsRunning(true);
      // Only emit a fresh "start" + assign a new sessionId when this is a
      // true start (not a resume from pause). Resume keeps the same id so
      // the next end-commit credits only the new delta.
      const isResume = sessionId !== null && sessionSeconds > 0;
      if (!isResume) {
        setSessionId(
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        );
        setSessionCommittedSeconds(0);
        trackEvent('breathing_session_start', { mode: activeMode, duration: selectedDuration ?? 0 });
      }

      // Check if this is Wim Hof (protocol mode)
      if (activeMode === ModeName.WimHof) {
        setIsProtocolMode(true);
        setProtocolState({
          currentRound: 1,
          currentBreathIndex: 0,
          phase: ProtocolPhase.PowerBreathe,
          retentionTime: 0,
          isUserControlledHold: false
        });
        protocolPhaseStartRef.current = performance.now();
        setInstructionKey('protocol.power_breathe');

        // Wim Hof uses energizing drone + beta waves
        await audio.startDrone(themeColor);
        await audio.startBinaural(15); // Beta waves for alertness
        audio.playCue('inhale', themeColor);
      } else {
        // Normal pattern mode
        setIsProtocolMode(false);
        setPhase(BreathingPhase.Inhale);
        phaseStartRef.current = performance.now();

        // Adaptive Audio Logic
        if (activeMode === ModeName.Relax || activeMode === ModeName.Coherent) {
          // Relax/Coherent get Pink Noise (Rain)
          await audio.startPinkNoise();
          // Relax gets Delta Waves (Sleep), Coherent gets Alpha
          const hz = activeMode === ModeName.Relax ? 2 : 10;
          await audio.startBinaural(hz);
        } else {
          // Others get Drone Synth + Alpha
          await audio.startDrone(themeColor);
          await audio.startBinaural(10);
        }

        audio.playCue('inhale', themeColor);
        setInstructionKey('instruction.inhale_slowly');
      }

      if (isIOS && soundStatus !== 'confirmed') {
        setSoundHintVisible(true);
        setSoundHintMounted(true);
        if (soundHintTimeoutRef.current) window.clearTimeout(soundHintTimeoutRef.current);
        soundHintTimeoutRef.current = window.setTimeout(() => setSoundHintVisible(false), 4200);
      }
    } else {
      setIsRunning(false);
      setIsProtocolMode(false);
      setPhase(BreathingPhase.Idle);
      setInstructionKey('session.paused');
      // Soft end: commit elapsed time so a pause-and-walk-away still credits
      // minutes. Resume keeps sessionId + sessionSeconds, and the next commit
      // only credits the new delta — server's GREATEST guards against
      // double-counting if both fire.
      endSession('paused', sessionSeconds, false);
      audio.stopDrone();
      audio.stopPinkNoise();
      audio.stopBinaural();
      setScale(0);
    }
  }, [isRunning, activeMode, themeColor, getAudioService, isIOS, soundStatus, sessionSeconds, selectedDuration, setInstructionKey, sessionId, endSession]);

  const handleStop = () => {
    const audio = getAudioService();
    setIsRunning(false);
    setIsProtocolMode(false);
    setPhase(BreathingPhase.Idle);
    setProtocolState({
      currentRound: 1,
      currentBreathIndex: 0,
      phase: ProtocolPhase.Idle,
      retentionTime: 0,
      isUserControlledHold: false
    });
    setInstructionKey('session.ready_to_start');
    endSession('mode_switched', sessionSeconds, true);
    setScale(0);
    audio.stopDrone();
    audio.stopPinkNoise();
    audio.stopBinaural();
  };

  const handleModeSelect = useCallback(
    (mode: ModeName, options: { navigate?: boolean } = {}) => {
      trackEvent('mode_switch', { from: activeMode, to: mode });
      setActiveMode(mode);
      setAiReasoning(null);

      if (!isRunning) {
        setThemeColor(BREATHING_PATTERNS[mode].color);
      }

      const shouldNavigate = options.navigate ?? true;
      if (shouldNavigate) {
        const page = modeToBreathingPage[mode];
        if (page) {
          const target = `/breathe/${page.slug}`;
          if (pathname !== target) {
            router.push(target);
          }
        }
      }
    },
    [activeMode, isRunning, pathname, router]
  );

  const handleAIRecommendation = (rec: AIRecommendation) => {
    handleModeSelect(rec.recommendedMode);
    setThemeColor(rec.suggestedColor);
    setSpeedMultiplier(rec.suggestedSpeedMultiplier);
    setAiReasoning(rec.explanation);
    handleStop();
  };

  const markSoundConfirmed = () => {
    setSoundStatus('confirmed');
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SOUND_OK, 'true');
    }
  };

  const toggleMute = () => {
    const newMute = !muted;
    setMuted(newMute);
    getAudioService().toggleMute(newMute);
  };

  // --- The Loop ---
  const animate = useCallback((time: number) => {
    if (!isRunning) return;

    // Update 8D Spatial Audio Position
    const audio = getAudioService();
    audio.updateSpatial(time);

    const pattern = BREATHING_PATTERNS[activeMode];
    const inhaleDur = pattern.inhale * speedMultiplier * 1000;
    const inhale2Dur = (pattern.inhale2 || 0) * speedMultiplier * 1000;
    const holdInDur = pattern.holdIn * speedMultiplier * 1000;
    const exhaleDur = pattern.exhale * speedMultiplier * 1000;
    const holdOutDur = pattern.holdOut * speedMultiplier * 1000;

    const timeSincePhaseStart = time - phaseStartRef.current;

    let currentPhaseDuration = 0;
    let progress = 0;
    let nextPhase = phase;

    // --- State Machine ---

    if (phase === BreathingPhase.Inhale) {
      currentPhaseDuration = inhaleDur;
      progress = Math.min(timeSincePhaseStart / currentPhaseDuration, 1);

      // If there is a second inhale, only scale to 75%
      const maxScale = inhale2Dur > 0 ? 0.75 : 1.0;
      setScale(progress * maxScale);

      if (timeSincePhaseStart >= currentPhaseDuration) {
        // Check for Inhale 2 (Double Inhale)
        if (inhale2Dur > 0) {
          nextPhase = BreathingPhase.Inhale2;
          setInstructionKey('instruction.inhale_again');
        } else {
          nextPhase = holdInDur > 0 ? BreathingPhase.HoldIn : BreathingPhase.Exhale;
          setInstruction(holdInDur > 0 ? '' : getSafePhrase('instruction.exhale'));
          setScale(1);
        }
      }
    }
    else if (phase === BreathingPhase.Inhale2) {
      currentPhaseDuration = inhale2Dur;
      progress = Math.min(timeSincePhaseStart / currentPhaseDuration, 1);
      // Scale from 0.75 to 1.0
      setScale(0.75 + (progress * 0.25));

      if (timeSincePhaseStart >= currentPhaseDuration) {
        nextPhase = holdInDur > 0 ? BreathingPhase.HoldIn : BreathingPhase.Exhale;
        setInstruction(holdInDur > 0 ? '' : getSafePhrase('instruction.exhale_fully'));
        setScale(1);
      }
    }
    else if (phase === BreathingPhase.HoldIn) {
      currentPhaseDuration = holdInDur;
      progress = Math.min(timeSincePhaseStart / currentPhaseDuration, 1);
      setScale(1);

      if (timeSincePhaseStart >= currentPhaseDuration) {
        nextPhase = BreathingPhase.Exhale;
        setInstructionKey('instruction.exhale');
      }
    } else if (phase === BreathingPhase.Exhale) {
      currentPhaseDuration = exhaleDur;
      progress = Math.min(timeSincePhaseStart / currentPhaseDuration, 1);
      setScale(1 - progress);

      if (timeSincePhaseStart >= currentPhaseDuration) {
        nextPhase = holdOutDur > 0 ? BreathingPhase.HoldOut : BreathingPhase.Inhale;
        setInstruction(holdOutDur > 0 ? '' : getSafePhrase('instruction.inhale'));
        setScale(0);
      }
    } else if (phase === BreathingPhase.HoldOut) {
      currentPhaseDuration = holdOutDur;
      progress = Math.min(timeSincePhaseStart / currentPhaseDuration, 1);
      setScale(0);

      if (timeSincePhaseStart >= currentPhaseDuration) {
        nextPhase = BreathingPhase.Inhale;
        setInstructionKey('instruction.inhale');
      }
    }

    // Couple the pink-noise bed (Relax + Coherent) to breath progress.
    // No-op when noiseNode isn't running, so safe to call every frame.
    const pinkPhase: 'inhale' | 'exhale' | 'hold' =
      phase === BreathingPhase.Inhale || phase === BreathingPhase.Inhale2
        ? 'inhale'
        : phase === BreathingPhase.Exhale
          ? 'exhale'
          : 'hold';
    audio.updatePinkNoisePhase(pinkPhase, progress);

    if (nextPhase !== phase) {
      setPhase(nextPhase);
      phaseStartRef.current = time;

      if (nextPhase === BreathingPhase.Inhale || nextPhase === BreathingPhase.Inhale2) audio.playCue('inhale', themeColor);
      else if (nextPhase === BreathingPhase.Exhale) audio.playCue('exhale', themeColor);
      else audio.playCue('hold', themeColor);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [activeMode, getAudioService, getSafePhrase, isRunning, phase, setInstructionKey, speedMultiplier, themeColor]);

  // --- Wim Hof Protocol Animation ---
  const animateProtocol = useCallback((time: number) => {
    if (!isRunning || !isProtocolMode) return;

    const audio = getAudioService();
    audio.updateSpatial(time);

    const protocol = WIM_HOF_PROTOCOL;
    const { inhale, exhale } = protocol.powerBreathTiming;
    const inhaleDur = inhale * 1000;
    const exhaleDur = exhale * 1000;
    const breathCycleDur = inhaleDur + exhaleDur;
    const recoveryInhaleDur = protocol.recoveryTiming.inhale * 1000;
    const recoveryHoldDur = protocol.recoveryTiming.hold * 1000;

    const timeSincePhaseStart = time - protocolPhaseStartRef.current;

    setProtocolState(prev => {
      let next = { ...prev };

      if (prev.phase === ProtocolPhase.PowerBreathe) {
        // Calculate which breath we're on and progress within that breath
        const breathIndex = Math.floor(timeSincePhaseStart / breathCycleDur);
        const withinBreathTime = timeSincePhaseStart % breathCycleDur;

        if (breathIndex >= protocol.powerBreathCount) {
          // Done with power breaths, transition to retention hold
          next.phase = ProtocolPhase.RetentionHold;
          next.retentionTime = 0;
          next.isUserControlledHold = true;
          retentionStartRef.current = time;
          protocolPhaseStartRef.current = time;
          setInstructionKey('instruction.hold_your_breath');
          audio.playCue('hold', themeColor);
          setScale(0); // Empty lungs
        } else {
          next.currentBreathIndex = breathIndex + 1;

          // Animate the breath
          if (withinBreathTime < inhaleDur) {
            const progress = withinBreathTime / inhaleDur;
            setScale(progress);
          } else {
            const progress = (withinBreathTime - inhaleDur) / exhaleDur;
            setScale(1 - progress);
          }
        }
      }
      else if (prev.phase === ProtocolPhase.RetentionHold) {
        const holdSeconds = Math.floor((time - retentionStartRef.current) / 1000);
        next.retentionTime = holdSeconds;

        // Update instruction with timer
        const mins = Math.floor(holdSeconds / 60);
        const secs = holdSeconds % 60;
        setInstruction(`${mins}:${String(secs).padStart(2, '0')}`);

        // Auto-end at max hold time
        if (holdSeconds >= protocol.retentionHoldMax) {
          next.phase = ProtocolPhase.RecoveryInhale;
          protocolPhaseStartRef.current = time;
          setInstructionKey('instruction.deep_breath_in');
          audio.playCue('inhale', themeColor);
        }
      }
      else if (prev.phase === ProtocolPhase.RecoveryInhale) {
        const progress = Math.min(timeSincePhaseStart / recoveryInhaleDur, 1);
        setScale(progress);

        if (timeSincePhaseStart >= recoveryInhaleDur) {
          next.phase = ProtocolPhase.RecoveryHold;
          protocolPhaseStartRef.current = time;
          setInstructionKey('instruction.hold');
          audio.playCue('hold', themeColor);
        }
      }
      else if (prev.phase === ProtocolPhase.RecoveryHold) {
        setScale(1);
        const holdProgress = timeSincePhaseStart / recoveryHoldDur;

        if (timeSincePhaseStart >= recoveryHoldDur) {
          // Check if more rounds
          if (prev.currentRound < protocol.rounds) {
            next.currentRound = prev.currentRound + 1;
            next.currentBreathIndex = 0;
            next.phase = ProtocolPhase.RoundComplete;
            protocolPhaseStartRef.current = time;
            setInstructionKey('protocol.round_complete', { round: prev.currentRound });
            setScale(0.5);
          } else {
            // Protocol complete
            next.phase = ProtocolPhase.ProtocolComplete;
            setInstructionKey('protocol.complete');
            setScale(0.5);
            // Stop the session
            setIsRunning(false);
            audio.stopDrone();
            audio.stopBinaural();
          }
        }
      }
      else if (prev.phase === ProtocolPhase.RoundComplete) {
        // Brief pause between rounds
        if (timeSincePhaseStart >= protocol.roundRestDuration * 1000) {
          next.phase = ProtocolPhase.PowerBreathe;
          protocolPhaseStartRef.current = time;
          // Clean instruction to allow getLabel() to show Inhale/Exhale
          setInstruction('');
          audio.playCue('inhale', themeColor);
        }
      }

      // Sync the visual effect phase (particles/bg) with the protocol phase
      let nextVisualPhase = phase;
      if (next.phase === ProtocolPhase.PowerBreathe) {
        // Determine if inhaling or exhaling within power breath
        const { inhale } = protocol.powerBreathTiming;
        const inhaleDur = inhale * 1000;
        const breathCycleDur = (inhale * 1000) + (protocol.powerBreathTiming.exhale * 1000);
        const withinBreathTime = (time - protocolPhaseStartRef.current) % breathCycleDur;

        if (withinBreathTime < inhaleDur) nextVisualPhase = BreathingPhase.Inhale;
        else nextVisualPhase = BreathingPhase.Exhale;
      }
      else if (next.phase === ProtocolPhase.RetentionHold) {
        nextVisualPhase = BreathingPhase.HoldOut;
      }
      else if (next.phase === ProtocolPhase.RecoveryInhale) {
        nextVisualPhase = BreathingPhase.Inhale;
      }
      else if (next.phase === ProtocolPhase.RecoveryHold) {
        nextVisualPhase = BreathingPhase.HoldIn;
      }

      if (nextVisualPhase !== phase) {
        setPhase(nextVisualPhase);
      }

      return next;
    });

    requestRef.current = requestAnimationFrame(animateProtocol);
  }, [isRunning, isProtocolMode, getAudioService, phase, setInstructionKey, themeColor]);

  // End hold button handler for Wim Hof
  const handleEndHold = useCallback(() => {
    if (!isProtocolMode || protocolState.phase !== ProtocolPhase.RetentionHold) return;

    const audio = getAudioService();
    setProtocolState(prev => ({
      ...prev,
      phase: ProtocolPhase.RecoveryInhale,
      isUserControlledHold: false
    }));
    protocolPhaseStartRef.current = performance.now();
    setInstructionKey('instruction.deep_breath_in');
    audio.playCue('inhale', themeColor);
  }, [isProtocolMode, protocolState.phase, getAudioService, setInstructionKey, themeColor]);

  useEffect(() => {
    if (isRunning) {
      if (isProtocolMode) {
        requestRef.current = requestAnimationFrame(animateProtocol);
      } else {
        requestRef.current = requestAnimationFrame(animate);
      }
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, animate, animateProtocol, isProtocolMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setSessionSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-stop when targetDuration is reached
  useEffect(() => {
    if (typeof selectedDuration === 'number' && isRunning && sessionSeconds >= selectedDuration) {
      const audio = getAudioService();
      setIsRunning(false);
      setPhase(BreathingPhase.Idle);
      setInstructionKey('session.complete');
      endSession('completed', sessionSeconds, true);
      // Stop all audio
      audio.stopDrone();
      audio.stopPinkNoise();
      audio.stopBinaural();
    }
  }, [selectedDuration, isRunning, sessionSeconds, getAudioService, setInstructionKey, endSession]);

  useEffect(() => {
    if (!isRunning && !aiReasoning) {
      setThemeColor(BREATHING_PATTERNS[activeMode].color);
    }
  }, [activeMode, isRunning, aiReasoning]);

  useEffect(() => {
    if (!immersive || typeof document === 'undefined') return;
    const body = document.body;
    if (isRunning) {
      body.dataset.resonanceImmersive = 'true';
      document.documentElement.style.setProperty('--immersive-color', toRgba(themeColor, 0.3));
    } else {
      delete body.dataset.resonanceImmersive;
      document.documentElement.style.removeProperty('--immersive-color');
    }
    return () => {
      delete body.dataset.resonanceImmersive;
      document.documentElement.style.removeProperty('--immersive-color');
    };
  }, [immersive, isRunning, themeColor]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const event = new CustomEvent('resonance:run-state', { detail: { running: isRunning } });
    window.dispatchEvent(event);
  }, [isRunning]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__resonanceRuntimeTranslation = {
      locale: runtimePhrases.locale,
      fallbackCount: runtimeFallbackCount
    };
  }, [runtimeFallbackCount, runtimePhrases.locale]);

  useEffect(() => {
    trackEvent('page_viewed_breathing', { mode: activeMode, page: pathname });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStartRequest = () => {
      if (!isRunning) {
        handleTogglePlay();
      }
    };
    window.addEventListener('resonance:start', handleStartRequest);
    return () => window.removeEventListener('resonance:start', handleStartRequest);
  }, [isRunning, handleTogglePlay]);

  const getPhaseLabel = (p: BreathingPhase) => {
    if (p === BreathingPhase.Idle) return getSafePhrase('phase.ready');
    if (p === BreathingPhase.HoldIn || p === BreathingPhase.HoldOut) return getSafePhrase('phase.hold');
    if (p === BreathingPhase.Inhale2) return getSafePhrase('phase.inhale_again');
    if (p === BreathingPhase.Inhale) return getSafePhrase('phase.inhale');
    if (p === BreathingPhase.Exhale) return getSafePhrase('phase.exhale');
    return getSafePhrase('phase.ready');
  };

  const durationSummary = selectedDuration === null
    ? 'Open'
    : selectedDuration % 60 === 0
      ? `${selectedDuration / 60} min`
      : `${selectedDuration}s`;

  // --- Helper for Stats ---
  const renderStats = () => {
    const p = BREATHING_PATTERNS[activeMode];
    const isRelax = activeMode === ModeName.Relax;
    const isWimHof = activeMode === ModeName.WimHof;

    // Wim Hof has special stats display
    if (isWimHof) {
      return (
        <div className="mt-4 rounded-lg bg-card/70 p-3 text-xs text-muted-foreground shadow-inner backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:bg-card/30">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-border/60">
            <div>
              <span className="block font-bold text-card-foreground">{WIM_HOF_PROTOCOL.rounds}</span>
              <span className="text-[10px] uppercase tracking-wide">Rounds</span>
            </div>
            <div>
              <span className="block font-bold text-card-foreground">{WIM_HOF_PROTOCOL.powerBreathCount}</span>
              <span className="text-[10px] uppercase tracking-wide">Breaths</span>
            </div>
            <div>
              <span className="block font-bold text-card-foreground">~15min</span>
              <span className="text-[10px] uppercase tracking-wide">Duration</span>
            </div>
          </div>
          <div className="border-t border-border/60 pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-primary" />
              <span className="font-semibold text-card-foreground">Beta Waves (15Hz)</span>
              <span className="ml-auto text-muted-foreground">Alertness</span>
            </div>
            <div className="flex items-center gap-2">
              <Waves size={12} className="text-primary" />
              <span className="font-medium text-card-foreground">Drone Synth</span>
              <span className="ml-auto text-muted-foreground">8D Audio</span>
            </div>
          </div>
        </div>
      );
    }

    const waveType = isRelax ? "Delta Waves (2Hz)" : "Alpha Waves (10Hz)";
    const waveDesc = isRelax ? "Deep Sleep" : "Flow State";
    const ambienceType = (activeMode === ModeName.Relax || activeMode === ModeName.Coherent) ? "Pink Noise (Rain)" : "Drone Synth";

    return (
      <div className="mt-4 rounded-lg bg-card/70 p-3 text-xs text-muted-foreground shadow-inner backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:bg-card/30">
        <div className="grid grid-cols-4 gap-2 text-center divide-x divide-border/60">
          <div>
            <span className="block font-bold text-card-foreground">{(p.inhale * speedMultiplier).toFixed(1)}s</span>
            <span className="text-[10px] uppercase tracking-wide">Inhale</span>
          </div>
          {p.holdIn > 0 && (
            <div>
              <span className="block font-bold text-card-foreground">{(p.holdIn * speedMultiplier).toFixed(1)}s</span>
              <span className="text-[10px] uppercase tracking-wide">Hold</span>
            </div>
          )}
          <div>
            <span className="block font-bold text-card-foreground">{(p.exhale * speedMultiplier).toFixed(1)}s</span>
            <span className="text-[10px] uppercase tracking-wide">Exhale</span>
          </div>
          {p.holdOut > 0 && (
            <div>
              <span className="block font-bold text-card-foreground">{(p.holdOut * speedMultiplier).toFixed(1)}s</span>
              <span className="text-[10px] uppercase tracking-wide">Hold</span>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-primary" />
            <span className="font-semibold text-card-foreground">{waveType}</span>
            <span className="ml-auto text-muted-foreground">{waveDesc}</span>
          </div>
          <div className="flex items-center gap-2">
            {ambienceType.includes("Rain") ? <Wind size={12} className="text-primary" /> : <Waves size={12} className="text-primary" />}
            <span className="font-medium text-card-foreground">{ambienceType}</span>
            <span className="ml-auto text-muted-foreground">8D Audio</span>
          </div>
        </div>
      </div>
    )
  }

  if (!mounted) return null;

  // Winter blue background: deep navy that works well with snow
  const winterBlueBase = '#0c1929';
  const winterBlueActive = '#0f1f33';

  const getBackgroundColor = () => {
    if (backgroundVariant === 'winter-blue') {
      return isRunning ? winterBlueActive : winterBlueBase;
    }
    return isRunning ? `${themeColor}1a` : undefined;
  };

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${backgroundVariant === 'winter-blue' ? '' : 'bg-background'} transition-colors duration-1000 ${className}`}
      style={{ backgroundColor: getBackgroundColor() }}
      data-runtime-locale={runtimePhrases.locale}
      data-runtime-fallback-count={runtimeFallbackCount}
    >

      {snowMode ? (
        <SnowBackground
          tone={activeTheme}
          speedMultiplier={speedMultiplier}
          phase={phase}
        />
      ) : (
        <ParticleBackground phase={phase} color={themeColor} speedMultiplier={speedMultiplier} />
      )}

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-end gap-2 p-6">
        {!embedMode && <LanguageSwitcherInline />}
        {!embedMode && (
          <>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-card/80 shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40"
                  aria-label="Account menu"
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="h-[calc(100%-8px)] w-[calc(100%-8px)] rounded-full object-cover" />
                  ) : (
                    <span className="flex h-[calc(100%-8px)] w-[calc(100%-8px)] items-center justify-center rounded-full text-xs font-medium text-card-foreground">
                      {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-10 z-50 min-w-[200px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur-2xl">
                    <p className="truncate px-2 text-sm font-medium text-card-foreground">{user.name || 'Account'}</p>
                    <p className="truncate px-2 text-xs text-muted-foreground">{user.email}</p>
                    <div className="my-2 h-px bg-border/60" />
                    <button
                      onClick={() => { setShowUserMenu(false); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-card-foreground"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSignInSheet(true)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border/60 bg-card/80 px-4 text-sm font-medium text-card-foreground shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40"
                aria-label="Sign up"
              >
                Sign up
              </button>
            )}
            <button
              onClick={() => setControlsOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-border/60 bg-card/80 p-2.5 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40 dark:text-card-foreground"
              aria-label="Settings"
            >
              <SettingsIcon size={16} />
            </button>
          </>
        )}
      </header>

      <main className={`relative z-10 flex flex-1 flex-col items-center justify-center sm:pb-0 ${noMobileBottomPad ? 'pb-24' : 'pb-44'}`}>
        {/* Protocol UI: Round and breath counter */}
        {isProtocolMode && isRunning && (
          <div className="absolute top-8 left-0 right-0 z-20 flex flex-col items-center gap-2">
            <div className="rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-card-foreground backdrop-blur">
              {getSafePhrase('ui.round_of', { current: protocolState.currentRound, total: WIM_HOF_PROTOCOL.rounds })}
            </div>
            {protocolState.phase === ProtocolPhase.PowerBreathe && (
              <div className="text-xs text-muted-foreground">
                {getSafePhrase('ui.breath_of', { current: protocolState.currentBreathIndex, total: WIM_HOF_PROTOCOL.powerBreathCount })}
              </div>
            )}
          </div>
        )}

        <Visualizer
          phase={phase}
          scale={scale}
          color={themeColor}
          label={
            isProtocolMode && protocolState.phase === ProtocolPhase.PowerBreathe
              ? getPhaseLabel(phase)
              : instruction || getPhaseLabel(phase)
          }
          instructions={
            isProtocolMode && isRunning && protocolState.phase === ProtocolPhase.PowerBreathe
              ? getSafePhrase('ui.power_breath')
              : ''
          }
          progress={0}
          isRunning={isRunning}
          onClick={handleTogglePlay}
        />

        {/* Duration chips — visible before session starts */}
        {!isRunning && (
          <div className="mt-5 flex items-center gap-1.5">
            {DURATION_OPTIONS.filter(o => o.value !== null).map((option) => {
              const isSelected = selectedDuration === option.value;
              return (
                <button
                  key={option.label}
                  onClick={() => handleDurationSelect(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-card/80 text-card-foreground shadow-sm backdrop-blur'
                      : 'text-muted-foreground hover:text-card-foreground'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {/* End Hold button for Wim Hof retention phase */}
        {isProtocolMode && protocolState.phase === ProtocolPhase.RetentionHold && protocolState.retentionTime >= WIM_HOF_PROTOCOL.retentionHoldMin && (
          <button
            onClick={handleEndHold}
            className="mt-6 rounded-full bg-card/90 px-6 py-3 text-sm font-semibold text-card-foreground shadow-lg backdrop-blur transition-all hover:bg-card hover:scale-105 active:scale-95"
            style={{ borderColor: themeColor, borderWidth: 2 }}
          >
            {getSafePhrase('ui.end_hold_recovery')}
          </button>
        )}
      </main>

      {soundHintMounted && (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 transition-all duration-500 ease-out">
          <div
            className={`pointer-events-auto max-w-md rounded-2xl bg-card/90 px-4 py-3 text-sm text-card-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/70 transition-all duration-500 ease-out ${soundHintVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
          >
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="shrink-0" style={{ color: themeColor }} />
              <span>{getSafePhrase('ui.sound_hint_no_audio')}</span>
            </div>
          </div>
        </div>
      )}

      <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
        <SheetContent side="right" className="bg-transparent shadow-none outline-none border-0 p-0">
          <div className="fixed right-4 top-4 z-50 w-[360px] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] rounded-[32px] border border-border/70 bg-background/95 p-7 text-foreground shadow-[0_35px_90px_rgba(15,23,42,0.25)] backdrop-blur-2xl flex flex-col overflow-hidden sm:right-6 sm:top-20 sm:max-h-[calc(100vh-5rem)]">
            <SheetHeader className="mb-6 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl font-semibold text-card-foreground">Settings</SheetTitle>
                  <p className="text-sm text-muted-foreground">Adjust modes, pacing, and personalization.</p>
                </div>
                <SheetClose asChild>
                  <button className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-card-foreground transition-colors">
                    <X size={20} />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto pb-12 min-h-0">
              <div className="flex flex-col gap-4 rounded-2xl bg-card/70 p-4 shadow-inner dark:bg-card/30">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Session</p>
                  <p className="text-3xl font-semibold text-card-foreground tabular-nums">
                    {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={toggleMute}
                    className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${muted ? 'bg-foreground text-background' : 'bg-card text-card-foreground'
                      }`}
                  >
                    {muted ? 'Sound Off' : 'Sound On'}
                  </button>
                </div>
                {soundStatus !== 'confirmed' && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground shadow-inner dark:border-border/40 dark:bg-background/20">
                    <p className="font-semibold text-card-foreground">No sound? Flip your mute switch off and raise volume.</p>
                    <p>iOS Safari can silence Web Audio when the ringer is off. Try the side switch/volume buttons, then tap Play again.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={markSoundConfirmed}
                        className="flex-1 rounded-lg bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm"
                      >
                        I heard it
                      </button>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-background/50 p-3 text-sm text-muted-foreground shadow-inner dark:bg-background/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Appearance</p>
                      <p className="text-base font-semibold text-card-foreground">{appearanceLabel}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDarkTheme}
                      onClick={handleThemeToggle}
                      className={`relative inline-flex h-9 w-16 items-center rounded-full border border-border/60 px-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border/40 ${isDarkTheme ? 'bg-primary/80 text-primary-foreground' : 'bg-muted'}`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-transform ${isDarkTheme ? 'translate-x-6' : 'translate-x-0'}`}
                      >
                        {isDarkTheme ? <Moon size={16} /> : <Sun size={16} />}
                      </span>
                    </button>
                  </div>
                  {themePreference !== 'system' ? (
                    <button
                      type="button"
                      onClick={handleThemeReset}
                      className="mt-2 text-left text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-2 transition hover:text-card-foreground"
                    >
                      Match system default
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Following your device preference.</p>
                  )}
                </div>

                <div className="rounded-2xl bg-background/50 p-3 text-sm text-muted-foreground shadow-inner dark:bg-background/20">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Session length</p>
                    <p className="text-xs text-muted-foreground">{durationSummary}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((option) => {
                      const isActive = selectedDuration === option.value;
                      return (
                        <button
                          key={option.label}
                          onClick={() => handleDurationSelect(option.value)}
                          disabled={isRunning}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${isActive
                            ? 'bg-card text-card-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-card/60 dark:hover:bg-card/30'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {isRunning && (
                    <p className="mt-2 text-xs text-muted-foreground">Pause to change the session length.</p>
                  )}
                </div>
              </div>
              {aiReasoning && (
                <div className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-card-foreground shadow-sm dark:bg-card/30">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-primary">
                    AI Suggestion
                    <button onClick={() => setAiReasoning(null)} className="text-muted-foreground underline hover:text-primary">
                      Dismiss
                    </button>
                  </div>
                  {aiReasoning}
                </div>
              )}

              {!isRunning ? (
                <>
                  <div className="glass-panel flex flex-wrap justify-between gap-1 rounded-2xl p-2">
                    {Object.values(BREATHING_PATTERNS)
                      .filter(m => {
                        const hideUnlessActive = [
                          ModeName.WimHof,
                          ModeName.Tummo,
                          ModeName.BreathOfFire,
                          ModeName.NadiShodhana,
                          ModeName.Ujjayi,
                          ModeName.Buteyko,
                        ];
                        if (hideUnlessActive.includes(m.name)) {
                          return activeMode === m.name || defaultMode === m.name;
                        }
                        return true;
                      })
                      .map((m) => {
                        // Short labels for mode buttons
                        let label = m.name.split(' ')[0];
                        if (m.name === ModeName.Sigh) label = 'Sigh';
                        if (m.name === ModeName.WimHof) label = 'Wim Hof';
                        if (m.name === ModeName.Tummo) label = 'Tummo';
                        if (m.name === ModeName.BreathOfFire) label = 'Fire';

                        return (
                          <button
                            key={m.name}
                            onClick={() => handleModeSelect(m.name)}
                            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${activeMode === m.name
                              ? 'bg-card text-card-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-card/60 dark:hover:bg-card/30'
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                  </div>

                  <div className="space-y-4 rounded-2xl bg-card/70 p-4 shadow-inner dark:bg-card/30">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pattern</p>
                      <p className="text-base text-card-foreground">{currentPattern.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Speed</span>
                        <span className="text-sm text-card-foreground">{speedMultiplier.toFixed(1)}s per phase</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Turtle className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={speedMultiplier}
                          onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                          aria-label="Breath speed"
                        />
                        <Rabbit className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground dark:bg-muted/30">
                  Pause the session to switch modes, adjust pacing, or change length.
                </div>
              )}

              {showSettingsNudge && !isAuthenticated && (
                <ConversionNudge
                  onSignIn={() => {
                    dismissSettings();
                    setShowSignInSheet(true);
                  }}
                  onDismiss={dismissSettings}
                />
              )}

              {renderStats()}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {!embedMode && (
        <SessionCompletePrompt
          open={showSessionPrompt}
          onOpenChange={setShowSessionPrompt}
          onDismiss={dismissSession}
          onSuccess={markConverted}
          totalMinutes={totalMinutes}
          sessionSeconds={sessionSeconds}
        />
      )}

      {!embedMode && (
        <SignInSheet
          open={showSignInSheet}
          onOpenChange={setShowSignInSheet}
          onSuccess={markConverted}
        />
      )}
    </div>
  );
};

export default Resonance;
