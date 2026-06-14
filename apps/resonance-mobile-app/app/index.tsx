import { Canvas, Circle, LinearGradient, Rect, Path, vec } from '@shopify/react-native-skia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BreathingPhase,
  DEFAULT_SPEED_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
  MIN_SPEED_MULTIPLIER,
  ModeName,
  BREATHING_PATTERNS,
  getPhaseVisualState,
  updatePhase,
  ProtocolPhase,
  ProtocolState,
  WIM_HOF_PROTOCOL,
} from '@resonance/engine';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, Switch, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { playCue } from '@/lib/audio';
import { createModeTheme, createNightModeTheme } from '@/lib/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MODE_LIST = [
  ModeName.Box,
  ModeName.Relax,
  ModeName.Coherent,
  ModeName.Sigh,
  ModeName.WimHof,
] as const;
const DURATION_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Open', value: null },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

const STORAGE_KEYS = {
  settings: 'resonance_settings',
  stats: 'resonance_stats',
};

const KeepAwakeGuard = () => {
  useKeepAwake('resonance-session');
  return null;
};

const getNow = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
};

const SPEED_PER_SECOND = 60;

const createParticle = (width: number, height: number): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 3 + 1.2,
  speedX: Math.random() * 0.5 - 0.25,
  speedY: Math.random() * 0.5 - 0.25,
  alpha: Math.random() * 0.5 + 0.1,
});

const resetParticleToEdge = (particle: Particle, width: number, height: number) => {
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    particle.x = Math.random() * width;
    particle.y = 0;
  } else if (edge === 1) {
    particle.x = width;
    particle.y = Math.random() * height;
  } else if (edge === 2) {
    particle.x = Math.random() * width;
    particle.y = height;
  } else {
    particle.x = 0;
    particle.y = Math.random() * height;
  }
  particle.alpha = 0;
};

const resetParticleToCenter = (particle: Particle, width: number, height: number) => {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 50;
  particle.x = width / 2 + Math.cos(angle) * radius;
  particle.y = height / 2 + Math.sin(angle) * radius;
  particle.alpha = 0;
};

const updateParticle = (
  particle: Particle,
  radialSpeed: number,
  driftSpeed: number,
  deltaSeconds: number,
  width: number,
  height: number
) => {
  if (particle.alpha < 0.6) {
    particle.alpha += 0.01;
  }

  const cx = width / 2;
  const cy = height / 2;
  const dx = particle.x - cx;
  const dy = particle.y - cy;
  const dist = Math.hypot(dx, dy);

  if (dist > 0.1) {
    const uX = dx / dist;
    const uY = dy / dist;
    const radialStep = radialSpeed * deltaSeconds;
    particle.x += uX * radialStep;
    particle.y += uY * radialStep;
  }

  const driftStep = driftSpeed * deltaSeconds;
  particle.x += particle.speedX * driftStep;
  particle.y += particle.speedY * driftStep;

  if (radialSpeed < -1 && dist < 30) {
    resetParticleToEdge(particle, width, height);
    return;
  }

  if (radialSpeed > 1 && (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height)) {
    resetParticleToCenter(particle, width, height);
    return;
  }

  if (particle.x < 0) particle.x = width;
  if (particle.x > width) particle.x = 0;
  if (particle.y < 0) particle.y = height;
  if (particle.y > height) particle.y = 0;
};

const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const blobSize = Math.min(width - 72, 320);
  const blobCanvasPadding = 72;
  const blobCanvasSize = blobSize + blobCanvasPadding * 2;

  const colorScheme = useColorScheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  const [mode, setMode] = useState<ModeName>(ModeName.Box);
  const [phase, setPhase] = useState<BreathingPhase>(BreathingPhase.Idle);
  const [scale, setScale] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [protocolState, setProtocolState] = useState<ProtocolState>({
    currentRound: 1,
    currentBreathIndex: 0,
    phase: ProtocolPhase.Idle,
    retentionTime: 0,
    isUserControlledHold: false,
  });
  const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED_MULTIPLIER);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [particleFrame, setParticleFrame] = useState(0);

  const phaseRef = useRef(phase);
  const phaseStartRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const sessionSecondsRef = useRef(0);
  const isRunningRef = useRef(isRunning);
  const protocolPhaseStartRef = useRef<number | null>(null);
  const retentionStartRef = useRef(0);
  const speedMultiplierRef = useRef(speedMultiplier);
  const particlesRef = useRef<Particle[]>([]);
  const particleBoundsRef = useRef({ width: 0, height: 0 });
  const lastParticleTimeRef = useRef(0);
  const particleAnimationRef = useRef<number | null>(null);
  const smoothedRadialSpeedRef = useRef(0);
  const smoothedDriftSpeedRef = useRef(0.2 * SPEED_PER_SECOND);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const pattern = useMemo(() => BREATHING_PATTERNS[mode], [mode]);
  const theme = useMemo(
    () => colorScheme === 'dark' ? createNightModeTheme(pattern.color) : createModeTheme(pattern.color),
    [pattern.color, colorScheme],
  );
  const isProtocolMode = mode === ModeName.WimHof;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rawSettings = await AsyncStorage.getItem(STORAGE_KEYS.settings);
        if (rawSettings && !cancelled) {
          const parsed = JSON.parse(rawSettings);
          if (parsed.mode && Object.values(ModeName).includes(parsed.mode)) {
            setMode(parsed.mode);
          }
          if (typeof parsed.speedMultiplier === 'number') {
            setSpeedMultiplier(parsed.speedMultiplier);
          }
          if (parsed.selectedDuration === null || typeof parsed.selectedDuration === 'number') {
            setSelectedDuration(parsed.selectedDuration);
          }
          if (typeof parsed.muted === 'boolean') {
            setMuted(parsed.muted);
          }
          if (typeof parsed.hapticsEnabled === 'boolean') {
            setHapticsEnabled(parsed.hapticsEnabled);
          }
          if (typeof parsed.keepAwakeEnabled === 'boolean') {
            setKeepAwakeEnabled(parsed.keepAwakeEnabled);
          }
        }
      } finally {
        if (!cancelled) {
          setSettingsLoaded(true);
        }
      }

      try {
        const rawStats = await AsyncStorage.getItem(STORAGE_KEYS.stats);
        if (rawStats && !cancelled) {
          const parsed = JSON.parse(rawStats);
          if (typeof parsed.totalMinutes === 'number') {
            setTotalMinutes(parsed.totalMinutes);
          }
          if (typeof parsed.sessionsCompleted === 'number') {
            setSessionsCompleted(parsed.sessionsCompleted);
          }
        }
      } finally {
        if (!cancelled) {
          setStatsLoaded(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const payload = JSON.stringify({
      mode,
      speedMultiplier,
      selectedDuration,
      muted,
      hapticsEnabled,
      keepAwakeEnabled,
    });
    void AsyncStorage.setItem(STORAGE_KEYS.settings, payload);
  }, [mode, speedMultiplier, selectedDuration, muted, hapticsEnabled, keepAwakeEnabled, settingsLoaded]);

  useEffect(() => {
    if (!statsLoaded) return;
    const payload = JSON.stringify({
      totalMinutes,
      sessionsCompleted,
    });
    void AsyncStorage.setItem(STORAGE_KEYS.stats, payload);
  }, [totalMinutes, sessionsCompleted, statsLoaded]);

  const stopSession = useCallback((completed: boolean) => {
    setIsRunning(false);
    phaseRef.current = BreathingPhase.Idle;
    setPhase(BreathingPhase.Idle);
    setScale(0);
    setProtocolState({
      currentRound: 1,
      currentBreathIndex: 0,
      phase: ProtocolPhase.Idle,
      retentionTime: 0,
      isUserControlledHold: false,
    });
    protocolPhaseStartRef.current = null;
    retentionStartRef.current = 0;
    phaseStartRef.current = null;
    sessionStartRef.current = null;

    const seconds = sessionSecondsRef.current;
    if (seconds > 0) {
      setTotalMinutes((prev) => Number((prev + seconds / 60).toFixed(2)));
      if (completed) {
        setSessionsCompleted((prev) => prev + 1);
      }
    }

    sessionSecondsRef.current = 0;
    setSessionSeconds(0);
  }, []);

  useEffect(() => {
    if (!isRunning || isProtocolMode) return;

    let rafId = 0;

    const tick = (time: number) => {
      if (!isRunningRef.current) {
        return;
      }

      if (!phaseStartRef.current) {
        phaseStartRef.current = time;
      }
      if (!sessionStartRef.current) {
        sessionStartRef.current = time;
      }

      const elapsedMs = time - phaseStartRef.current;
      const currentPhase = phaseRef.current;

      const visual = getPhaseVisualState(currentPhase, elapsedMs, pattern, speedMultiplier);
      setScale(visual.scale);

      const elapsedSeconds = Math.floor((time - sessionStartRef.current) / 1000);
      if (elapsedSeconds !== sessionSecondsRef.current) {
        sessionSecondsRef.current = elapsedSeconds;
        setSessionSeconds(elapsedSeconds);
      }

      if (selectedDuration && elapsedSeconds >= selectedDuration) {
        stopSession(true);
        return;
      }

      const update = updatePhase({
        phase: currentPhase,
        elapsedMs,
        pattern,
        speedMultiplier,
      });

      if (update.phaseComplete) {
        phaseRef.current = update.phase;
        setPhase(update.phase);
        phaseStartRef.current = time;

        if (!muted) {
          if (update.phase === BreathingPhase.Inhale) {
            void playCue('inhale');
          } else if (update.phase === BreathingPhase.Exhale) {
            void playCue('exhale');
          } else if (
            update.phase === BreathingPhase.HoldIn ||
            update.phase === BreathingPhase.HoldOut
          ) {
            void playCue('hold');
          }
        }

        if (hapticsEnabled) {
          if (update.phase === BreathingPhase.Inhale) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (update.phase === BreathingPhase.Exhale) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (
            update.phase === BreathingPhase.HoldIn ||
            update.phase === BreathingPhase.HoldOut
          ) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, isProtocolMode, muted, hapticsEnabled, pattern, selectedDuration, speedMultiplier, stopSession]);

  useEffect(() => {
    if (!isRunning || !isProtocolMode) return;

    let rafId = 0;

    const tick = (time: number) => {
      if (!isRunningRef.current) {
        return;
      }

      if (!protocolPhaseStartRef.current) {
        protocolPhaseStartRef.current = time;
      }

      const protocol = WIM_HOF_PROTOCOL;
      const inhaleDur = protocol.powerBreathTiming.inhale * 1000;
      const exhaleDur = protocol.powerBreathTiming.exhale * 1000;
      const breathCycleDur = inhaleDur + exhaleDur;
      const recoveryInhaleDur = protocol.recoveryTiming.inhale * 1000;
      const recoveryHoldDur = protocol.recoveryTiming.hold * 1000;
      const timeSincePhaseStart = time - protocolPhaseStartRef.current;

      setProtocolState((prev) => {
        let next = { ...prev };

        if (prev.phase === ProtocolPhase.PowerBreathe) {
          const breathIndex = Math.floor(timeSincePhaseStart / breathCycleDur);
          const withinBreathTime = timeSincePhaseStart % breathCycleDur;

          if (breathIndex >= protocol.powerBreathCount) {
            next.phase = ProtocolPhase.RetentionHold;
            next.retentionTime = 0;
            next.isUserControlledHold = true;
            retentionStartRef.current = time;
            protocolPhaseStartRef.current = time;
            setScale(0);
            if (!muted) {
              void playCue('hold');
            }
          } else {
            next.currentBreathIndex = breathIndex + 1;
            if (withinBreathTime < inhaleDur) {
              const progress = withinBreathTime / inhaleDur;
              setScale(progress);
            } else {
              const progress = (withinBreathTime - inhaleDur) / exhaleDur;
              setScale(1 - progress);
            }
          }
        } else if (prev.phase === ProtocolPhase.RetentionHold) {
          const holdSeconds = Math.floor((time - retentionStartRef.current) / 1000);
          next.retentionTime = holdSeconds;

          if (holdSeconds >= protocol.retentionHoldMax) {
            next.phase = ProtocolPhase.RecoveryInhale;
            protocolPhaseStartRef.current = time;
            if (!muted) {
              void playCue('inhale');
            }
          }
        } else if (prev.phase === ProtocolPhase.RecoveryInhale) {
          const progress = Math.min(timeSincePhaseStart / recoveryInhaleDur, 1);
          setScale(progress);

          if (timeSincePhaseStart >= recoveryInhaleDur) {
            next.phase = ProtocolPhase.RecoveryHold;
            protocolPhaseStartRef.current = time;
            if (!muted) {
              void playCue('hold');
            }
          }
        } else if (prev.phase === ProtocolPhase.RecoveryHold) {
          setScale(1);
          if (timeSincePhaseStart >= recoveryHoldDur) {
            if (prev.currentRound < protocol.rounds) {
              next.currentRound = prev.currentRound + 1;
              next.currentBreathIndex = 0;
              next.phase = ProtocolPhase.RoundComplete;
              protocolPhaseStartRef.current = time;
              setScale(0.5);
            } else {
              next.phase = ProtocolPhase.ProtocolComplete;
              setScale(0.5);
              setIsRunning(false);
            }
          }
        } else if (prev.phase === ProtocolPhase.RoundComplete) {
          if (timeSincePhaseStart >= protocol.roundRestDuration * 1000) {
            next.phase = ProtocolPhase.PowerBreathe;
            protocolPhaseStartRef.current = time;
            if (!muted) {
              void playCue('inhale');
            }
          }
        }

        let nextVisualPhase = phaseRef.current;
        if (next.phase === ProtocolPhase.PowerBreathe) {
          const withinBreathTime =
            ((time - (protocolPhaseStartRef.current ?? time)) % breathCycleDur + breathCycleDur) %
            breathCycleDur;
          if (withinBreathTime < inhaleDur) {
            nextVisualPhase = BreathingPhase.Inhale;
          } else {
            nextVisualPhase = BreathingPhase.Exhale;
          }
        } else if (next.phase === ProtocolPhase.RetentionHold) {
          nextVisualPhase = BreathingPhase.HoldOut;
        } else if (next.phase === ProtocolPhase.RecoveryInhale) {
          nextVisualPhase = BreathingPhase.Inhale;
        } else if (next.phase === ProtocolPhase.RecoveryHold) {
          nextVisualPhase = BreathingPhase.HoldIn;
        }

        if (nextVisualPhase !== phaseRef.current) {
          phaseRef.current = nextVisualPhase;
          setPhase(nextVisualPhase);
        }

        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isRunning, isProtocolMode, muted]);

  const handleStart = () => {
    sessionStartRef.current = null;
    sessionSecondsRef.current = 0;
    setSessionSeconds(0);
    phaseStartRef.current = null;
    phaseRef.current = BreathingPhase.Inhale;
    setPhase(BreathingPhase.Inhale);
    setScale(0);
    if (mode === ModeName.WimHof) {
      setProtocolState({
        currentRound: 1,
        currentBreathIndex: 0,
        phase: ProtocolPhase.PowerBreathe,
        retentionTime: 0,
        isUserControlledHold: false,
      });
      protocolPhaseStartRef.current = null;
      retentionStartRef.current = 0;
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    stopSession(false);
  };

  const handleModeChange = (nextMode: ModeName) => {
    setMode(nextMode);
    setProtocolState({
      currentRound: 1,
      currentBreathIndex: 0,
      phase: ProtocolPhase.Idle,
      retentionTime: 0,
      isUserControlledHold: false,
    });
    protocolPhaseStartRef.current = null;
    retentionStartRef.current = 0;
    if (isRunning) {
      stopSession(false);
    }
  };

  const handleDurationChange = (value: number | null) => {
    setSelectedDuration(value);
    if (isRunning && value !== null && sessionSecondsRef.current >= value) {
      stopSession(true);
    }
  };

  const handleEndHold = useCallback(() => {
    if (!isProtocolMode || protocolState.phase !== ProtocolPhase.RetentionHold) return;
    setProtocolState((prev) => ({
      ...prev,
      phase: ProtocolPhase.RecoveryInhale,
      isUserControlledHold: false,
    }));
    protocolPhaseStartRef.current = getNow();
    if (!muted) {
      void playCue('inhale');
    }
  }, [isProtocolMode, protocolState.phase, muted]);

  const resetStats = () => {
    setTotalMinutes(0);
    setSessionsCompleted(0);
  };

  const radius = blobSize * (0.15 + 0.1 * scale);
  const ringColor = toRgba(pattern.color, 0.35);
  const wobblePhase = useMemo(() => scale * 2.4 + particleFrame * 0.02, [scale, particleFrame]);
  const instruction = (() => {
    if (isProtocolMode) {
      if (protocolState.phase === ProtocolPhase.RetentionHold) {
        const mins = Math.floor(protocolState.retentionTime / 60);
        const secs = protocolState.retentionTime % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      if (protocolState.phase === ProtocolPhase.RecoveryInhale) return 'Deep breath in';
      if (protocolState.phase === ProtocolPhase.RecoveryHold) return 'Hold';
      if (protocolState.phase === ProtocolPhase.RoundComplete) {
        return `Round ${protocolState.currentRound - 1} complete`;
      }
      if (protocolState.phase === ProtocolPhase.ProtocolComplete) return 'Complete';
    }

    switch (phase) {
      case BreathingPhase.Inhale:
        return 'Inhale';
      case BreathingPhase.Inhale2:
        return 'Inhale again';
      case BreathingPhase.HoldIn:
      case BreathingPhase.HoldOut:
        return 'Hold';
      case BreathingPhase.Exhale:
        return 'Exhale';
      default:
        return 'Ready';
    }
  })();

  const remainingSeconds =
    selectedDuration === null ? null : Math.max(selectedDuration - sessionSeconds, 0);

  const modeLabel = useCallback((label: ModeName) => {
    switch (label) {
      case ModeName.Relax:
        return '4-7-8';
      case ModeName.Coherent:
        return 'Coherent';
      case ModeName.Sigh:
        return 'Sigh';
      case ModeName.WimHof:
        return 'Wim Hof';
      default:
        return 'Box';
    }
  }, []);

  const buildBlobPath = (
    baseRadius: number,
    wobbleA: number,
    wobbleB: number,
    phaseOffset: number,
    scaleOffset: number,
  ) => {
    const points = 32;
    const cx = blobCanvasSize / 2;
    const cy = blobCanvasSize / 2;
    let path = '';
    for (let i = 0; i < points; i += 1) {
      const t = (i / points) * Math.PI * 2;
      const wobble =
        Math.sin(t * 2 + scale * (2.2 + scaleOffset) + phaseOffset) * wobbleA +
        Math.sin(t * 4 - scale * 1.8 + phaseOffset * 0.7) * wobbleB;
      const r = baseRadius * (1 + wobble);
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
    }
    return `${path}Z`;
  };

  const blobPath = useMemo(
    () => buildBlobPath(radius * 0.995, 0.015, 0.008, wobblePhase, 0),
    [blobCanvasSize, radius, scale, wobblePhase],
  );
  const ringPath = useMemo(
    () => buildBlobPath(radius * 1.07, 0.02, 0.012, wobblePhase + 0.4, 0.6),
    [blobCanvasSize, radius, scale, wobblePhase],
  );

  useEffect(() => {
    if (width === 0 || height === 0) return;
    const previous = particleBoundsRef.current;
    if (previous.width !== width || previous.height !== height || particlesRef.current.length === 0) {
      particleBoundsRef.current = { width, height };
      const count = width < 390 ? 80 : 110;
      particlesRef.current = Array.from({ length: count }, () => createParticle(width, height));
      lastParticleTimeRef.current = 0;
    }
  }, [width, height]);

  useEffect(() => {
    if (reduceMotion) {
      particlesRef.current = [];
      return;
    }

    const tick = (timestamp: number) => {
      const w = particleBoundsRef.current.width || width;
      const h = particleBoundsRef.current.height || height;
      if (w > 0 && h > 0 && particlesRef.current.length > 0) {
        const deltaSeconds = lastParticleTimeRef.current
          ? Math.min(Math.max((timestamp - lastParticleTimeRef.current) / 1000, 0), 0.05)
          : 0.016;
        lastParticleTimeRef.current = timestamp;

        let targetRadialSpeed = 0;
        let targetDriftSpeed = 0.35 * SPEED_PER_SECOND;

        if (phaseRef.current === BreathingPhase.Inhale) {
          targetRadialSpeed = -3.8 * SPEED_PER_SECOND;
          targetDriftSpeed = 0.55 * SPEED_PER_SECOND;
        } else if (phaseRef.current === BreathingPhase.Exhale) {
          targetRadialSpeed = 1.8 * SPEED_PER_SECOND;
          targetDriftSpeed = 0.55 * SPEED_PER_SECOND;
        } else if (
          phaseRef.current === BreathingPhase.HoldIn ||
          phaseRef.current === BreathingPhase.HoldOut
        ) {
          targetRadialSpeed = 0;
          targetDriftSpeed = 0.6 * SPEED_PER_SECOND;
        }

        targetRadialSpeed *= speedMultiplierRef.current;

        smoothedRadialSpeedRef.current +=
          (targetRadialSpeed - smoothedRadialSpeedRef.current) * 0.06;
        smoothedDriftSpeedRef.current +=
          (targetDriftSpeed - smoothedDriftSpeedRef.current) * 0.06;

        particlesRef.current.forEach((particle) => {
          updateParticle(
            particle,
            smoothedRadialSpeedRef.current,
            smoothedDriftSpeedRef.current,
            deltaSeconds,
            w,
            h,
          );
        });

        setParticleFrame((value) => (value + 1) % 100000);
      }

      particleAnimationRef.current = requestAnimationFrame(tick);
    };

    particleAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (particleAnimationRef.current) {
        cancelAnimationFrame(particleAnimationRef.current);
      }
    };
  }, [height, width, reduceMotion]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundFrom }}>
      {keepAwakeEnabled && isRunning ? <KeepAwakeGuard /> : null}

      <View className="flex-1">
        <Canvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        >
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[theme.backgroundFrom, theme.backgroundTo]}
            />
          </Rect>
          {particlesRef.current.map((particle, index) => (
            <Circle
              key={`bg-particle-${index}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              color={toRgba(theme.particle, Math.min(particle.alpha, 0.7))}
            />
          ))}
        </Canvas>
        <View className="flex-1 items-center justify-center px-6">
          {isProtocolMode && isRunning ? (
            <View className="mb-3 items-center">
              <Text className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                Round {protocolState.currentRound} of {WIM_HOF_PROTOCOL.rounds}
              </Text>
              {protocolState.phase === ProtocolPhase.PowerBreathe ? (
                <Text className="mt-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
                  Breath {protocolState.currentBreathIndex} of {WIM_HOF_PROTOCOL.powerBreathCount}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={isRunning ? handleStop : handleStart}
            className="items-center justify-center"
            style={{ width: blobCanvasSize, height: blobCanvasSize }}
          >
            <Canvas style={{ width: blobCanvasSize, height: blobCanvasSize }}>
              <Path path={blobPath} color={pattern.color} />
              <Path path={ringPath} color={ringColor} style="stroke" strokeWidth={3} />
            </Canvas>
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isRunning ? (
                <>
                  <Text className="text-2xl font-semibold" style={{ color: theme.onAccent }}>
                    {instruction}
                  </Text>
                  {remainingSeconds === null ? null : (
                    <Text className="mt-1 text-xs uppercase tracking-widest" style={{ color: theme.onAccent }}>
                      {`Remaining ${formatTime(remainingSeconds)}`}
                    </Text>
                  )}
                  <Text
                    className="mt-2 text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: theme.onAccent }}
                  >
                    Tap to pause
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-xl font-semibold" style={{ color: theme.onAccent }}>
                    Play
                  </Text>
                  <Text
                    className="mt-2 text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: theme.onAccent }}
                  >
                    Tap to start
                  </Text>
                </>
              )}
            </View>
          </Pressable>
          {isProtocolMode &&
          protocolState.phase === ProtocolPhase.RetentionHold &&
          protocolState.retentionTime >= WIM_HOF_PROTOCOL.retentionHoldMin ? (
            <Pressable
              onPress={handleEndHold}
              className="mt-4 rounded-full px-4 py-2"
              style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.surfaceBorder }}
            >
              <Text className="text-xs uppercase tracking-widest" style={{ color: theme.text }}>
                End Hold
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 20,
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => setSettingsOpen(true)}
            className="items-center rounded-full px-5 py-2"
            style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.surfaceBorder }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                backgroundColor: theme.surfaceBorder,
              }}
            />
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={settingsOpen} animationType="slide">
        <View className="flex-1 justify-end bg-black/30">
          <Pressable
            onPress={() => setSettingsOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            className="w-full rounded-t-3xl p-5"
            style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.surfaceBorder }}
          >
            <View className="items-center">
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: theme.surfaceBorder,
                }}
              />
            </View>
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                Settings
              </Text>
              <Pressable onPress={() => setSettingsOpen(false)}>
                <Text className="text-sm" style={{ color: theme.muted }}>
                  Close
                </Text>
              </Pressable>
            </View>

            <View className="mt-5">
              <Text className="mb-1 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                Session
              </Text>
              <Text className="text-2xl font-semibold" style={{ color: theme.text }}>
                {formatTime(sessionSeconds)}
              </Text>
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                Mode
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MODE_LIST.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => handleModeChange(item)}
                    className="rounded-full px-3 py-2"
                    style={{
                      backgroundColor: item === mode ? theme.accent : theme.surfaceAlt,
                      borderWidth: item === mode ? 0 : 1,
                      borderColor: theme.surfaceBorder,
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: item === mode ? theme.onAccent : theme.text }}
                    >
                  {modeLabel(item)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-2 text-xs" style={{ color: theme.muted }}>
                {pattern.description}
              </Text>
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                Session Length
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => {
                  const active = option.value === selectedDuration;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => handleDurationChange(option.value)}
                      disabled={isRunning}
                      className="rounded-full px-3 py-1"
                      style={{
                        backgroundColor: active ? theme.accent : theme.surfaceAlt,
                        borderWidth: active ? 0 : 1,
                        borderColor: theme.surfaceBorder,
                        opacity: isRunning && !active ? 0.5 : 1,
                      }}
                    >
                      <Text className="text-xs" style={{ color: active ? theme.onAccent : theme.text }}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {isRunning ? (
                <Text className="mt-2 text-xs" style={{ color: theme.muted }}>
                  Pause to change the session length.
                </Text>
              ) : null}
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
                Speed
              </Text>
              <View className="flex-row items-center gap-3">
                <Text className="text-xs" style={{ color: theme.muted }}>
                  Slow
                </Text>
                <Slider
                  style={{ flex: 1, height: 30 }}
                  minimumValue={MIN_SPEED_MULTIPLIER}
                  maximumValue={MAX_SPEED_MULTIPLIER}
                  step={0.1}
                  value={speedMultiplier}
                  onValueChange={setSpeedMultiplier}
                  minimumTrackTintColor={theme.accent}
                  maximumTrackTintColor={theme.surfaceBorder}
                  thumbTintColor={theme.accent}
                />
                <Text className="text-xs" style={{ color: theme.muted }}>
                  Fast
                </Text>
              </View>
              <Text className="mt-2 text-xs" style={{ color: theme.muted }}>
                {speedMultiplier.toFixed(1)}x
              </Text>
            </View>

            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm" style={{ color: theme.text }}>
                  Sound
                </Text>
                <Switch value={!muted} onValueChange={(value) => setMuted(!value)} />
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm" style={{ color: theme.text }}>
                  Haptics
                </Text>
                <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm" style={{ color: theme.text }}>
                  Keep Awake
                </Text>
                <Switch value={keepAwakeEnabled} onValueChange={setKeepAwakeEnabled} />
              </View>
            </View>

            <Pressable
              onPress={resetStats}
              className="mt-5 rounded-full px-4 py-2"
              style={{ backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.surfaceBorder }}
            >
              <Text className="text-center text-sm" style={{ color: theme.text }}>
                Reset Stats
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
