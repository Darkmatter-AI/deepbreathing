import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, Activity, Waves, Wind, Sun, Moon, X, Settings as SettingsIcon } from 'lucide-react';
import { BreathingPhase, ModeName, ProtocolPhase, ProtocolState, BreathingPattern } from './types';
import { BREATHING_PATTERNS, DEFAULT_SPEED_MULTIPLIER, WIM_HOF_PROTOCOL } from './constants';
import { AudioService } from './services/audioService';
import {
  clampSpeed,
  phaseDurationMs,
  remapPhaseStartMs,
  sliderFillPercent,
  sliderToMultiplier,
  multiplierToSlider,
  speedOf,
  SLIDER_MIN,
  SLIDER_MAX,
  SLIDER_STEP,
} from './pacing';
import Visualizer from './components/Visualizer';
import ParticleBackground from './components/ParticleBackground';
import SnowBackground from './components/SnowBackground';
import { createRuntimePhraseResolver, RuntimePhraseKey } from './runtime-phrases';
import { seedLocalStorageFromSnapshot, shouldMirrorPersist } from '../../breathing/persist-seed';
import {
  commitPracticeStats,
  hydrateTotalSeconds,
  type SessionEndReason,
} from '../../breathing/practice-stats';
import { getPhaseAudioCue } from '../../breathing/phase-feedback';

const STORAGE_KEYS = {
  STATS: 'resonance_stats',
  SETTINGS: 'resonance_settings',
  THEME: 'resonance_theme',
  SOUND_OK: 'resonance_sound_ok'
};

interface BreathingExperienceProps {
  defaultMode?: ModeName;
  initialMode?: ModeName;
  initialDuration?: number | null;
  locale?: string;
  forcedTheme?: 'light' | 'dark';
  immersive?: boolean;
  snowMode?: boolean;
  backgroundVariant?: 'default' | 'winter-blue';
  appState?: 'active' | 'background';
  onSessionComplete?: (
    seconds: number,
    stats: { totalMinutes: number; sessionsCompleted: number; sessionMode: string },
  ) => void;
  onEvent?: (name: string, params?: Record<string, any>) => void;
  className?: string;
  noMobileBottomPad?: boolean;
  isNativeApp?: boolean;
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
  /** Native AsyncStorage mirror — seeds localStorage when empty (app only). */
  initialPersistedSnapshot?: Partial<Record<string, string | null>>;
}

// Valid duration values in seconds (clamped to prevent abuse)
const VALID_DURATIONS = [30, 60, 180, 300, 600] as const;
const MAX_DURATION = 600; // 10 minutes max
const DEFAULT_DURATION = 60; // 1 min default for new users



const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface PaceSliderProps {
  value: number;
  onChange: (value: number) => void;
  accent: string;
  /** Bare mode (floating control): no label, no number — the track's
   *  opacity fill is the only readout. Settings keeps the labeled row. */
  minimal?: boolean;
}

// Single pace slider (one measure: 0.5×–2×). The track is a hairline line
// tinted with the mode color; the portion up to the thumb renders at high
// opacity and the rest at low, so the "extended opacity" IS the speed readout.
// Stays live during a session — the engine re-anchors the current phase so
// changes apply in real time.
const PaceSlider: React.FC<PaceSliderProps> = ({ value, onChange, accent, minimal = false }) => {
  // value = duration multiplier (internal); the slider position is mapped so
  // LEFT = slower (2×), MIDDLE = default (1×), RIGHT = faster (0.5×), and the
  // label reads as speed (1/multiplier).
  const sliderValue = multiplierToSlider(value);
  const pct = sliderFillPercent(sliderValue);
  // Secondary control: hairline track, mostly transparent; the thumb blends
  // with the background instead of shouting in the mode color.
  const track = `linear-gradient(to right, ${toRgba(accent, 0.5)} 0%, ${toRgba(accent, 0.5)} ${pct}%, ${toRgba(accent, 0.12)} ${pct}%, ${toRgba(accent, 0.12)} 100%)`;
  const slider = (
    <input
      type="range"
      min={String(SLIDER_MIN)}
      max={String(SLIDER_MAX)}
      step={String(SLIDER_STEP)}
      value={sliderValue}
      onChange={(e) => onChange(sliderToMultiplier(parseFloat(e.target.value)))}
      className="h-1 w-full cursor-pointer appearance-none rounded-full"
      style={{ background: track, accentColor: 'hsl(var(--background))' }}
      aria-label="Breath speed"
    />
  );
  if (minimal) {
    return (
      <div className="space-y-1.5">
        <span className="block text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
          Speed
        </span>
        {slider}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/90">Speed</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
          {speedOf(value).toFixed(1)}×
        </span>
      </div>
      {slider}
    </div>
  );
};

const BreathingExperience: React.FC<BreathingExperienceProps> = ({
  className = '',
  defaultMode,
  initialMode,
  initialDuration,
  locale = 'en',
  forcedTheme = 'dark',
  immersive = false,
  snowMode = false,
  backgroundVariant = 'default',
  appState = 'active',
  onSessionComplete,
  onEvent,
  noMobileBottomPad = false,
  isNativeApp = false,
  safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 },
  initialPersistedSnapshot,
}) => {
  // `defaultMode` and `initialMode` are aliases — the dom wrapper passes
  // `initialMode`. effectiveDefaultMode carries the full lock semantics
  // (suppress saved settings, force hidden-unless-active modes); when both
  // are omitted, saved localStorage restores as before.
  const effectiveDefaultMode = defaultMode ?? initialMode;

  // --- State ---
  const resolvedInitialMode = effectiveDefaultMode ?? ModeName.Box;
  const [selectedDuration, setSelectedDuration] = useState<number | null>(() => initialDuration ?? DEFAULT_DURATION);
  const [activeMode, setActiveMode] = useState<ModeName>(resolvedInitialMode);
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED_MULTIPLIER);
  const [themeColor, setThemeColor] = useState(BREATHING_PATTERNS[resolvedInitialMode].color);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  // Identity of the in-progress session. Set on first start, kept across
  // pause/resume, cleared on hard-end (complete/mode-switch). committed
  // tracks how many seconds of THIS session have already been credited
  // to totalMinutes — so resume → next pause only commits the new delta.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCommittedSeconds, setSessionCommittedSeconds] = useState(0);
  const isIOS = useMemo(
    () => (typeof navigator !== 'undefined' ? /iP(hone|od|ad)/i.test(navigator.userAgent) : false),
    []
  );

  // Client-side hydration check
  const [mounted, setMounted] = useState(false);
  const storageHydratedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (isNativeApp && initialPersistedSnapshot) {
      seedLocalStorageFromSnapshot(
        Object.values(STORAGE_KEYS),
        initialPersistedSnapshot,
        localStorage,
      );
    }

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (!effectiveDefaultMode && parsed.mode) setActiveMode(parsed.mode);
      if (parsed.phaseSpeeds && typeof parsed.phaseSpeeds === 'object') {
        // One-time migration: earlier builds stored per-phase speeds; fold
        // them into the single measure by averaging.
        const ps = parsed.phaseSpeeds as Record<string, unknown>;
        const vals = [ps.inhale, ps.hold, ps.exhale].filter(
          (v): v is number => typeof v === 'number' && Number.isFinite(v),
        );
        setSpeedMultiplier(clampSpeed(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1));
      } else if (parsed.speed) {
        setSpeedMultiplier(clampSpeed(parsed.speed));
      }
      if (!effectiveDefaultMode && parsed.color) setThemeColor(parsed.color);
    } else if (!effectiveDefaultMode) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setThemeColor("#0d9488");
      else if (hour >= 18 || hour < 5) setThemeColor("#ea580c");
    }

    if (effectiveDefaultMode) {
      setActiveMode(effectiveDefaultMode);
      setThemeColor(BREATHING_PATTERNS[effectiveDefaultMode].color);
    }

    const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const hydratedSeconds = hydrateTotalSeconds(parsed.totalMinutes || 0, parsed.totalSeconds);
      setTotalSeconds(hydratedSeconds);
      setTotalMinutes(Math.floor(hydratedSeconds / 60));
      setSessionsCompleted(parsed.sessionsCompleted || 0);
    }

    const soundFlag = localStorage.getItem(STORAGE_KEYS.SOUND_OK);
    if (soundFlag === 'true') {
      setSoundStatus('confirmed');
    }

    storageHydratedRef.current = true;
  }, [effectiveDefaultMode, isNativeApp, initialPersistedSnapshot]);

  useEffect(() => {
    // An explicit initialDuration (passed from native) wins over the
    // localStorage-persisted duration — mirrors the original URL-param
    // precedence (durationFromUrl beat the saved value).
    if (!mounted || initialDuration != null) return;
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
  }, [mounted, initialDuration]);

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
  // In-app light/dark override (null = follow the native/device theme prop).
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);
  const [soundStatus, setSoundStatus] = useState<'unknown' | 'confirmed'>('unknown');
  const [soundHintVisible, setSoundHintVisible] = useState(false);
  const [soundHintMounted, setSoundHintMounted] = useState(false);

  // Animation State
  const [scale, setScale] = useState(0);
  // Session clock 0..1 for the ring dot (wall-clock; reaches the top when the
  // chosen duration elapses). Frozen while paused, reset on stop/complete.
  const [sessionProgress, setSessionProgress] = useState(0);
  const [runtimeLocale] = useState(locale);
  const runtimePhrases = useMemo(() => createRuntimePhraseResolver(runtimeLocale), [runtimeLocale]);
  const [instruction, setInstruction] = useState(() => runtimePhrases.resolve('session.ready_to_start').text);
  const [runtimeFallbackCount, setRuntimeFallbackCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Refs
  const audioServiceRef = useRef<AudioService | null>(null);
  const soundHintTimeoutRef = useRef<number | null>(null);
  const soundHintUnmountRef = useRef<number | null>(null);
  const lastSafeRuntimeTextRef = useRef<Partial<Record<RuntimePhraseKey, string>>>({
    'session.ready_to_start': runtimePhrases.resolve('session.ready_to_start').text
  });

  // --- Orb drag ("pull the ball") -------------------------------------------
  // The ball assembly (Visualizer's inner layer) follows the finger while the
  // outer ring stays anchored; particles get pulled along via the layer's
  // live rect (see ParticleBackground's orb anchor). A drag past ~10px
  // suppresses the tap-to-toggle so pulling never accidentally starts/pauses.
  // On release the ball returns with a slow, accelerating ease (long dwell at
  // the start, then a quick pull home with a gentle overshoot settle).
  const orbBallRef = useRef<HTMLDivElement>(null);
  const orbDragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: 0 });
  const suppressClickRef = useRef(false);
  const ORB_RETURN_CURVE = 'transform 760ms cubic-bezier(0.55, 0.04, 0.62, 1.14)';

  // Outer ring as a slow lagging follower. While the ball is pulled it eases
  // toward the ball's offset (rate ~4.5/s); on release it drifts back home at
  // a slower rate (~2.2/s) than the ball's spring-back, so the ring visibly
  // trails the ball both ways.
  const ringLayerRef = useRef<HTMLDivElement>(null);
  const ringOffsetRef = useRef({ x: 0, y: 0 });
  const ringTargetRef = useRef({ x: 0, y: 0 });
  const ringChaseRef = useRef<number | null>(null);
  const ringLastTsRef = useRef(0);

  const chaseRing = useCallback((now: number) => {
    const el = ringLayerRef.current;
    if (!el) {
      ringChaseRef.current = null;
      return;
    }
    const dt = ringLastTsRef.current
      ? Math.min(Math.max((now - ringLastTsRef.current) / 1000, 0.001), 0.05)
      : 0.016;
    ringLastTsRef.current = now;
    const cur = ringOffsetRef.current;
    const target = ringTargetRef.current;
    const rate = target.x === 0 && target.y === 0 ? 2.2 : 4.5;
    const k = 1 - Math.exp(-rate * dt);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
    if (Math.abs(target.x - cur.x) > 0.4 || Math.abs(target.y - cur.y) > 0.4) {
      ringChaseRef.current = requestAnimationFrame(chaseRing);
    } else {
      cur.x = target.x;
      cur.y = target.y;
      el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      ringChaseRef.current = null;
    }
  }, []);

  const ensureRingChase = useCallback(() => {
    if (ringChaseRef.current === null) {
      ringLastTsRef.current = 0;
      ringChaseRef.current = requestAnimationFrame(chaseRing);
    }
  }, [chaseRing]);

  // Stop the ring chase when the component unmounts.
  useEffect(() => {
    return () => {
      if (ringChaseRef.current !== null) cancelAnimationFrame(ringChaseRef.current);
    };
  }, []);

  const orbPointerDown = useCallback((e: PointerEvent) => {
    const el = orbBallRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Only start a "pull" when the press lands on the ball itself (or its
    // immediate halo). Anything else is background particle interaction.
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) > r.width / 2 + 12) return;
    orbDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, moved: 0 };
    // Don't clear the return transition yet — a plain tap mid-return should
    // let the ball keep gliding home. It is cleared on the first real move.
  }, []);

  const orbPointerMove = useCallback((e: PointerEvent) => {
    const drag = orbDragRef.current;
    const el = orbBallRef.current;
    if (!drag.dragging || !el) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 4) {
      // A real pull starts: drop any running return transition, then follow.
      if (el.style.transition) el.style.transition = 'none';
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      // Ring target: it eases out from center to track the ball.
      ringTargetRef.current = { x: dx, y: dy };
      ensureRingChase();
    }
  }, [ensureRingChase]);

  const orbPointerUp = useCallback(() => {
    const drag = orbDragRef.current;
    const el = orbBallRef.current;
    if (!drag.dragging) return;
    drag.dragging = false;
    if (drag.moved > 10) suppressClickRef.current = true;
    if (el && drag.moved > 4) {
      // Slow, accelerating return: ease-in-heavy curve with a small overshoot
      // so the ball glides back and settles with a hint of bounce.
      el.style.transition = ORB_RETURN_CURVE;
      el.style.transform = 'translate3d(0, 0, 0)';
      // The ring keeps trailing behind and then drifts home at its own pace.
      ringTargetRef.current = { x: 0, y: 0 };
      ensureRingChase();
    }
  }, [ensureRingChase]);

  useEffect(() => {
    window.addEventListener('pointerdown', orbPointerDown, { passive: true });
    window.addEventListener('pointermove', orbPointerMove, { passive: true });
    window.addEventListener('pointerup', orbPointerUp, { passive: true });
    window.addEventListener('pointercancel', orbPointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', orbPointerDown);
      window.removeEventListener('pointermove', orbPointerMove);
      window.removeEventListener('pointerup', orbPointerUp);
      window.removeEventListener('pointercancel', orbPointerUp);
    };
  }, [orbPointerDown, orbPointerMove, orbPointerUp]);

  const getAudioService = useCallback(() => {
    if (!audioServiceRef.current) {
      const debugEnabled =
        typeof window !== 'undefined' &&
        (window as any).__RESONANCE_DEBUG === true;
      audioServiceRef.current = new AudioService({ debug: debugEnabled });
    }
    return audioServiceRef.current;
  }, []);

  const startSoundscape = useCallback(async (mode: ModeName, color: string) => {
    if (isNativeApp) return;
    const audio = getAudioService();
    if (mode === ModeName.WimHof) {
      await audio.startDrone(color);
      await audio.startBinaural(15);
      return;
    }
    if (mode === ModeName.Relax || mode === ModeName.Coherent) {
      await audio.startPinkNoise();
      await audio.startBinaural(mode === ModeName.Relax ? 2 : 10);
      return;
    }
    await audio.startDrone(color);
    await audio.startBinaural(10);
  }, [getAudioService, isNativeApp]);

  const playPhaseCue = useCallback((nextPhase: BreathingPhase) => {
    const cue = getPhaseAudioCue(nextPhase);
    if (!cue) return;

    // Keep the audio cue and native haptic dispatch in the same JS turn. The
    // native host uses a single selection tick, while supported web browsers get
    // a minimal 10 ms vibration. Do not fire feedback while backgrounded.
    if (!isNativeApp) getAudioService().playCue(cue, themeColor);
    if (appState !== 'active') return;
    onEvent?.('phase_haptic', { phase: nextPhase, color: themeColor });
    if (!isNativeApp && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  }, [appState, getAudioService, isNativeApp, onEvent, themeColor]);

  const requestRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number>(0);
  const sessionClockStartRef = useRef<number>(0);
  const sessionSecondsRef = useRef(0);
  const lastExternalModeRef = useRef<ModeName | undefined>(effectiveDefaultMode);
  const previousAppStateRef = useRef(appState);
  sessionSecondsRef.current = sessionSeconds;

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

  const durationOptions = useMemo(() => {
    const labelFor = (seconds: number) =>
      seconds < 60
        ? getSafePhrase('ui.duration_sec', { n: seconds })
        : getSafePhrase('ui.duration_min', { n: seconds / 60 });
    return [
      { label: getSafePhrase('ui.open'), value: null as number | null },
      ...VALID_DURATIONS.map((duration) => ({
        label: labelFor(duration),
        value: duration
      }))
    ];
  }, [getSafePhrase]);

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
    if (isNativeApp) return;

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
  }, [getAudioService, isNativeApp, isRunning, setInstructionKey]);

  // The native app keeps the logical session running while the screen is
  // locked. WebKit suspends Web Audio in the background, so the host takes over
  // with a native ambient loop until foregrounding, when we rebuild the web
  // soundscape at the wall-clock-correct phase. Browser tabs still pause.
  useEffect(() => {
    if (previousAppStateRef.current === appState) return;
    previousAppStateRef.current = appState;

    if (appState === 'background') {
      const audio = getAudioService();
      if (isRunning) {
        if (!isNativeApp) {
          setIsRunning(false);
          setInstructionKey('session.paused');
        }
        void audio.fadeOutAndSuspend({ fadeSeconds: 0.25 });
      }
    } else if (appState === 'active') {
      const audio = getAudioService();
      void audio.resume().then((ready) => {
        if (ready && isNativeApp && isRunning) {
          void startSoundscape(activeMode, themeColor);
        }
      });
    }
  }, [
    activeMode,
    appState,
    getAudioService,
    isNativeApp,
    isRunning,
    setInstructionKey,
    startSoundscape,
    themeColor,
  ]);

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
  const mirrorPersist = useCallback(
    (key: string, value: string) => {
      if (!shouldMirrorPersist(isNativeApp, storageHydratedRef.current)) return;
      onEvent?.('persist', { key, value });
    },
    [isNativeApp, onEvent],
  );

  useEffect(() => {
    if (!mounted) return;
    const value = JSON.stringify({
      mode: activeMode,
      speed: speedMultiplier,
      color: themeColor,
      duration: selectedDuration
    });
    localStorage.setItem(STORAGE_KEYS.SETTINGS, value);
    mirrorPersist(STORAGE_KEYS.SETTINGS, value);
  }, [activeMode, speedMultiplier, themeColor, selectedDuration, mounted, mirrorPersist]);

  useEffect(() => {
    if (!mounted) return;
    const value = JSON.stringify({
      totalMinutes,
      totalSeconds,
      sessionsCompleted
    });
    localStorage.setItem(STORAGE_KEYS.STATS, value);
    mirrorPersist(STORAGE_KEYS.STATS, value);
  }, [totalMinutes, totalSeconds, sessionsCompleted, mounted, mirrorPersist]);

  // --- Keep-awake bridge ---
  // Tell the native host whether a session is actively running so it can keep the
  // screen awake while breathing and let it sleep when paused/stopped. Keyed off
  // isRunning (not the session_start/end analytics events) because a resume from
  // pause does NOT re-fire 'breathing_session_start' — keying off those would let
  // the screen sleep after the first pause→resume. Harmless on web (host no-ops).
  useEffect(() => {
    onEvent?.('keep_awake', { active: isRunning });
  }, [isRunning, onEvent]);

  // Settings visibility bridge: the native host layers its own overlays (mode
  // drawer, account button) above this webview, so it must know when the
  // full-page settings covers the screen to get them out of the way.
  useEffect(() => {
    onEvent?.('settings_open', { open: controlsOpen });
  }, [controlsOpen, onEvent]);

  // Keyboard escape hatch for the full-page settings — matters on the web
  // target where the removed Radix Sheet used to provide it.
  useEffect(() => {
    if (!controlsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setControlsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controlsOpen]);

  // Native background-audio handoff. sessionSeconds is intentionally read from
  // a ref so this only crosses the DOM bridge when playback state/config changes,
  // not once per second.
  useEffect(() => {
    if (!isNativeApp) return;
    onEvent?.('audio_state', {
      active: isRunning,
      muted,
      mode: activeMode,
      elapsedSeconds: sessionSecondsRef.current,
      duration: selectedDuration,
    });
  }, [activeMode, isNativeApp, isRunning, muted, onEvent, selectedDuration]);

  // Theme: in-app toggle wins, else the native/device theme prop.
  const activeTheme = themeOverride ?? forcedTheme;

  useEffect(() => {
    applyThemePreference(activeTheme);
  }, [activeTheme, applyThemePreference]);

  // --- Logic ---

  const currentPattern = BREATHING_PATTERNS[activeMode];

  const handleDurationSelect = useCallback((value: number | null) => {
    setSelectedDuration(value);
  }, []);

  // End the in-progress session. `hard` resets seconds + sessionId so a
  // future togglePlay starts fresh; soft (pause) keeps seconds + id so
  // resume picks up where the user left off, and a later commit only
  // credits the new delta (no double-count).
  const endSession = useCallback(
    (
      reason: SessionEndReason,
      seconds: number,
      hard: boolean
    ) => {
      const delta = seconds - sessionCommittedSeconds;
      if (delta > 0) {
        const nextStats = commitPracticeStats(
          { totalSeconds, sessionsCompleted },
          {
            sessionSeconds: seconds,
            sessionCommittedSeconds,
            reason,
          },
        );
        setTotalSeconds(nextStats.totalSeconds);
        setTotalMinutes(nextStats.totalMinutes);
        setSessionsCompleted(nextStats.sessionsCompleted);
        setSessionCommittedSeconds(seconds);
        if (reason === 'completed') {
          onSessionComplete?.(seconds, {
            totalMinutes: nextStats.totalMinutes,
            sessionsCompleted: nextStats.sessionsCompleted,
            sessionMode: activeMode,
          });
        }
      }
      onEvent?.('breathing_session_end', {
        mode: activeMode,
        reason,
        seconds_elapsed: seconds,
      });
      if (hard) {
        setSessionSeconds(0);
        sessionClockStartRef.current = 0;
        setSessionId(null);
        setSessionCommittedSeconds(0);
      }
    },
    [
      activeMode,
      onSessionComplete,
      onEvent,
      sessionCommittedSeconds,
      sessionsCompleted,
      totalSeconds,
    ]
  );

  // The native mode library changes initialMode after mount. If a user switches
  // while paused, the previous implementation kept the old session id and
  // elapsed seconds, then resumed them under the new mode. Treat an external
  // mode change as a hard boundary so one practice session never spans patterns.
  useEffect(() => {
    if (!mounted || !effectiveDefaultMode) return;
    if (lastExternalModeRef.current === effectiveDefaultMode) return;
    lastExternalModeRef.current = effectiveDefaultMode;

    if (sessionId !== null) {
      const audio = getAudioService();
      setIsRunning(false);
      setIsProtocolMode(false);
      setPhase(BreathingPhase.Idle);
      setInstructionKey('session.ready_to_start');
      endSession('mode_switched', sessionSeconds, true);
      setScale(0);
      setSessionProgress(0);
      audio.stopDrone();
      audio.stopPinkNoise();
      audio.stopBinaural();
    }

    setActiveMode(effectiveDefaultMode);
    setThemeColor(BREATHING_PATTERNS[effectiveDefaultMode].color);
  }, [
    effectiveDefaultMode,
    endSession,
    getAudioService,
    mounted,
    sessionId,
    sessionSeconds,
    setInstructionKey,
  ]);

  const handleTogglePlay = useCallback(async () => {
    // A drag that pulled the ball shouldn't toggle the session.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
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
      sessionClockStartRef.current = Date.now() - (sessionSeconds * 1000);
      if (!isResume) {
        setSessionId(
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        );
        setSessionCommittedSeconds(0);
        onEvent?.('breathing_session_start', { mode: activeMode, duration: selectedDuration ?? 0 });
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

        await startSoundscape(activeMode, themeColor);
        playPhaseCue(BreathingPhase.Inhale);
      } else {
        // Normal pattern mode
        setIsProtocolMode(false);
        setPhase(BreathingPhase.Inhale);
        phaseStartRef.current = performance.now();

        await startSoundscape(activeMode, themeColor);
        playPhaseCue(BreathingPhase.Inhale);
        setInstructionKey('instruction.inhale_slowly');
      }

      if (isIOS && soundStatus !== 'confirmed') {
        setSoundHintVisible(true);
        setSoundHintMounted(true);
        if (soundHintTimeoutRef.current) window.clearTimeout(soundHintTimeoutRef.current);
        soundHintTimeoutRef.current = window.setTimeout(() => setSoundHintVisible(false), 4200);
      }
    } else {
      const currentSessionSeconds = sessionClockStartRef.current > 0
        ? Math.max(sessionSeconds, Math.floor((Date.now() - sessionClockStartRef.current) / 1000))
        : sessionSeconds;
      setIsRunning(false);
      setIsProtocolMode(false);
      setPhase(BreathingPhase.Idle);
      setInstructionKey('session.paused');
      // Soft end: commit elapsed time so a pause-and-walk-away still credits
      // practice time. Resume keeps sessionId + sessionSeconds, and the next
      // commit only credits the new delta.
      setSessionSeconds(currentSessionSeconds);
      endSession('paused', currentSessionSeconds, false);
      audio.stopDrone();
      audio.stopPinkNoise();
      audio.stopBinaural();
      setScale(0);
    }
  }, [isRunning, activeMode, themeColor, getAudioService, isIOS, soundStatus, sessionSeconds, selectedDuration, setInstructionKey, sessionId, endSession, onEvent, playPhaseCue, startSoundscape]);

  const handleStop = () => {
    const audio = getAudioService();
    setIsRunning(false);
    setSessionProgress(0);
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

  const toggleMute = () => {
    const newMute = !muted;
    setMuted(newMute);
    getAudioService().toggleMute(newMute);
  };

  // Last frame's phase duration/progress — the pace-remap effect reads these
  // to re-anchor phaseStartRef without a scale jump.
  const lastPhaseDurationRef = useRef(0);

  // Haptic tick for the speed slider — fires only when the slider position
  // actually changes by at least one step (0.05), throttled to ~1 per 35 ms
  // so fast drags don't spam.  Emitted via the onEvent bridge so the native
  // host can fire Haptics.selectionAsync() for tactile "adapting on the go".
  const paceHapticLastPosRef = useRef<number>(multiplierToSlider(DEFAULT_SPEED_MULTIPLIER));
  const paceHapticLastTimeRef = useRef<number>(0);

  const handlePaceSliderChange = useCallback(
    (newMultiplier: number) => {
      setSpeedMultiplier(newMultiplier);
      const pos = multiplierToSlider(newMultiplier);
      const now = performance.now();
      if (
        Math.abs(pos - paceHapticLastPosRef.current) >= SLIDER_STEP &&
        now - paceHapticLastTimeRef.current >= 35
      ) {
        paceHapticLastPosRef.current = pos;
        paceHapticLastTimeRef.current = now;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[pace_haptic] tick at pos', pos.toFixed(2), 'mult', newMultiplier.toFixed(2));
        }
        onEvent?.('pace_haptic', { value: newMultiplier });
        if (!isNativeApp) {
          navigator.vibrate?.(5);
        }
      }
    },
    [isNativeApp, onEvent],
  );

  // --- The Loop ---
  const animate = useCallback((time: number) => {
    if (!isRunning) return;

    // Session dot: wall-clock progress toward the chosen duration.
    if (typeof selectedDuration === 'number' && selectedDuration > 0 && sessionClockStartRef.current > 0) {
      setSessionProgress(
        Math.min(Math.max((Date.now() - sessionClockStartRef.current) / 1000 / selectedDuration, 0), 1),
      );
    }

    // Update 8D Spatial Audio Position
    const audio = getAudioService();
    audio.updateSpatial(time);

    const pattern = BREATHING_PATTERNS[activeMode];
    const inhaleDur = phaseDurationMs(BreathingPhase.Inhale, pattern, speedMultiplier);
    const inhale2Dur = phaseDurationMs(BreathingPhase.Inhale2, pattern, speedMultiplier);
    const holdInDur = phaseDurationMs(BreathingPhase.HoldIn, pattern, speedMultiplier);
    const exhaleDur = phaseDurationMs(BreathingPhase.Exhale, pattern, speedMultiplier);
    const holdOutDur = phaseDurationMs(BreathingPhase.HoldOut, pattern, speedMultiplier);

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

    if (nextPhase !== phase) {
      setPhase(nextPhase);
      phaseStartRef.current = time;

      playPhaseCue(nextPhase);
    }

    lastPhaseDurationRef.current = currentPhaseDuration;

    requestRef.current = requestAnimationFrame(animate);
  }, [activeMode, getAudioService, getSafePhrase, isRunning, phase, phaseDurationMs, playPhaseCue, selectedDuration, setInstructionKey, speedMultiplier]);

  // --- Wim Hof Protocol Animation ---
  const animateProtocol = useCallback((time: number) => {
    if (!isRunning || !isProtocolMode) return;

    const audio = getAudioService();
    audio.updateSpatial(time);

    const protocol = WIM_HOF_PROTOCOL;
    const { inhale, exhale } = protocol.powerBreathTiming;
    const inhaleDur = inhale * speedMultiplier * 1000;
    const exhaleDur = exhale * speedMultiplier * 1000;
    const breathCycleDur = inhaleDur + exhaleDur;
    const recoveryInhaleDur = protocol.recoveryTiming.inhale * speedMultiplier * 1000;
    const recoveryHoldDur = protocol.recoveryTiming.hold * speedMultiplier * 1000;

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
          playPhaseCue(BreathingPhase.HoldOut);
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
          playPhaseCue(BreathingPhase.Inhale);
        }
      }
      else if (prev.phase === ProtocolPhase.RecoveryInhale) {
        const progress = Math.min(timeSincePhaseStart / recoveryInhaleDur, 1);
        setScale(progress);

        if (timeSincePhaseStart >= recoveryInhaleDur) {
          next.phase = ProtocolPhase.RecoveryHold;
          protocolPhaseStartRef.current = time;
          setInstructionKey('instruction.hold');
          playPhaseCue(BreathingPhase.HoldIn);
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
          playPhaseCue(BreathingPhase.Inhale);
        }
      }

      // Sync the visual effect phase (particles/bg) with the protocol phase
      let nextVisualPhase = phase;
      if (next.phase === ProtocolPhase.PowerBreathe) {
        // Determine if inhaling or exhaling within power breath
        const { inhale } = protocol.powerBreathTiming;
        const inhaleDur = inhale * speedMultiplier * 1000;
        const breathCycleDur = (inhale * speedMultiplier * 1000) + (protocol.powerBreathTiming.exhale * speedMultiplier * 1000);
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
  }, [isRunning, isProtocolMode, getAudioService, phase, playPhaseCue, setInstructionKey, speedMultiplier]);

  // End hold button handler for Wim Hof
  const handleEndHold = useCallback(() => {
    if (!isProtocolMode || protocolState.phase !== ProtocolPhase.RetentionHold) return;

    setProtocolState(prev => ({
      ...prev,
      phase: ProtocolPhase.RecoveryInhale,
      isUserControlledHold: false
    }));
    protocolPhaseStartRef.current = performance.now();
    setInstructionKey('instruction.deep_breath_in');
    playPhaseCue(BreathingPhase.Inhale);
  }, [isProtocolMode, protocolState.phase, playPhaseCue, setInstructionKey]);

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

  // Live pace change mid-phase: re-anchor phaseStartRef so the CURRENT phase
  // keeps its progress fraction at the new duration instead of jumping the
  // orb. The next animation frame then continues at the new pace seamlessly.
  useEffect(() => {
    if (!isRunning || isProtocolMode || phase === BreathingPhase.Idle) return;
    const prevDur = lastPhaseDurationRef.current;
    if (prevDur <= 0) return;
    const now = performance.now();
    const newDur = phaseDurationMs(phase, BREATHING_PATTERNS[activeMode], speedMultiplier);
    phaseStartRef.current = remapPhaseStartMs(now, phaseStartRef.current, prevDur, speedMultiplier, phase, BREATHING_PATTERNS[activeMode]);
    lastPhaseDurationRef.current = newDur;
  }, [activeMode, isProtocolMode, isRunning, phase, speedMultiplier]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        if (sessionClockStartRef.current <= 0) return;
        setSessionSeconds(Math.max(0, Math.floor((Date.now() - sessionClockStartRef.current) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-stop when targetDuration is reached
  useEffect(() => {
    if (typeof selectedDuration === 'number' && isRunning && sessionSeconds >= selectedDuration) {
      const audio = getAudioService();
      setIsRunning(false);
      setSessionProgress(0);
      setPhase(BreathingPhase.Idle);
      // Native app shows its own summary card — suppress the webview overlay text.
      if (!isNativeApp) setInstructionKey('session.complete');
      endSession('completed', selectedDuration, true);
      setScale(0);
      // Stop all audio
      audio.stopDrone();
      audio.stopPinkNoise();
      audio.stopBinaural();
    }
  }, [selectedDuration, isRunning, sessionSeconds, getAudioService, setInstructionKey, endSession, isNativeApp]);

  useEffect(() => {
    if (!isRunning) {
      setThemeColor(BREATHING_PATTERNS[activeMode].color);
    }
  }, [activeMode, isRunning]);

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
    onEvent?.('page_viewed_breathing', { mode: activeMode });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPhaseLabel = (p: BreathingPhase) => {
    if (p === BreathingPhase.Idle) return getSafePhrase('phase.ready');
    if (p === BreathingPhase.HoldIn || p === BreathingPhase.HoldOut) return getSafePhrase('phase.hold');
    if (p === BreathingPhase.Inhale2) return getSafePhrase('phase.inhale_again');
    if (p === BreathingPhase.Inhale) return getSafePhrase('phase.inhale');
    if (p === BreathingPhase.Exhale) return getSafePhrase('phase.exhale');
    return getSafePhrase('phase.ready');
  };

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
        <ParticleBackground
          phase={phase}
          color={themeColor}
          speedMultiplier={speedMultiplier}
          orbRef={orbBallRef}
        />
      )}

      <header
        className={`fixed inset-x-0 top-0 z-30 flex items-center justify-end gap-2 p-6 transition-all duration-700 ease-out ${
          isRunning ? 'pointer-events-none -translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{
          paddingTop: safeAreaInsets.top + 24,
          paddingRight: safeAreaInsets.right + 24,
          paddingLeft: safeAreaInsets.left + 24,
        }}
      >
          <button
            onClick={() => setControlsOpen(true)}
            tabIndex={isRunning ? -1 : 0}
            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-card/80 p-3 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40 dark:text-card-foreground"
            aria-label={getSafePhrase('ui.settings')}
          >
            <SettingsIcon size={18} />
          </button>
        </header>

      <main
        className={`relative z-10 flex flex-1 flex-col items-center justify-center sm:pb-0 ${noMobileBottomPad ? 'pb-24' : 'pb-44'}`}
        style={{ touchAction: 'none' }}
      >
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
          dragRef={orbBallRef}
          ringRef={ringLayerRef}
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
          sessionProgress={sessionId !== null && typeof selectedDuration === 'number' ? sessionProgress : null}
          isRunning={isRunning}
          onClick={handleTogglePlay}
        />

        {/* Duration chips — fade out on session start. Stays mounted so the
            layout doesn't reflow and shift the visualizer mid-transition. */}
        <div
          className={`mt-5 flex items-center gap-1.5 transition-all duration-700 ease-out ${
            isRunning ? 'pointer-events-none translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          aria-hidden={isRunning}
        >
          {durationOptions.filter(o => o.value !== null).map((option) => {
            const isSelected = selectedDuration === option.value;
            return (
              <button
                key={option.value ?? 'open'}
                onClick={() => handleDurationSelect(option.value)}
                tabIndex={isRunning ? -1 : 0}
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

      {soundHintMounted && !isNativeApp && (
        <div
          className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 transition-all duration-500 ease-out"
          style={{
            bottom: safeAreaInsets.bottom + 24,
            paddingRight: safeAreaInsets.right + 16,
            paddingLeft: safeAreaInsets.left + 16,
          }}
        >
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

      {/* Live pace control — no toggle, no panel: the bare slider just sits
          at the bottom while a session exists (running or paused) so the user
          can adapt the speed on the go. Writes speedMultiplier, which the
          animation loop applies on the next frame (current phase re-anchored,
          no jump). */}
      {(isRunning || sessionId !== null) && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-12"
          style={{ paddingBottom: safeAreaInsets.bottom + 14 }}
        >
          <div className="pointer-events-auto w-full max-w-[12rem]">
            <PaceSlider
              value={speedMultiplier}
              onChange={handlePaceSliderChange}
              accent={themeColor}
              minimal
            />
          </div>
        </div>
      )}

      {controlsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={getSafePhrase('ui.settings')}
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
          style={{
            paddingTop: safeAreaInsets.top + 20,
            paddingBottom: safeAreaInsets.bottom + 16,
            paddingLeft: safeAreaInsets.left + 24,
            paddingRight: safeAreaInsets.right + 24,
          }}
        >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">{getSafePhrase('ui.settings')}</h2>
                <p className="text-sm text-muted-foreground">Sound, pacing, and appearance.</p>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-card-foreground transition-colors"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>
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
                    {muted ? getSafePhrase('ui.sound_off') : getSafePhrase('ui.sound_on')}
                  </button>
                  <button
                    onClick={() => setThemeOverride(activeTheme === 'dark' ? 'light' : 'dark')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-medium text-card-foreground transition"
                    aria-label="Toggle light or dark theme"
                  >
                    {activeTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {activeTheme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-card/70 p-4 shadow-inner dark:bg-card/30">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pattern</p>
                  <p className="text-base text-card-foreground">{currentPattern.description}</p>
                </div>
                <PaceSlider
                  value={speedMultiplier}
                  onChange={handlePaceSliderChange}
                  accent={themeColor}
                />
              </div>

              {renderStats()}

              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground dark:border-border/40 dark:bg-background/20">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-card-foreground">Safety</p>
                <p>
                  Keep every breath comfortable. Stop if you feel dizzy or unwell. This app provides general breathing guidance, not medical advice.
                </p>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BreathingExperience;
