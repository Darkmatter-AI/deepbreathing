import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, Activity, Waves, Wind, Sun, Moon, Turtle, Rabbit, X, Settings as SettingsIcon } from 'lucide-react';
import { BreathingPhase, ModeName, ProtocolPhase, ProtocolState } from './types';
import { BREATHING_PATTERNS, DEFAULT_SPEED_MULTIPLIER, WIM_HOF_PROTOCOL } from './constants';
import { AudioService } from './services/audioService';
import Visualizer from './components/Visualizer';
import ParticleBackground from './components/ParticleBackground';
import SnowBackground from './components/SnowBackground';
import { createRuntimePhraseResolver, RuntimePhraseKey } from './runtime-phrases';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from './ui/sheet';

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
  onSessionComplete?: (seconds: number) => void;
  onEvent?: (name: string, params?: Record<string, any>) => void;
  className?: string;
  noMobileBottomPad?: boolean;
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

  useEffect(() => {
    setMounted(true);

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (!effectiveDefaultMode && parsed.mode) setActiveMode(parsed.mode);
      if (parsed.speed) setSpeedMultiplier(parsed.speed);
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
      setTotalMinutes(parsed.totalMinutes || 0);
      setSessionsCompleted(parsed.sessionsCompleted || 0);
    }

    const soundFlag = localStorage.getItem(STORAGE_KEYS.SOUND_OK);
    if (soundFlag === 'true') {
      setSoundStatus('confirmed');
    }
  }, [effectiveDefaultMode]);

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

  // React Native app lifecycle bridge: pause + suspend audio when the host
  // app backgrounds, resume audio when it returns to the foreground.
  useEffect(() => {
    if (appState === 'background') {
      const audio = getAudioService();
      if (isRunning) {
        setIsRunning(false);
        setInstructionKey('session.paused');
        void audio.fadeOutAndSuspend({ fadeSeconds: 0.25 });
      }
    } else if (appState === 'active') {
      void getAudioService().resume();
    }
  }, [appState, getAudioService, isRunning, setInstructionKey]);

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
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      mode: activeMode,
      speed: speedMultiplier,
      color: themeColor,
      duration: selectedDuration
    }));
  }, [activeMode, speedMultiplier, themeColor, selectedDuration, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({
      totalMinutes,
      sessionsCompleted
    }));
  }, [totalMinutes, sessionsCompleted, mounted]);

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
          onSessionComplete?.(seconds);
        }
      }
      onEvent?.('breathing_session_end', {
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
      onEvent,
      sessionCommittedSeconds,
      sessionsCompleted,
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
  }, [isRunning, activeMode, themeColor, getAudioService, isIOS, soundStatus, sessionSeconds, selectedDuration, setInstructionKey, sessionId, endSession, onEvent]);

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
    (mode: ModeName) => {
      onEvent?.('mode_switch', { from: activeMode, to: mode });
      setActiveMode(mode);

      if (!isRunning) {
        setThemeColor(BREATHING_PATTERNS[mode].color);
      }
    },
    [activeMode, isRunning, onEvent]
  );

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

  const durationSummary = useMemo(() => {
    if (selectedDuration === null) return getSafePhrase('ui.open');
    if (selectedDuration % 60 === 0) {
      return getSafePhrase('ui.duration_min', { n: selectedDuration / 60 });
    }
    return getSafePhrase('ui.duration_sec', { n: selectedDuration });
  }, [selectedDuration, getSafePhrase]);

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
        <button
          onClick={() => setControlsOpen(true)}
          className="inline-flex items-center justify-center rounded-full border border-border/60 bg-card/80 p-2.5 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-card dark:border-border/40 dark:bg-card/40 dark:text-card-foreground"
          aria-label={getSafePhrase('ui.settings')}
        >
          <SettingsIcon size={16} />
        </button>
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
            {durationOptions.filter(o => o.value !== null).map((option) => {
              const isSelected = selectedDuration === option.value;
              return (
                <button
                  key={option.value ?? 'open'}
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
                  <SheetTitle className="text-xl font-semibold text-card-foreground">{getSafePhrase('ui.settings')}</SheetTitle>
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
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{getSafePhrase('ui.session_length')}</p>
                    <p className="text-xs text-muted-foreground">{durationSummary}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {durationOptions.map((option) => {
                      const isActive = selectedDuration === option.value;
                      return (
                        <button
                          key={option.value ?? 'open'}
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
                    <p className="mt-2 text-xs text-muted-foreground">{getSafePhrase('ui.pause_to_change')}</p>
                  )}
                </div>
              </div>

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
                          return activeMode === m.name || effectiveDefaultMode === m.name;
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
                  {getSafePhrase('ui.pause_session_to_switch')}
                </div>
              )}

              {renderStats()}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BreathingExperience;
