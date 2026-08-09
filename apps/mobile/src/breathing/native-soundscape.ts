import { useCallback, useEffect, useRef } from 'react';
import { AudioContext as RNAudioContext, AudioManager } from 'react-native-audio-api';
import { AudioService, ModeName } from '@resonance/audio';

import { BREATHING_PATTERNS } from '../components/breathing-web/constants';

/**
 * Native soundscape driver — runs the SAME @resonance/audio engine the web
 * app uses, on react-native-audio-api's AudioContext, so mobile finally
 * sounds like the web experience (per-mode drone/pink-noise beds, binaural
 * layers, live-synthesized cues) instead of the old calm-bed.m4a + canned
 * WAV stopgap. Native playback also survives the silent switch and screen
 * lock (AVAudioSession category 'playback'), which is the reason the WKWebView
 * engine is disabled on iOS in the first place.
 *
 * Event contract (all emitted by the DOM webview today):
 * - audio_state {active, muted, mode}  → start/stop/retarget the soundscape
 * - phase_haptic {phase, color}        → play cue + re-anchor the phase clock
 * - onSessionComplete()                → queue one post-stop completion bloom
 * - persist(resonance_settings)        → speed multiplier for phase durations
 *
 * The webview stays the timing authority; this hook only interpolates phase
 * progress between transitions (for the breath-coupled noise filter and the
 * session arc), so drift self-corrects on every phase event.
 */

type CuePhase = 'inhale' | 'exhale' | 'hold';

function cueForPhase(phase: unknown): CuePhase | null {
  if (phase === 'Inhale' || phase === 'Inhale (Top up)') return 'inhale';
  if (phase === 'Exhale') return 'exhale';
  if (phase === 'Hold In' || phase === 'Hold Out') return 'hold';
  return null;
}

function phaseDurationSeconds(phase: unknown, mode: ModeName, speedMultiplier: number): number {
  const pattern = BREATHING_PATTERNS[mode as unknown as keyof typeof BREATHING_PATTERNS];
  if (!pattern) return 4 * speedMultiplier;
  const base =
    phase === 'Inhale' ? pattern.inhale
    : phase === 'Inhale (Top up)' ? (pattern.inhale2 ?? pattern.inhale)
    : phase === 'Exhale' ? pattern.exhale
    : phase === 'Hold In' ? pattern.holdIn
    : phase === 'Hold Out' ? pattern.holdOut
    : pattern.inhale;
  return Math.max(0.5, (base || 4) * speedMultiplier);
}

function isModeName(value: unknown): value is ModeName {
  return typeof value === 'string' && value in BREATHING_PATTERNS;
}

const TICK_MS = 100; // Breath-coupled ramps are setTargetAtTime smoothed; 10Hz is plenty.

export interface NativeSoundscapeHandle {
  /** audio_state event from the webview. */
  onAudioState(params: { active?: unknown; muted?: unknown; mode?: unknown }): void;
  /** phase_haptic event from the webview. */
  onPhase(phase: unknown, color?: unknown): void;
  /** Successful timed session completion; plays once after the ambient stop. */
  onSessionComplete(): void;
  /** Speed multiplier from mirrored resonance settings. */
  onSpeedMultiplier(speed: number): void;
  /** binauralEnabled from mirrored resonance settings (web parity: users can turn the binaural layer off). */
  onBinauralEnabled(enabled: boolean): void;
  /** App moved to background/foreground. */
  onAppState(state: 'active' | 'background'): void;
}

export function useNativeSoundscape(): NativeSoundscapeHandle {
  const engineRef = useRef<AudioService | null>(null);
  const activeRef = useRef(false);
  const modeRef = useRef<ModeName>(ModeName.Box);
  const speedRef = useRef(1);
  const binauralRef = useRef(true); // web default: on
  const phaseRef = useRef<{ name: unknown; cue: CuePhase; startedAtMs: number }>({
    name: 'Inhale',
    cue: 'inhale',
    startedAtMs: 0,
  });
  const sessionStartMsRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Completion is signalled by the host callback before the webview's
  // audio_state {active:false} teardown. Keep a generation token so the cue is
  // emitted once per run, regardless of which callback arrives first.
  const sessionGenerationRef = useRef(0);
  const pendingCompletionRef = useRef<{ generation: number; muted: boolean } | null>(null);
  const playedCompletionGenerationRef = useRef<number | null>(null);
  const mutedRef = useRef(false);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      
      // One-time AVAudioSession setup — 'playback' survives the silent switch
      // and (with UIBackgroundModes:audio) the lock screen.
      try {
        AudioManager.setAudioSessionOptions({
          iosCategory: 'playback',
          iosMode: 'default',
          iosOptions: [],
        });
      } catch (error) {
        if (__DEV__) console.warn('[soundscape] audio session setup failed', error);
      }
      engineRef.current = new AudioService({
        debug: __DEV__,
        platform: {
          createContext: () => new RNAudioContext() as unknown as AudioContext,
          // RNAA renders rapid setTargetAtTime re-scheduling as FM warble;
          // its linear ramps are sample-accurate. See AudioPlatformAdapter.
          preferLinearRamps: true,
        },
      });
    }
    return engineRef.current;
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const meterLogAtRef = useRef(0);
  const arcAtRef = useRef(0);

  const startTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      const engine = engineRef.current;
      if (!engine || !activeRef.current) return;
      const now = Date.now();
      // Dev-only liveness proof: post-limiter RMS should sit well above -90dB
      // while a soundscape runs. This is how a simulator run (no ears) verifies
      // the graph is actually producing signal.
      if (__DEV__ && now - meterLogAtRef.current > 2000) {
        meterLogAtRef.current = now;
        try {
          const m = engine.getMeterValues();
          // Param-level probes (dev-only, private access): ctx.currentTime must
          // advance between logs (proves the render thread runs) and layer
          // gains must ramp above 0 (proves param automation works — every
          // layer fades in from 0, so broken scheduling === total silence).
          const anyEngine = engine as unknown as {
            ctx?: { currentTime: number } | null;
            masterGain?: { gain: { value: number } } | null;
            noiseNode?: { gain: { gain: { value: number } } } | null;
            subBassNode?: { gain: { gain: { value: number } } } | null;
          };
          // Octave-band spectrum from the in-line analyser (real on native):
          // distinguishes tonal drone content (low-band peaks) from noise beds
          // (broadband) — i.e. does Box sound like Box, not just "is it loud".
          let bands = '';
          const analyser = (engine as unknown as { postLimitAnalyser?: AnalyserNode | null }).postLimitAnalyser;
          if (analyser) {
            // 8192-point FFT (5.4Hz bins) — precise enough to catch wrong
            // pitches (a semitone at C3 is ~7.8Hz). Log the top spectral peaks
            // so we can compare actual partial frequencies against the
            // engine's intended root/partial table.
            if (analyser.fftSize !== 8192) {
              try { analyser.fftSize = 8192; } catch { /* keep default */ }
            }
            const freq = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(freq);
            const sr = (engine as unknown as { ctx?: { sampleRate: number } }).ctx?.sampleRate ?? 44100;
            const hzPerBin = sr / 2 / freq.length;
            const peaks: { hz: number; db: number }[] = [];
            const maxBin = Math.min(freq.length, Math.ceil(3000 / hzPerBin));
            for (let i = 2; i < maxBin - 1; i++) {
              if (freq[i] > -95 && freq[i] >= freq[i - 1] && freq[i] >= freq[i + 1]) {
                peaks.push({ hz: i * hzPerBin, db: freq[i] });
              }
            }
            peaks.sort((a, b) => b.db - a.db);
            bands = ` | peaks ${peaks.slice(0, 8).map((p) => `${p.hz.toFixed(0)}Hz:${p.db.toFixed(0)}`).join(' ')}`;
          }
          console.log(
            `[soundscape] meters post=${m.postLimiter.rmsDb.toFixed(1)}dB ` +
            `noise=${m.layers.pinkNoise.rmsDb.toFixed(1)} sub=${m.layers.subBass.rmsDb.toFixed(1)} ` +
            `| t=${anyEngine.ctx?.currentTime?.toFixed(2)} master=${anyEngine.masterGain?.gain.value?.toFixed(3)} ` +
            `noiseG=${anyEngine.noiseNode?.gain.gain.value?.toFixed(4)} subG=${anyEngine.subBassNode?.gain.gain.value?.toFixed(4)}${bands}`,
          );
        } catch {
          // Meters are diagnostics only.
        }
      }
      const { name, cue, startedAtMs } = phaseRef.current;
      const duration = phaseDurationSeconds(name, modeRef.current, speedRef.current);
      const progress = startedAtMs
        ? Math.min(1, (now - startedAtMs) / 1000 / duration)
        : 0;
      engine.updatePinkNoisePhase(cue, progress);
      engine.updatePhaseEnvelope(cue, progress);
      engine.updateSpatial(now);
      // Session arc at 5s cadence, NOT per-tick: react-native-audio-api renders
      // rapid setTargetAtTime re-scheduling on OscillatorNode.frequency as FM
      // warble (verified 2026-07-22 — 10Hz arc updates turned the Box drone
      // into an inharmonic cluster). The arc drifts ~4 cents per 5s step, so
      // this cadence is inaudible while keeping the 4-minute texture evolution.
      if (sessionStartMsRef.current && now - arcAtRef.current > 5000) {
        arcAtRef.current = now;
        engine.tickSessionArc((now - sessionStartMsRef.current) / 1000);
      }
    }, TICK_MS);
  }, []);

  // Generation token: a newer start (rapid mode switch) invalidates any
  // in-flight one at each await point, so two runs can't double-start layers.
  const startGenRef = useRef(0);

  const startSoundscape = useCallback(async (mode: ModeName) => {
    const gen = ++startGenRef.current;
    const engine = getEngine();
    const color = BREATHING_PATTERNS[mode as unknown as keyof typeof BREATHING_PATTERNS]?.color;
    engine.setBreathingMode(mode);
    if (color) engine.setThemeColor(color);
    const ready = await engine.resume();
    if (gen !== startGenRef.current) return;
    if (!ready) {
      if (__DEV__) console.warn('[soundscape] engine.resume() failed');
      return;
    }
    engine.stopAmbient();
    // Same per-mode recipe as the web app (Resonance.tsx handleTogglePlay):
    // Relax/Coherent ride the breath-coupled pink-noise bed; Wim Hof gets an
    // energizing drone + beta; everything else gets drone + alpha. Sub-bass
    // pairs with every bed.
    if (mode === ModeName.WimHof) {
      await engine.startDrone(color ?? '#4f46e5');
      if (gen !== startGenRef.current) return;
      if (binauralRef.current) await engine.startBinaural(15);
    } else if (mode === ModeName.Relax || mode === ModeName.Coherent) {
      await engine.startPinkNoise();
      if (gen !== startGenRef.current) return;
      if (binauralRef.current) await engine.startBinaural(mode === ModeName.Relax ? 2 : 10);
    } else {
      await engine.startDrone(color ?? '#4f46e5');
      if (gen !== startGenRef.current) return;
      if (binauralRef.current) await engine.startBinaural(10);
    }
    if (gen !== startGenRef.current) return;
    await engine.startSubBass(color);
    if (gen !== startGenRef.current) return;
    if (!sessionStartMsRef.current) sessionStartMsRef.current = Date.now();
    startTick();
    if (__DEV__) console.log(`[soundscape] started — mode=${mode}`);
  }, [getEngine, startTick]);

  const stopSoundscape = useCallback((options: { fade?: boolean } = {}) => {
    // Invalidate an in-flight recipe rebuild before stopping layers. Without
    // this, a completion teardown racing an awaited start could resurrect an
    // ambient layer after the completion bloom starts.
    startGenRef.current += 1;
    stopTick();
    sessionStartMsRef.current = 0;
    const engine = engineRef.current;
    if (!engine) return;
    if (options.fade) {
      void engine.fadeOutAndSuspend({ fadeSeconds: 0.25 });
    } else {
      engine.stopAmbient();
      engine.stopCues();
    }
    if (__DEV__) console.log('[soundscape] stopped');
  }, [stopTick]);

  const playCompletionCueForGeneration = useCallback((generation: number, muted: boolean) => {
    if (generation <= 0 || playedCompletionGenerationRef.current === generation) return;
    const engine = engineRef.current;
    if (!engine) return;
    playedCompletionGenerationRef.current = generation;
    pendingCompletionRef.current = null;
    if (!muted) engine.playCompletionCue();
  }, []);

  const onSessionComplete = useCallback(() => {
    const generation = sessionGenerationRef.current;
    if (
      generation <= 0 ||
      playedCompletionGenerationRef.current === generation ||
      pendingCompletionRef.current?.generation === generation
    ) {
      return;
    }

    if (activeRef.current) {
      pendingCompletionRef.current = { generation, muted: mutedRef.current };
      return;
    }

    // Handles the alternate ordering (audio_state false first) and duplicate
    // completion callbacks without replaying the bloom.
    playCompletionCueForGeneration(generation, mutedRef.current);
  }, [playCompletionCueForGeneration]);

  const onAudioState = useCallback<NativeSoundscapeHandle['onAudioState']>((params) => {
    const active = params.active === true;
    const muted = params.muted === true;
    const mode = isModeName(params.mode) ? (params.mode as ModeName) : modeRef.current;

    const engine = getEngine();
    engine.toggleMute(muted);

    const modeChanged = mode !== modeRef.current;
    modeRef.current = mode;
    // Layer gains ramp in at their isMuted-aware targets, so a session started
    // muted has every layer parked at 0 — a plain unmute only restores the
    // master bus. Restart the recipe on unmute so the layers re-ramp to their
    // audible targets.
    const unmuted = mutedRef.current && !muted;
    mutedRef.current = muted;

    // A mode switch is its own hard boundary. If it races a stale completion
    // callback, discard the pending completion rather than cueing a mode change.
    if (modeChanged && pendingCompletionRef.current?.generation === sessionGenerationRef.current) {
      pendingCompletionRef.current = null;
    }

    if (active && (!activeRef.current || modeChanged || unmuted)) {
      if (!activeRef.current) {
        sessionGenerationRef.current += 1;
        pendingCompletionRef.current = null;
        playedCompletionGenerationRef.current = null;
      }
      activeRef.current = true;
      void startSoundscape(mode);
    } else if (!active && activeRef.current) {
      const pendingCompletion =
        pendingCompletionRef.current?.generation === sessionGenerationRef.current
          ? pendingCompletionRef.current
          : null;
      activeRef.current = false;
      pendingCompletionRef.current = null;
      stopSoundscape();
      if (pendingCompletion !== null) {
        playCompletionCueForGeneration(
          pendingCompletion.generation,
          pendingCompletion.muted,
        );
      }
    }
  }, [getEngine, playCompletionCueForGeneration, startSoundscape, stopSoundscape]);

  const onPhase = useCallback<NativeSoundscapeHandle['onPhase']>((phase, color) => {
    const cue = cueForPhase(phase);
    if (!cue) return;
    phaseRef.current = { name: phase, cue, startedAtMs: Date.now() };
    if (!activeRef.current) return;
    const engine = engineRef.current;
    if (!engine) return;
    engine.playCue(cue, typeof color === 'string' ? color : undefined);
  }, []);

  const onSpeedMultiplier = useCallback<NativeSoundscapeHandle['onSpeedMultiplier']>((speed) => {
    if (Number.isFinite(speed) && speed > 0) speedRef.current = speed;
  }, []);

  const onBinauralEnabled = useCallback<NativeSoundscapeHandle['onBinauralEnabled']>((enabled) => {
    const changed = binauralRef.current !== enabled;
    binauralRef.current = enabled;
    // Mid-session toggle: restart the recipe so the layer set matches, same
    // as the unmute path.
    if (changed && activeRef.current) void startSoundscape(modeRef.current);
  }, [startSoundscape]);

  const onAppState = useCallback<NativeSoundscapeHandle['onAppState']>((state) => {
    // Backgrounding keeps the soundscape alive (that's the point of native
    // playback + UIBackgroundModes). The webview separately pauses/ends the
    // session when appropriate and its audio_state event lands here.
    void state;
  }, []);

  useEffect(() => {
    return () => {
      stopTick();
      void engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [stopTick]);

  return {
    onAudioState,
    onPhase,
    onSessionComplete,
    onSpeedMultiplier,
    onBinauralEnabled,
    onAppState,
  };
}
