"use client";

import {
  cloneSensoryProfile,
  DEFAULT_SENSORY_PROFILES,
  normalizeSensoryProfile,
  SENSORY_CONTROL_RANGES,
  SENSORY_MODE_IDS,
  SENSORY_MODE_LABELS,
  SENSORY_SCHEMA_VERSION,
  type SensoryModeId,
  type SensoryPhaseId,
  type SensoryProfileV1,
} from "@resonance/domain";
import ParticleBackground from "@/components/resonance/components/ParticleBackground";
import Visualizer from "@/components/resonance/components/Visualizer";
import { StudioAudioPreview } from "@/components/resonance/services/sensoryAudioPreview";
import { BreathingPhase } from "@/components/resonance/types";
import {
  isLegacyStudioDraft,
  migrateLegacyAudioInput,
} from "./sensoryStudioMigration";
import {
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FileUp,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  Waves,
} from "lucide-react";
import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./sensory-studio.module.css";

const STORAGE_VERSION = 2;
const STORAGE_KEY = `resonance:sensory-studio:v${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEY = "resonance:sensory-studio:v1";
const MAX_HISTORY = 60;

const {
  audio: AUDIO_RANGES,
  guidance: GUIDANCE_RANGES,
  motion: MOTION_RANGES,
  phase: PHASE_RANGES,
} = SENSORY_CONTROL_RANGES;

type ProfileMap = Record<SensoryModeId, SensoryProfileV1>;
type SaveState = "loading" | "saving" | "saved" | "unavailable";
type AudioPreviewState = "idle" | "starting" | "live" | "blocked";

type StudioDraft = {
  storageVersion: number;
  schemaVersion: number;
  activeModeId: SensoryModeId;
  savedAt: string;
  profiles: SensoryProfileV1[];
};

const PHASE_LABELS: Record<SensoryPhaseId, string> = {
  inhale: "Inhale",
  inhale2: "Top-up",
  holdIn: "Hold",
  exhale: "Exhale",
  holdOut: "Settle",
};

const ENGINE_PHASES: Record<SensoryPhaseId, BreathingPhase> = {
  inhale: BreathingPhase.Inhale,
  inhale2: BreathingPhase.Inhale2,
  holdIn: BreathingPhase.HoldIn,
  exhale: BreathingPhase.Exhale,
  holdOut: BreathingPhase.HoldOut,
};

const PHASE_SEQUENCES: Record<SensoryModeId, SensoryPhaseId[]> = {
  box: ["inhale", "holdIn", "exhale", "holdOut"],
  relax: ["inhale", "holdIn", "exhale"],
  coherent: ["inhale", "exhale"],
  sigh: ["inhale", "inhale2", "exhale", "holdOut"],
  ujjayi: ["inhale", "exhale"],
  belly: ["inhale", "exhale"],
  "pursed-lip": ["inhale", "exhale"],
};

const PHASE_DURATIONS: Record<SensoryModeId, Partial<Record<SensoryPhaseId, number>>> = {
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  relax: { inhale: 4, holdIn: 7, exhale: 8 },
  coherent: { inhale: 5.5, exhale: 5.5 },
  sigh: { inhale: 2.5, inhale2: 1.5, exhale: 6, holdOut: 1 },
  ujjayi: { inhale: 4, exhale: 6 },
  belly: { inhale: 4, exhale: 6 },
  "pursed-lip": { inhale: 2, exhale: 4 },
};

const SOUNDSCAPES = [
  ["silence", "Silence"],
  ["air", "Air"],
  ["rain", "Soft rain"],
  ["ocean", "Ocean"],
  ["deep-ocean", "Deep ocean"],
  ["warm-drone", "Warm drone"],
  ["soft-noise", "Soft noise"],
] as const;

const PHASE_CUES = [
  ["none", "No cue"],
  ["soft-rise", "Production inhale"],
  ["crisp-tick", "Production hold"],
  ["long-release", "Production exhale"],
] as const;

const HAPTIC_PATTERNS = [
  ["none", "None"],
  ["soft", "Soft tap"],
  ["crisp", "Crisp tap"],
  ["release", "Gentle release"],
  ["top-up", "Double top-up"],
] as const;

const CURVES = [
  ["linear", "Linear"],
  ["sine", "Natural sine"],
  ["ease-in", "Slow start"],
  ["ease-out", "Soft landing"],
  ["ease-in-out", "Smooth both ways"],
] as const;

function cloneProfileMap(profiles: ProfileMap): ProfileMap {
  return Object.fromEntries(
    SENSORY_MODE_IDS.map((modeId) => [modeId, cloneSensoryProfile(profiles[modeId])]),
  ) as ProfileMap;
}

function createDefaultProfileMap(): ProfileMap {
  return Object.fromEntries(
    SENSORY_MODE_IDS.map((modeId) => [
      modeId,
      cloneSensoryProfile(DEFAULT_SENSORY_PROFILES[modeId]),
    ]),
  ) as ProfileMap;
}

function makeDraft(profiles: ProfileMap, activeModeId: SensoryModeId): StudioDraft {
  return {
    storageVersion: STORAGE_VERSION,
    schemaVersion: SENSORY_SCHEMA_VERSION,
    activeModeId,
    savedAt: new Date().toISOString(),
    profiles: SENSORY_MODE_IDS.map((modeId) => cloneSensoryProfile(profiles[modeId])),
  };
}

function parseImportedProfiles(
  input: unknown,
  migrateLegacyAudio = false,
): { profiles: Partial<ProfileMap>; firstMode: SensoryModeId } | null {
  const candidateProfiles =
    typeof input === "object" && input !== null && "profiles" in input && Array.isArray(input.profiles)
      ? input.profiles
      : [input];

  const profiles: Partial<ProfileMap> = {};
  let firstMode: SensoryModeId | null = null;

  for (const candidate of candidateProfiles) {
    const normalized = normalizeSensoryProfile(
      migrateLegacyAudio ? migrateLegacyAudioInput(candidate) : candidate,
    );
    if (normalized) {
      profiles[normalized.modeId] = normalized;
      firstMode ??= normalized.modeId;
    }
  }

  return firstMode ? { profiles, firstMode } : null;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSigned(value: number, unit = "") {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

function applyCurve(curve: SensoryProfileV1["phases"][SensoryPhaseId]["visual"]["curve"], value: number) {
  if (curve === "sine") return (1 - Math.cos(Math.PI * value)) / 2;
  if (curve === "ease-in") return value * value;
  if (curve === "ease-out") return 1 - (1 - value) * (1 - value);
  if (curve === "ease-in-out") {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }
  return value;
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function RangeField({
  label,
  hint,
  min,
  max,
  step,
  value,
  valueLabel,
  onChange,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueLabel?: string;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <label className={styles.rangeField}>
      <span className={styles.fieldHeading}>
        <span>
          <span className={styles.fieldLabel}>{label}</span>
          {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
        </span>
        <output>{valueLabel ?? value}</output>
      </span>
      <input
        aria-label={label}
        className={styles.range}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
        type="range"
        value={value}
      />
    </label>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggleField}>
      <span>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldHint}>{hint}</span>
      </span>
      <input
        checked={checked}
        className={styles.toggleInput}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className={styles.toggleTrack}>
        <span />
      </span>
    </label>
  );
}

function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.selectField}>
      <span>
        <span className={styles.fieldLabel}>{label}</span>
        {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      </span>
      <span className={styles.selectWrap}>
        <select onChange={(event) => onChange(event.currentTarget.value)} value={value}>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" size={15} />
      </span>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(value.toUpperCase());

  useEffect(() => {
    setDraftValue(value.toUpperCase());
  }, [value]);

  const commitDraft = () => {
    const candidate = draftValue.trim();
    const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;
    if (/^#[\dA-F]{6}$/i.test(normalized)) {
      onChange(normalized.toUpperCase());
      setDraftValue(normalized.toUpperCase());
      return;
    }
    setDraftValue(value.toUpperCase());
  };

  return (
    <label className={styles.colorField}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.colorInputWrap}>
        <input
          aria-label={`${label} color picker`}
          onChange={(event) => onChange(event.currentTarget.value.toUpperCase())}
          type="color"
          value={value}
        />
        <input
          aria-label={`${label} hex value`}
          maxLength={7}
          onBlur={commitDraft}
          onChange={(event) => setDraftValue(event.currentTarget.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setDraftValue(value.toUpperCase());
              event.currentTarget.blur();
            }
          }}
          placeholder="#0D9488"
          spellCheck={false}
          type="text"
          value={draftValue}
        />
      </span>
    </label>
  );
}

function ControlSection({
  eyebrow,
  title,
  description,
  children,
  defaultOpen = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className={styles.controlSection} open={defaultOpen}>
      <summary>
        <span>
          <span className={styles.sectionEyebrow}>{eyebrow}</span>
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.sectionDescription}>{description}</span>
        </span>
        <ChevronDown aria-hidden="true" size={18} />
      </summary>
      <div className={styles.controlBody}>{children}</div>
    </details>
  );
}

function BreathingPreview({
  profile,
  selectedPhaseId,
  onSelectPhase,
}: {
  profile: SensoryProfileV1;
  selectedPhaseId: SensoryPhaseId;
  onSelectPhase: (phaseId: SensoryPhaseId) => void;
}) {
  const sequence = PHASE_SEQUENCES[profile.modeId];
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioState, setAudioState] = useState<AudioPreviewState>("idle");
  const [previewPhaseId, setPreviewPhaseId] = useState<SensoryPhaseId>(selectedPhaseId);
  const [progress, setProgress] = useState(0.42);
  const progressRef = useRef(progress);
  const phaseRef = useRef(previewPhaseId);
  const isPlayingRef = useRef(isPlaying);
  const playbackRequestedRef = useRef(false);
  const audioRequestRef = useRef(0);
  const startAtBeginningRef = useRef(true);
  const profileRef = useRef(profile);
  const audioPreviewRef = useRef<StudioAudioPreview | null>(null);
  const previousModeIdRef = useRef(profile.modeId);

  const getAudioPreview = useCallback(() => {
    audioPreviewRef.current ??= new StudioAudioPreview();
    return audioPreviewRef.current;
  }, []);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (playbackRequestedRef.current) return;
    phaseRef.current = selectedPhaseId;
    progressRef.current = 0.42;
    startAtBeginningRef.current = true;
    setPreviewPhaseId(selectedPhaseId);
    setProgress(0.42);
  }, [selectedPhaseId]);

  const auditionHaptic = useCallback(
    (phaseId: SensoryPhaseId, force = false) => {
      const currentProfile = profileRef.current;
      if ((!currentProfile.guidance.haptics && !force) || !("vibrate" in navigator)) return;
      const haptic = currentProfile.phases[phaseId].haptic;
      if (haptic.pattern === "none") return;

      const duration = Math.max(10, Math.round(haptic.durationMs * haptic.intensity));
      navigator.vibrate(
        haptic.pattern === "top-up"
          ? [duration, 45, Math.max(10, Math.round(duration * 0.55))]
          : duration,
      );
    },
    [],
  );

  useEffect(() => {
    void audioPreviewRef.current?.syncProfile(profileRef.current);
  }, [
    profile.audio.ambientVolume,
    profile.audio.breathModulation,
    profile.audio.cueVolume,
    profile.audio.soundscape,
    profile.modeId,
    profile.palette.orb,
  ]);

  const stopPlayback = useCallback(() => {
    playbackRequestedRef.current = false;
    audioRequestRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setAudioState("idle");
    audioPreviewRef.current?.pause();
  }, []);

  const startPlayback = useCallback(
    (startingPhase: SensoryPhaseId) => {
      playbackRequestedRef.current = true;
      const requestId = ++audioRequestRef.current;
      if (startAtBeginningRef.current) {
        progressRef.current = 0;
        setProgress(0);
        startAtBeginningRef.current = false;
      }

      setAudioState("starting");
      void getAudioPreview().start(profileRef.current, startingPhase).then((ready) => {
        if (
          requestId !== audioRequestRef.current ||
          !playbackRequestedRef.current
        ) {
          return;
        }
        isPlayingRef.current = true;
        setIsPlaying(true);
        setAudioState(ready ? "live" : "blocked");
        auditionHaptic(startingPhase);
      });
    },
    [auditionHaptic, getAudioPreview],
  );

  useEffect(() => {
    if (previousModeIdRef.current === profile.modeId) return;
    previousModeIdRef.current = profile.modeId;
    stopPlayback();

    const firstPhase = PHASE_SEQUENCES[profile.modeId][0];
    phaseRef.current = firstPhase;
    progressRef.current = 0.42;
    startAtBeginningRef.current = true;
    setPreviewPhaseId(firstPhase);
    setProgress(0.42);
    if (selectedPhaseId !== firstPhase) onSelectPhase(firstPhase);
  }, [onSelectPhase, profile.modeId, selectedPhaseId, stopPlayback]);

  useEffect(() => {
    if (!isPlaying) return;

    let frameId = 0;
    let lastFrame = performance.now();
    let lastPaint = lastFrame;

    const tick = (now: number) => {
      const currentPhase = phaseRef.current;
      const duration = PHASE_DURATIONS[profile.modeId][currentPhase] ?? 4;
      let nextProgress = progressRef.current + (now - lastFrame) / (duration * 1000);
      lastFrame = now;

      if (nextProgress >= 1) {
        const currentIndex = sequence.indexOf(currentPhase);
        const nextPhase = sequence[(currentIndex + 1) % sequence.length];
        nextProgress %= 1;
        phaseRef.current = nextPhase;
        setPreviewPhaseId(nextPhase);
        onSelectPhase(nextPhase);
        audioPreviewRef.current?.playPhaseCue(profileRef.current, nextPhase);
        auditionHaptic(nextPhase);
      }

      progressRef.current = nextProgress;
      audioPreviewRef.current?.updateFrame(phaseRef.current, nextProgress, now);
      if (now - lastPaint > 40) {
        setProgress(nextProgress);
        lastPaint = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [auditionHaptic, isPlaying, onSelectPhase, profile.modeId, sequence]);

  useEffect(() => {
    const pauseForHiddenDocument = () => {
      if (document.visibilityState === "hidden") stopPlayback();
    };
    const pauseForPageHide = () => stopPlayback();
    document.addEventListener("visibilitychange", pauseForHiddenDocument);
    window.addEventListener("pagehide", pauseForPageHide);
    return () => {
      document.removeEventListener("visibilitychange", pauseForHiddenDocument);
      window.removeEventListener("pagehide", pauseForPageHide);
      playbackRequestedRef.current = false;
      audioRequestRef.current += 1;
      isPlayingRef.current = false;
      void audioPreviewRef.current?.dispose();
    };
  }, [stopPlayback]);

  const currentIndex = sequence.indexOf(previewPhaseId);
  const previousPhaseId = sequence[(currentIndex - 1 + sequence.length) % sequence.length];
  const previousVisual = profile.phases[previousPhaseId].visual;
  const currentVisual = profile.phases[previewPhaseId].visual;
  const curvedProgress = applyCurve(currentVisual.curve, progress);
  const orbEnvelope = interpolate(previousVisual.orbScale, currentVisual.orbScale, curvedProgress);
  const lightIntensity = interpolate(previousVisual.lightIntensity, currentVisual.lightIntensity, curvedProgress);
  const edgeGlow = interpolate(previousVisual.edgeGlow, currentVisual.edgeGlow, curvedProgress);
  const phaseDuration = PHASE_DURATIONS[profile.modeId][previewPhaseId] ?? 4;
  const enginePhase = ENGINE_PHASES[previewPhaseId];

  const selectPhase = (phaseId: SensoryPhaseId) => {
    phaseRef.current = phaseId;
    progressRef.current = 0.42;
    setPreviewPhaseId(phaseId);
    setProgress(0.42);
    startAtBeginningRef.current = !playbackRequestedRef.current;
    onSelectPhase(phaseId);
    if (isPlayingRef.current) {
      audioPreviewRef.current?.playPhaseCue(profileRef.current, phaseId);
      auditionHaptic(phaseId);
    } else if (playbackRequestedRef.current) {
      audioPreviewRef.current?.pause();
      startPlayback(phaseId);
    } else {
      const requestId = ++audioRequestRef.current;
      setAudioState("starting");
      void getAudioPreview().auditionCue(profileRef.current, phaseId).then((ready) => {
        if (requestId !== audioRequestRef.current || playbackRequestedRef.current) return;
        setAudioState(ready ? "idle" : "blocked");
        if (ready) auditionHaptic(phaseId);
      });
    }
  };

  const togglePlayback = () => {
    if (playbackRequestedRef.current) stopPlayback();
    else startPlayback(phaseRef.current);
  };

  const playbackActive =
    isPlaying || (audioState === "starting" && playbackRequestedRef.current);
  let statusLabel = "Ready";
  if (audioState === "starting") statusLabel = "Starting audio";
  else if (isPlaying && audioState === "live") statusLabel = "Playing · audio live";
  else if (isPlaying && audioState === "blocked") statusLabel = "Playing · audio blocked";
  else if (isPlaying) statusLabel = "Playing";
  else if (audioState === "blocked") statusLabel = "Audio blocked";

  const stageStyle = {
    "--stage-background": profile.palette.background,
    "--stage-accent": profile.palette.backgroundAccent,
    "--orb-color": profile.palette.orb,
    "--preview-text": profile.palette.text,
    "--edge-opacity": edgeGlow,
    "--light-opacity": lightIntensity,
    "--gravity-offset": `${profile.motion.gravityOffsetY * 120}px`,
  } as CSSProperties;

  return (
    <section className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <div>
          <span className={styles.panelEyebrow}>Live web engine</span>
          <h2>{SENSORY_MODE_LABELS[profile.modeId]}</h2>
        </div>
        <span className={styles.previewStatus} data-audio-state={audioState}>
          <span className={isPlaying ? styles.statusLive : undefined} />
          {statusLabel}
        </span>
      </div>

      <div className={styles.stage} style={stageStyle}>
        <div aria-hidden="true" className={styles.edgeLight} />
        <div aria-hidden="true" className={styles.stageGlow} />
        <div aria-hidden="true" className={styles.engineParticles}>
          <ParticleBackground
            color={profile.palette.particle}
            phase={enginePhase}
            speedMultiplier={1}
            tuning={{
              density: profile.motion.particleDensity,
              driftIntensity: profile.motion.particleDrift,
              flow: currentVisual.particleFlow,
              gravityOffsetY: profile.motion.gravityOffsetY,
              smoothing: profile.motion.cycleSmoothing,
              velocity: currentVisual.particleVelocity,
            }}
          />
        </div>

        <div className={styles.engineOrb}>
          <Visualizer
            color={profile.palette.orb}
            instructions=""
            interactionLabel={playbackActive ? "Pause preview from orb" : "Play preview from orb"}
            isRunning={isPlaying}
            label={PHASE_LABELS[previewPhaseId]}
            onClick={togglePlayback}
            phase={enginePhase}
            progress={progress}
            scale={orbEnvelope}
            tuning={{
              accentColor: profile.palette.orbAccent,
              edgeGlow,
              hueShiftDegrees: currentVisual.hueShiftDegrees,
              lightIntensity,
              maxScale: profile.motion.orbMaxScale,
              minScale: profile.motion.orbMinScale,
              morphAmount: profile.motion.morphAmount * (0.7 + currentVisual.shapeTension * 0.3),
            }}
          />
        </div>

        <div aria-live="off" className={styles.phaseTimer}>
          <strong>{(phaseDuration * (1 - progress)).toFixed(1)}s</strong>
        </div>
      </div>

      <div className={styles.transport}>
        <button
          aria-label={playbackActive ? "Pause sensory preview" : "Play sensory preview"}
          className={styles.playButton}
          onClick={togglePlayback}
          type="button"
        >
          {playbackActive ? <Pause fill="currentColor" size={17} /> : <Play fill="currentColor" size={17} />}
        </button>
        <div className={styles.phaseTabs} role="tablist" aria-label="Breathing phase">
          {sequence.map((phaseId) => (
            <button
              aria-selected={previewPhaseId === phaseId}
              className={previewPhaseId === phaseId ? styles.phaseTabActive : undefined}
              key={phaseId}
              onClick={() => selectPhase(phaseId)}
              role="tab"
              type="button"
            >
              {PHASE_LABELS[phaseId]}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.scrubber}>
        <span>Phase position</span>
        <input
          aria-label="Phase position"
          max={1}
          min={0}
          onChange={(event) => {
            const nextProgress = Number(event.currentTarget.value);
            progressRef.current = nextProgress;
            startAtBeginningRef.current = false;
            setProgress(nextProgress);
          }}
          step={0.01}
          style={{ "--range-progress": `${progress * 100}%` } as CSSProperties}
          type="range"
          value={progress}
        />
        <output>{Math.round(progress * 100)}%</output>
      </label>
    </section>
  );
}

function HeaderAction({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={styles.headerAction}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function SensoryStudio() {
  const [profiles, setProfiles] = useState<ProfileMap>(createDefaultProfileMap);
  const [activeModeId, setActiveModeId] = useState<SensoryModeId>(SENSORY_MODE_IDS[0]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<SensoryPhaseId>("inhale");
  const [history, setHistory] = useState<ProfileMap[]>([]);
  const [future, setFuture] = useState<ProfileMap[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const profilesRef = useRef(profiles);
  const hydratedRef = useRef(false);
  const storageAvailableRef = useRef(true);
  const lastEditRef = useRef<{ key: string; at: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = profiles[activeModeId];
  const phase = activeProfile.phases[selectedPhaseId];

  const replaceProfiles = useCallback((next: ProfileMap) => {
    profilesRef.current = next;
    setProfiles(next);
  }, []);

  useEffect(() => {
    let stored: string | null;
    let storedKey = STORAGE_KEY;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) storedKey = LEGACY_STORAGE_KEY;
      }
    } catch {
      hydratedRef.current = true;
      storageAvailableRef.current = false;
      setSaveState("unavailable");
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        const isLegacyDraft =
          storedKey === LEGACY_STORAGE_KEY || isLegacyStudioDraft(parsed);
        const imported = parseImportedProfiles(parsed, isLegacyDraft);
        if (imported) {
          const next = createDefaultProfileMap();
          for (const modeId of SENSORY_MODE_IDS) {
            const importedProfile = imported.profiles[modeId];
            if (!importedProfile) continue;
            next[modeId] = importedProfile;
          }
          replaceProfiles(next);
          const storedMode =
            typeof parsed === "object" &&
            parsed !== null &&
            "activeModeId" in parsed &&
            SENSORY_MODE_IDS.includes(parsed.activeModeId as SensoryModeId)
              ? (parsed.activeModeId as SensoryModeId)
              : imported.firstMode;
          setActiveModeId(storedMode);

          let migratedSavedAt: Date | null = null;
          if (isLegacyDraft) {
            try {
              const migratedDraft = makeDraft(next, storedMode);
              const serialized = JSON.stringify(migratedDraft);
              window.localStorage.setItem(STORAGE_KEY, serialized);
              if (window.localStorage.getItem(STORAGE_KEY) !== serialized) {
                throw new Error("Could not verify migrated draft");
              }
              if (storedKey === LEGACY_STORAGE_KEY) {
                window.localStorage.removeItem(LEGACY_STORAGE_KEY);
              }
              migratedSavedAt = new Date(migratedDraft.savedAt);
              setNotice("Upgraded the draft to production audio");
            } catch {
              storageAvailableRef.current = false;
              setSaveState("unavailable");
              setNotice("Draft opened, but its audio upgrade could not be saved");
            }
          }

          if (migratedSavedAt) {
            setSavedAt(migratedSavedAt);
          } else if (
            typeof parsed === "object" &&
            parsed !== null &&
            "savedAt" in parsed &&
            typeof parsed.savedAt === "string"
          ) {
            setSavedAt(new Date(parsed.savedAt));
          }
        }
      } catch {
        try {
          window.localStorage.removeItem(storedKey);
        } catch {
          hydratedRef.current = true;
          storageAvailableRef.current = false;
          setSaveState("unavailable");
          return;
        }
        setNotice("Recovered from an invalid local draft");
      }
    }

    hydratedRef.current = true;
    if (storageAvailableRef.current) setSaveState("saved");
  }, [replaceProfiles]);

  useEffect(() => {
    if (!hydratedRef.current || !storageAvailableRef.current) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      try {
        const draft = makeDraft(profilesRef.current, activeModeId);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        setSavedAt(new Date(draft.savedAt));
        setSaveState("saved");
      } catch {
        storageAvailableRef.current = false;
        setSaveState("unavailable");
      }
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [activeModeId, profiles]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const recordSnapshot = useCallback(() => {
    const snapshot = cloneProfileMap(profilesRef.current);
    setHistory((current) => [...current, snapshot].slice(-MAX_HISTORY));
    setFuture([]);
  }, []);

  const updateActive = useCallback(
    (editKey: string, mutate: (draft: SensoryProfileV1) => void) => {
      const now = Date.now();
      const fullKey = `${activeModeId}:${editKey}`;
      const previousEdit = lastEditRef.current;
      if (!previousEdit || previousEdit.key !== fullKey || now - previousEdit.at > 650) {
        recordSnapshot();
      }
      lastEditRef.current = { key: fullKey, at: now };

      const draft = cloneSensoryProfile(profilesRef.current[activeModeId]);
      mutate(draft);
      const normalized = normalizeSensoryProfile(draft);
      if (!normalized) return;
      replaceProfiles({ ...profilesRef.current, [activeModeId]: normalized });
    },
    [activeModeId, recordSnapshot, replaceProfiles],
  );

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    const currentSnapshot = cloneProfileMap(profilesRef.current);
    setHistory((current) => current.slice(0, -1));
    setFuture((current) => [currentSnapshot, ...current].slice(0, MAX_HISTORY));
    replaceProfiles(cloneProfileMap(previous));
    lastEditRef.current = null;
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    const currentSnapshot = cloneProfileMap(profilesRef.current);
    setFuture((current) => current.slice(1));
    setHistory((current) => [...current, currentSnapshot].slice(-MAX_HISTORY));
    replaceProfiles(cloneProfileMap(next));
    lastEditRef.current = null;
  };

  const resetActiveMode = () => {
    recordSnapshot();
    replaceProfiles({
      ...profilesRef.current,
      [activeModeId]: cloneSensoryProfile(DEFAULT_SENSORY_PROFILES[activeModeId]),
    });
    lastEditRef.current = null;
    setNotice(`${SENSORY_MODE_LABELS[activeModeId]} reset`);
  };

  const serializeDraft = () => JSON.stringify(makeDraft(profilesRef.current, activeModeId), null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(serializeDraft());
      setNotice("JSON copied to clipboard");
    } catch {
      setNotice("Could not copy JSON");
    }
  };

  const copyForCodex = async () => {
    const prompt = [
      `Implement this ${SENSORY_MODE_LABELS[activeModeId]} sensory profile.`,
      "Treat the JSON as the source of truth and preserve every authored value.",
      JSON.stringify(activeProfile, null, 2),
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(prompt);
      setNotice("Codex handoff copied");
    } catch {
      setNotice("Could not copy Codex handoff");
    }
  };

  const exportJson = () => {
    const blob = new Blob([serializeDraft()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sensory-profiles-v${SENSORY_SCHEMA_VERSION}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("JSON exported");
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const isLegacyDraft = isLegacyStudioDraft(parsed);
      const imported = parseImportedProfiles(parsed, isLegacyDraft);
      if (!imported) throw new Error("No valid sensory profiles");
      recordSnapshot();
      const next = cloneProfileMap(profilesRef.current);
      for (const modeId of SENSORY_MODE_IDS) {
        const importedProfile = imported.profiles[modeId];
        if (importedProfile) next[modeId] = importedProfile;
      }
      replaceProfiles(next);
      setActiveModeId(imported.firstMode);
      setSelectedPhaseId(PHASE_SEQUENCES[imported.firstMode][0]);
      lastEditRef.current = null;
      setNotice(
        isLegacyDraft
          ? "Sensory profile imported and upgraded"
          : "Sensory profile imported",
      );
    } catch {
      setNotice("That file is not a valid sensory profile");
    }
  };

  const previewHaptic = () => {
    const haptic = phase.haptic;
    if (haptic.pattern === "none") {
      setNotice("This phase has no haptic");
      return;
    }
    if ("vibrate" in navigator) {
      const duration = Math.max(12, Math.round(haptic.durationMs * haptic.intensity));
      navigator.vibrate(haptic.pattern === "top-up" ? [duration, 45, Math.max(10, duration * 0.55)] : duration);
      setNotice("Haptic preview sent");
    } else {
      setNotice("Haptic preview needs a supported device");
    }
  };

  const switchMode = (modeId: SensoryModeId) => {
    setActiveModeId(modeId);
    setSelectedPhaseId(PHASE_SEQUENCES[modeId][0]);
    lastEditRef.current = null;
  };

  const saveLabel =
    saveState === "loading"
      ? "Opening draft"
      : saveState === "saving"
        ? "Saving…"
        : saveState === "unavailable"
          ? "Local save unavailable"
          : savedAt
            ? `Saved locally ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Saved locally";

  return (
    <main className={styles.studioShell}>
      <header className={styles.topBar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>
            <Waves aria-hidden="true" size={19} />
          </div>
          <div>
            <span>Deep Breathing</span>
            <h1>Sensory Studio</h1>
          </div>
        </div>

        <div className={styles.saveIndicator} data-state={saveState}>
          {saveState === "saved" ? <Check aria-hidden="true" size={13} /> : <span />}
          <span>{saveLabel}</span>
          <small>Draft only · never published</small>
        </div>

        <div className={styles.headerActions}>
          <HeaderAction disabled={!history.length} icon={<Undo2 size={16} />} label="Undo" onClick={undo} />
          <HeaderAction disabled={!future.length} icon={<Redo2 size={16} />} label="Redo" onClick={redo} />
          <HeaderAction icon={<RotateCcw size={16} />} label="Reset mode" onClick={resetActiveMode} />
          <span className={styles.actionDivider} />
          <HeaderAction icon={<FileUp size={16} />} label="Import" onClick={() => fileInputRef.current?.click()} />
          <HeaderAction icon={<Clipboard size={16} />} label="Copy JSON" onClick={copyJson} />
          <HeaderAction icon={<Sparkles size={16} />} label="Copy for Codex" onClick={copyForCodex} />
          <HeaderAction icon={<Download size={16} />} label="Export" onClick={exportJson} />
          <input
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={importJson}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.modeRail}>
          <div className={styles.railHeading}>
            <span>Scenes</span>
            <small>7 modes</small>
          </div>
          <nav aria-label="Sensory modes">
            {SENSORY_MODE_IDS.map((modeId, index) => {
              const isActive = modeId === activeModeId;
              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? styles.modeButtonActive : styles.modeButton}
                  key={modeId}
                  onClick={() => switchMode(modeId)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={styles.modeSwatch}
                    style={{
                      background: `linear-gradient(135deg, ${profiles[modeId].palette.orb}, ${profiles[modeId].palette.orbAccent})`,
                      boxShadow: isActive ? `0 0 22px ${profiles[modeId].palette.orb}66` : undefined,
                    }}
                  />
                  <span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    {SENSORY_MODE_LABELS[modeId]}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className={styles.railNote}>
            <Sparkles aria-hidden="true" size={15} />
            <p>Everything here stays in this browser until you export it.</p>
          </div>
        </aside>

        <div className={styles.previewColumn}>
          <BreathingPreview
            key={activeModeId}
            onSelectPhase={setSelectedPhaseId}
            profile={activeProfile}
            selectedPhaseId={selectedPhaseId}
          />
          <div className={styles.previewFootnote}>
            <span>Editing</span>
            <strong>{PHASE_LABELS[selectedPhaseId]}</strong>
            <p>Play the full loop, or choose a phase and scrub through it while you tune.</p>
          </div>
        </div>

        <aside className={styles.controlsPanel} aria-label="Sensory controls">
          <div className={styles.controlsHeading}>
            <div>
              <span className={styles.panelEyebrow}>Inspector</span>
              <h2>{PHASE_LABELS[selectedPhaseId]} details</h2>
            </div>
            <span className={styles.schemaBadge}>Profile v{SENSORY_SCHEMA_VERSION}</span>
          </div>

          <ControlSection
            description="Set the atmosphere, orb, and light response."
            eyebrow="01 · Look"
            title="Color & light"
          >
            <div className={styles.colorGrid}>
              <ColorField
                label="Background"
                onChange={(value) => updateActive("palette.background", (draft) => (draft.palette.background = value))}
                value={activeProfile.palette.background}
              />
              <ColorField
                label="Ambient glow"
                onChange={(value) =>
                  updateActive("palette.backgroundAccent", (draft) => (draft.palette.backgroundAccent = value))
                }
                value={activeProfile.palette.backgroundAccent}
              />
              <ColorField
                label="Orb"
                onChange={(value) => updateActive("palette.orb", (draft) => (draft.palette.orb = value))}
                value={activeProfile.palette.orb}
              />
              <ColorField
                label="Orb highlight"
                onChange={(value) => updateActive("palette.orbAccent", (draft) => (draft.palette.orbAccent = value))}
                value={activeProfile.palette.orbAccent}
              />
              <ColorField
                label="Particles"
                onChange={(value) => updateActive("palette.particle", (draft) => (draft.palette.particle = value))}
                value={activeProfile.palette.particle}
              />
              <ColorField
                label="Instructions"
                onChange={(value) => updateActive("palette.text", (draft) => (draft.palette.text = value))}
                value={activeProfile.palette.text}
              />
            </div>
            <div className={styles.controlDivider} />
            <RangeField
              {...PHASE_RANGES.visual.lightIntensity}
              label="Phase light"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.lightIntensity`, (draft) => {
                  draft.phases[selectedPhaseId].visual.lightIntensity = value;
                })
              }
              value={phase.visual.lightIntensity}
              valueLabel={formatPercent(phase.visual.lightIntensity)}
            />
            <RangeField
              {...PHASE_RANGES.visual.edgeGlow}
              label="Edge glow"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.edgeGlow`, (draft) => {
                  draft.phases[selectedPhaseId].visual.edgeGlow = value;
                })
              }
              value={phase.visual.edgeGlow}
              valueLabel={formatPercent(phase.visual.edgeGlow)}
            />
            <RangeField
              {...PHASE_RANGES.visual.hueShiftDegrees}
              hint="Gently shifts this phase away from the base palette."
              label="Color shift"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.hueShiftDegrees`, (draft) => {
                  draft.phases[selectedPhaseId].visual.hueShiftDegrees = value;
                })
              }
              value={phase.visual.hueShiftDegrees}
              valueLabel={formatSigned(phase.visual.hueShiftDegrees, "°")}
            />
          </ControlSection>

          <ControlSection
            description="Shape how the field expands, releases, and gathers."
            eyebrow="02 · Movement"
            title="Motion & particles"
          >
            <RangeField
              {...MOTION_RANGES.orbMinScale}
              label="Resting orb size"
              onChange={(value) => updateActive("motion.orbMinScale", (draft) => (draft.motion.orbMinScale = value))}
              value={activeProfile.motion.orbMinScale}
              valueLabel={`${activeProfile.motion.orbMinScale.toFixed(2)}×`}
            />
            <RangeField
              {...MOTION_RANGES.orbMaxScale}
              label="Full orb size"
              onChange={(value) => updateActive("motion.orbMaxScale", (draft) => (draft.motion.orbMaxScale = value))}
              value={activeProfile.motion.orbMaxScale}
              valueLabel={`${activeProfile.motion.orbMaxScale.toFixed(2)}×`}
            />
            <RangeField
              {...PHASE_RANGES.visual.orbScale}
              hint={`Position between resting and full size during ${PHASE_LABELS[selectedPhaseId].toLowerCase()}.`}
              label="Phase orb size"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.orbScale`, (draft) => {
                  draft.phases[selectedPhaseId].visual.orbScale = value;
                })
              }
              value={phase.visual.orbScale}
              valueLabel={formatPercent(phase.visual.orbScale)}
            />
            <RangeField
              {...MOTION_RANGES.morphAmount}
              label="Organic shape"
              onChange={(value) => updateActive("motion.morphAmount", (draft) => (draft.motion.morphAmount = value))}
              value={activeProfile.motion.morphAmount}
              valueLabel={formatPercent(activeProfile.motion.morphAmount)}
            />
            <SelectField
              hint="How this phase arrives from the one before it."
              label="Transition feel"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.curve`, (draft) => {
                  draft.phases[selectedPhaseId].visual.curve = value as typeof phase.visual.curve;
                })
              }
              options={CURVES}
              value={phase.visual.curve}
            />
            <div className={styles.controlDivider} />
            <RangeField
              {...MOTION_RANGES.particleDensity}
              label="Particle amount"
              onChange={(value) =>
                updateActive("motion.particleDensity", (draft) => (draft.motion.particleDensity = value))
              }
              value={activeProfile.motion.particleDensity}
              valueLabel={formatPercent(activeProfile.motion.particleDensity)}
            />
            <RangeField
              {...MOTION_RANGES.particleDrift}
              label="Ambient drift"
              onChange={(value) => updateActive("motion.particleDrift", (draft) => (draft.motion.particleDrift = value))}
              value={activeProfile.motion.particleDrift}
              valueLabel={`${activeProfile.motion.particleDrift.toFixed(1)}×`}
            />
            <RangeField
              {...PHASE_RANGES.visual.particleFlow}
              label="Phase flow"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.particleFlow`, (draft) => {
                  draft.phases[selectedPhaseId].visual.particleFlow = value;
                })
              }
              value={phase.visual.particleFlow}
              valueLabel={formatSigned(phase.visual.particleFlow)}
            />
            <RangeField
              {...PHASE_RANGES.visual.particleVelocity}
              label="Phase particle speed"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.particleVelocity`, (draft) => {
                  draft.phases[selectedPhaseId].visual.particleVelocity = value;
                })
              }
              value={phase.visual.particleVelocity}
              valueLabel={`${phase.visual.particleVelocity.toFixed(1)}×`}
            />
            <RangeField
              {...MOTION_RANGES.gravityOffsetY}
              hint="Negative values lift the visual center above the orb."
              label="Particle center"
              onChange={(value) =>
                updateActive("motion.gravityOffsetY", (draft) => (draft.motion.gravityOffsetY = value))
              }
              value={activeProfile.motion.gravityOffsetY}
              valueLabel={formatSigned(activeProfile.motion.gravityOffsetY)}
            />
            <RangeField
              {...MOTION_RANGES.cycleSmoothing}
              label="Cycle softness"
              onChange={(value) =>
                updateActive("motion.cycleSmoothing", (draft) => (draft.motion.cycleSmoothing = value))
              }
              value={activeProfile.motion.cycleSmoothing}
              valueLabel={formatPercent(activeProfile.motion.cycleSmoothing)}
            />
          </ControlSection>

          <ControlSection
            description="Audition the atmosphere and boundary cue through the production audio engine."
            eyebrow="03 · Sound"
            title="Audio"
          >
            <SelectField
              label="Soundscape"
              onChange={(value) =>
                updateActive("audio.soundscape", (draft) => {
                  draft.audio.soundscape = value as typeof draft.audio.soundscape;
                })
              }
              options={SOUNDSCAPES}
              value={activeProfile.audio.soundscape}
            />
            <RangeField
              {...AUDIO_RANGES.ambientVolume}
              label="Atmosphere volume"
              onChange={(value) => updateActive("audio.ambientVolume", (draft) => (draft.audio.ambientVolume = value))}
              value={activeProfile.audio.ambientVolume}
              valueLabel={formatPercent(activeProfile.audio.ambientVolume)}
            />
            <RangeField
              {...AUDIO_RANGES.cueVolume}
              label="Cue volume"
              onChange={(value) => updateActive("audio.cueVolume", (draft) => (draft.audio.cueVolume = value))}
              value={activeProfile.audio.cueVolume}
              valueLabel={formatPercent(activeProfile.audio.cueVolume)}
            />
            <RangeField
              {...AUDIO_RANGES.breathModulation}
              hint="How strongly the atmosphere opens and closes with the breath."
              label="Breath response"
              onChange={(value) =>
                updateActive("audio.breathModulation", (draft) => (draft.audio.breathModulation = value))
              }
              value={activeProfile.audio.breathModulation}
              valueLabel={formatPercent(activeProfile.audio.breathModulation)}
            />
            <div className={styles.controlDivider} />
            <SelectField
              label={`${PHASE_LABELS[selectedPhaseId]} cue`}
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.audio.cue`, (draft) => {
                  draft.phases[selectedPhaseId].audio.cue = value as typeof phase.audio.cue;
                })
              }
              options={PHASE_CUES}
              value={phase.audio.cue}
            />
            <RangeField
              {...PHASE_RANGES.audio.volume}
              label="This cue's level"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.audio.volume`, (draft) => {
                  draft.phases[selectedPhaseId].audio.volume = value;
                })
              }
              value={phase.audio.volume}
              valueLabel={formatPercent(phase.audio.volume)}
            />
            <RangeField
              {...PHASE_RANGES.audio.pitchSemitones}
              hint="Keep this subtle so the tone stays fused with its soft transient."
              label="Cue pitch"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.audio.pitchSemitones`, (draft) => {
                  draft.phases[selectedPhaseId].audio.pitchSemitones = value;
                })
              }
              value={phase.audio.pitchSemitones}
              valueLabel={formatSigned(phase.audio.pitchSemitones, " st")}
            />
            <p className={styles.microcopy}>
              The three cue families are the exact production inhale, hold, and exhale sounds. Ambients fade in over roughly two seconds, matching the live experience.
            </p>
          </ControlSection>

          <ControlSection
            description="Give each transition a distinct tactile character."
            eyebrow="04 · Touch"
            title="Haptics"
          >
            <ToggleField
              checked={activeProfile.guidance.haptics}
              hint="Turns tactile phase guidance on for this mode."
              label="Use haptics"
              onChange={(value) => updateActive("guidance.haptics", (draft) => (draft.guidance.haptics = value))}
            />
            <SelectField
              label={`${PHASE_LABELS[selectedPhaseId]} feeling`}
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.haptic.pattern`, (draft) => {
                  draft.phases[selectedPhaseId].haptic.pattern = value as typeof phase.haptic.pattern;
                })
              }
              options={HAPTIC_PATTERNS}
              value={phase.haptic.pattern}
            />
            <RangeField
              {...PHASE_RANGES.haptic.intensity}
              label="Strength"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.haptic.intensity`, (draft) => {
                  draft.phases[selectedPhaseId].haptic.intensity = value;
                })
              }
              value={phase.haptic.intensity}
              valueLabel={formatPercent(phase.haptic.intensity)}
            />
            <RangeField
              {...PHASE_RANGES.haptic.sharpness}
              hint="Soft on the left, precise on the right."
              label="Crispness"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.haptic.sharpness`, (draft) => {
                  draft.phases[selectedPhaseId].haptic.sharpness = value;
                })
              }
              value={phase.haptic.sharpness}
              valueLabel={formatPercent(phase.haptic.sharpness)}
            />
            <RangeField
              {...PHASE_RANGES.haptic.durationMs}
              label="Length"
              onChange={(value) =>
                updateActive(`${selectedPhaseId}.haptic.durationMs`, (draft) => {
                  draft.phases[selectedPhaseId].haptic.durationMs = value;
                })
              }
              value={phase.haptic.durationMs}
              valueLabel={`${phase.haptic.durationMs} ms`}
            />
            <button className={styles.secondaryButton} onClick={previewHaptic} type="button">
              <span className={styles.hapticGlyph} />
              Test on this device
            </button>
            <p className={styles.microcopy}>
              Browser vibration previews timing and strength where supported. Native iPhone crispness still requires TestFlight.
            </p>
          </ControlSection>

          <ControlSection
            description="Decide how much instruction remains, then shape the final rest."
            eyebrow="05 · Direction"
            title="Guidance & landing"
          >
            <ToggleField
              checked={activeProfile.guidance.showLabels}
              hint="Keep phase names visible during the session."
              label="Show instructions"
              onChange={(value) =>
                updateActive("guidance.showLabels", (draft) => (draft.guidance.showLabels = value))
              }
            />
            <ToggleField
              checked={activeProfile.guidance.audioCues}
              hint="Play the selected sound when each phase begins."
              label="Use phase sounds"
              onChange={(value) => updateActive("guidance.audioCues", (draft) => (draft.guidance.audioCues = value))}
            />
            <RangeField
              {...GUIDANCE_RANGES.instructionFadeCycles}
              hint="Set to zero to keep labels for the whole practice."
              label="Fade instructions after"
              onChange={(value) =>
                updateActive("guidance.instructionFadeCycles", (draft) => {
                  draft.guidance.instructionFadeCycles = value;
                })
              }
              value={activeProfile.guidance.instructionFadeCycles}
              valueLabel={
                activeProfile.guidance.instructionFadeCycles === 0
                  ? "Never"
                  : `${activeProfile.guidance.instructionFadeCycles} cycles`
              }
            />
            <div className={styles.landingCard}>
              <div>
                <span className={styles.fieldLabel}>Landing moment</span>
                <p>The settle phase becomes the visual and tactile rest after the final exhale.</p>
              </div>
              <button onClick={() => setSelectedPhaseId("holdOut")} type="button">
                Edit settle
              </button>
            </div>
            <RangeField
              {...PHASE_RANGES.visual.edgeGlow}
              label="Landing glow"
              onChange={(value) =>
                updateActive("holdOut.edgeGlow", (draft) => {
                  draft.phases.holdOut.visual.edgeGlow = value;
                })
              }
              value={activeProfile.phases.holdOut.visual.edgeGlow}
              valueLabel={formatPercent(activeProfile.phases.holdOut.visual.edgeGlow)}
            />
            <RangeField
              {...PHASE_RANGES.visual.lightIntensity}
              label="Resting light"
              onChange={(value) =>
                updateActive("holdOut.lightIntensity", (draft) => {
                  draft.phases.holdOut.visual.lightIntensity = value;
                })
              }
              value={activeProfile.phases.holdOut.visual.lightIntensity}
              valueLabel={formatPercent(activeProfile.phases.holdOut.visual.lightIntensity)}
            />
          </ControlSection>
        </aside>
      </div>

      {notice ? (
        <div aria-live="polite" className={styles.toast} role="status">
          <Check aria-hidden="true" size={15} />
          {notice}
        </div>
      ) : null}
    </main>
  );
}
