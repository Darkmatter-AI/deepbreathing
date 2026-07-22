/**
 * Generative audio engine for Resonance.
 * - Drone pads move through an 8D panner.
 * - Pink noise beds emulate rain.
 * - Phase cues shift timbre based on the active color theme.
 * - Binaural beats accept adaptive entrainment frequencies.
 */
import { ModeName } from './modes';

/**
 * Platform seam. The engine is pure Web Audio; the only environment-specific
 * pieces are how an AudioContext is created and whether the HTML `<audio>`
 * autoplay-unlock dance applies. Web callers pass nothing (browser defaults);
 * React Native callers inject `react-native-audio-api`'s AudioContext via
 * `createContext` (the unlock hack self-disables where `document` is absent).
 */
export interface AudioPlatformAdapter {
  createContext(): AudioContext | null;
  /**
   * Use linearRampToValueAtTime instead of repeated setTargetAtTime for
   * continuously-retargeted params (breath-coupled filters, session-arc
   * glides). react-native-audio-api renders rapid setTargetAtTime
   * re-scheduling as audible FM warble / inharmonic sidebands (verified
   * 2026-07-22); its linear ramps are sample-accurate. Web leaves this unset
   * and keeps the original exponential-approach smoothing.
   */
  preferLinearRamps?: boolean;
}

export type CueType = 'inhale' | 'exhale' | 'hold';

export interface CuePlaybackOptions {
  gainScale?: number;
  pitchSemitones?: number;
}

// Pink-noise bed breath-coupled filter cutoff range. Tuned by ear: opens
// enough to feel like the texture "brightens" on inhale without becoming
// hissy, closes far enough on exhale to feel like the wave receded.
const NOISE_FILTER_BASE_HZ = 480;
const NOISE_FILTER_PEAK_HZ = 2400;
const NOISE_FILTER_Q = 0.7;

// Drone-bus lowpass. The warm-themed drone uses triangle oscillators whose
// high harmonics (and the HRTF panner's per-frame position writes) radiate
// broadband HF energy that reads as a faint "static/hiss" on the drone-using
// techniques (box, sigh, wim-hof — the slow modes use the pink-noise bed
// instead, which is why they never hissed). The drone is a low pad; roots are
// 87–165 Hz with partials up to 2× root (~330 Hz), so a gentle lowpass here
// keeps the low harmonics that give it warmth while removing the hiss band.
// See tools/orb-video ROADMAP for the isolation evidence.
const DRONE_LOWPASS_HZ = 2000;
const DRONE_LOWPASS_Q = 0.5;

interface CueProfile {
  oscType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  pitchShift: number;
  detune: number;
  harmonics: number[];
}

 type CuePreset = {
   duration: number;
   tone?: {
     oscType: OscillatorType;
     freqStart: number;
     freqEnd: number;
     detune: number;
     attack: number;
     release: number;
     gain: number;
   };
   noise?: {
     gain: number;
     attack: number;
     release: number;
     lowpassStart: number;
     lowpassEnd: number;
     highpass: number;
     q: number;
   };
   reverb?: {
     mix: number;
     duration: number;
     decay: number;
   };
   masterLowpassHz: number;
 };

export interface MeterReading {
  peakDb: number;
  rmsDb: number;
}

export interface MeterValues {
  preCompressor: MeterReading;
  postLimiter: MeterReading;
  compressorReductionDb: number;
  limiterReductionDb: number;
  layers: {
    drone: MeterReading;
    subBass: MeterReading;
    pinkNoise: MeterReading;
    envelope: MeterReading;
  };
}

export interface TuningSnapshot {
  compressor: { threshold: number; knee: number; ratio: number; attack: number; release: number };
  limiter: { threshold: number; knee: number; ratio: number; attack: number; release: number };
  masterTrim: number;
  droneScale: number;
  subBassScale: number;
  subBassFreqMultiplier: number;
  pinkNoiseScale: number;
  pinkNoiseFilter: { baseHz: number; peakHz: number; q: number };
  binauralScale: number;
  phaseEnvelopeScale: number;
  phaseEnvelopeFreqMultiplier: number;
  cueToneScale: number;
  cueNoiseScale: number;
  cueReverbMix: number;
  arcWindowSeconds: number;
  arcRootDriftFactor: number;
  arcLfoSlowdownFactor: number;
  arcOrbitSlowdownFactor: number;
}

export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterSoftClip: WaveShaperNode | null = null;
  private masterTrim: GainNode | null = null;
  private preCompAnalyser: AnalyserNode | null = null;
  private postLimitAnalyser: AnalyserNode | null = null;
  private droneAnalyser: AnalyserNode | null = null;
  private subBassAnalyser: AnalyserNode | null = null;
  private pinkNoiseAnalyser: AnalyserNode | null = null;
  private envelopeAnalyser: AnalyserNode | null = null;
  private debug = false;
  private disposed = false;
  private activeCueBuses = new Set<GainNode>();
  private mediaUnlocking: Promise<void> | null = null;
  private mediaUnlocked = false;

  // Live-tweakable scale multipliers — applied on top of the existing per-layer
  // target gains so the debug panel can ride levels without recompiling.
  private droneScale = 1;
  private subBassScale = 1;
  private subBassFreqMultiplier = 1;
  private subBassRootHz = 0;
  private pinkNoiseScale = 1;
  private noiseFilterBaseHz = NOISE_FILTER_BASE_HZ;
  private noiseFilterPeakHz = NOISE_FILTER_PEAK_HZ;
  private noiseFilterQ = NOISE_FILTER_Q;
  private binauralScale = 1;
  private phaseEnvelopeScale = 1;
  private phaseEnvelopeFreqMultiplier = 1;
  private phaseEnvelopeRootHz = 0;
  private cueToneScale = 1;
  private cueNoiseScale = 1;
  private cueReverbMix = 1;

  // Session-arc tunables — replace the prior hardcoded constants so the debug
  // panel can dial the arc shape live.
  private arcWindowSeconds = 240;
  private arcRootDriftFactor = 8 / 9;
  private arcLfoSlowdownFactor = 0.5;
  private arcOrbitSlowdownFactor = 0.4;

  // Session-arc evolution state — captured when the drone starts so we can
  // ramp params relative to their initial values.
  private droneArc: {
    startedAt: number; // ctx.currentTime at startDrone
    rootHz: number;
    lfoRates: number[]; // initial LFO frequency per partial
    spatialSpeed: number; // initial orbit speed
  } | null = null;
  private droneLfoNodes: OscillatorNode[] = [];
  private spatialSpeedOverride: number | null = null;

  // Spatializer per drone partial. HRTF PannerNode on platforms that have it
  // (browsers); StereoPanner orbit fallback where PannerNode isn't implemented
  // yet (react-native-audio-api — upgrade to 'hrtf' when the library ships it).
  private droneNodes: {
    osc: OscillatorNode;
    spatial:
      | { kind: 'hrtf'; panner: PannerNode }
      | { kind: 'stereo'; panner: StereoPannerNode };
    gain: GainNode;
  }[] = [];
  // Shared post-panner lowpass that all drone partials route through before the
  // master bus — strips the triangle-harmonic / panner-zipper HF "hiss".
  private droneLowpass: BiquadFilterNode | null = null;
  private binauralNodes: { osc: OscillatorNode; pan: StereoPannerNode; gain: GainNode }[] = [];
  private noiseNode: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } | null = null;
  private subBassNode: {
    osc: OscillatorNode;
    gain: GainNode;
    lfo: OscillatorNode;
  } | null = null;
  private phaseEnvelopeNode: {
    osc: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } | null = null;

   private breathingMode: ModeName = ModeName.Box;
   private cueNoiseBuffer: AudioBuffer | null = null;
   private cueReverbCache: Map<string, ConvolverNode> = new Map();

  private isMuted = false;
  private cueVolume = 0.32;
  private musicVolume = 0.3;
  private themeColor = '#4f46e5';

  private platform: AudioPlatformAdapter | null = null;

  constructor(options: { debug?: boolean; platform?: AudioPlatformAdapter } = {}) {
    this.debug = Boolean(options.debug);
    this.platform = options.platform ?? null;
  }

  /**
   * Glide a param toward `target`: exponential approach on web
   * (setTargetAtTime), an explicit linear ramp on platforms that mis-render
   * repeated setTargetAtTime (see AudioPlatformAdapter.preferLinearRamps).
   * `seconds` approximates the time constant / ramp horizon.
   */
  private glideParam(param: AudioParam, target: number, seconds: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.platform?.preferLinearRamps) {
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(target, t + Math.max(0.02, seconds));
    } else {
      param.setTargetAtTime(target, t, seconds);
    }
  }

  private log(...args: unknown[]) {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[AudioService]', ...args);
    }
  }

  private async unlockWithMediaElement() {
    // Browser-only autoplay dance; no-op wherever there's no DOM (React Native).
    if (typeof document === 'undefined') return;
    if (this.mediaUnlocked || typeof window === 'undefined') return;
    if (this.mediaUnlocking) return this.mediaUnlocking;

    const src =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=';

    this.mediaUnlocking = (async () => {
      try {
        const el = document.createElement('audio');
        el.src = src;
        el.loop = false;
        el.autoplay = false;
        (el as any).playsInline = true;
        el.setAttribute('playsinline', 'true');
        el.muted = true; // muted to satisfy autoplay but still trigger the unlock
        el.volume = 0.0001;
        el.load();
        await el.play();
        el.pause();
        el.currentTime = 0;
        this.mediaUnlocked = true;
        this.log('Media element unlock success');
      } catch (error) {
        this.log('Media element unlock failed', error);
      } finally {
        this.mediaUnlocking = null;
      }
    })();

    return this.mediaUnlocking;
  }

  private initContext() {
    if (this.disposed) return;
    if (this.ctx) return;

    if (this.platform) {
      this.ctx = this.platform.createContext();
    } else if (typeof window !== 'undefined') {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      try {
        this.ctx = new AudioCtor({ latencyHint: 'playback' });
      } catch {
        this.ctx = new AudioCtor();
      }
    }

    if (this.ctx) {
      this.buildOutputChain();
      if (this.debug) {
        this.ctx.onstatechange = () => {
          this.log('statechange', this.ctx?.state);
        };
        this.log('AudioContext created', { state: this.ctx.state });
      }
    }
  }

  /**
   * Output chain: masterGain → compressor → limiter → trim → destination.
   *
   * - Compressor (transparent, slow): catches sustained level from stacked
   *   layers without pumping on every cue transition.
   * - Limiter (brick-wall, fast): catches instantaneous transients from cue
   *   noise puffs that escape the slow compressor — these were clipping.
   * - Trim: -3 dBFS safety margin before destination.
   *
   * Called from initContext AND from ensureContextReady's recreate branch so the
   * chain survives Safari's "interrupted → closed" lifecycle.
   */
  private buildOutputChain() {
    if (!this.ctx) return;
    this.masterGain = this.ctx.createGain();

    // DynamicsCompressorNode is not implemented yet on react-native-audio-api
    // (it's on their roadmap). Where it's missing, a tanh WaveShaper soft-clip
    // stands in for the limiter so transients still can't slam the DAC, and
    // the compressor stage is skipped (fields stay null — every consumer of
    // masterCompressor/masterLimiter already null-guards).
    const supportsCompressor =
      typeof (this.ctx as any).createDynamicsCompressor === 'function';

    if (supportsCompressor) {
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -14;
      this.masterCompressor.knee.value = 24;
      this.masterCompressor.ratio.value = 3;
      this.masterCompressor.attack.value = 0.02;
      this.masterCompressor.release.value = 0.3;

      // True peak limiter — fast attack, near-infinite ratio. Catches the
      // 15–20ms cue noise transients that escape the slow compressor above.
      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.value = -3;
      this.masterLimiter.knee.value = 0;
      this.masterLimiter.ratio.value = 20;
      this.masterLimiter.attack.value = 0.001;
      this.masterLimiter.release.value = 0.05;
    } else {
      this.masterCompressor = null;
      this.masterLimiter = null;
      this.masterSoftClip = this.ctx.createWaveShaper();
      // tanh(kx)/k: unity gain at low level (slope 1 at 0 — the earlier
      // /tanh(k) normalization boosted quiet signal by +4.6dB), soft ceiling
      // tanh(k)/k ≈ 0.695 ≈ -3.2dBFS, matching the web limiter's -3dB
      // threshold behavior.
      const k = 1.2;
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * k) / k;
      }
      this.masterSoftClip.curve = curve;
      this.masterSoftClip.oversample = '2x';
    }

    this.masterTrim = this.ctx.createGain();
    this.masterTrim.gain.value = 0.71; // -3 dBFS safety margin

    // Diagnostic analyser taps — always present (cheap when no consumer is
    // reading) so the debug panel can show where in the chain a peak lives
    // without needing to rebuild graph topology mid-session.
    this.preCompAnalyser = this.ctx.createAnalyser();
    this.preCompAnalyser.fftSize = 1024;
    this.postLimitAnalyser = this.ctx.createAnalyser();
    this.postLimitAnalyser.fftSize = 1024;
    this.droneAnalyser = this.ctx.createAnalyser();
    this.droneAnalyser.fftSize = 1024;
    this.subBassAnalyser = this.ctx.createAnalyser();
    this.subBassAnalyser.fftSize = 1024;
    this.pinkNoiseAnalyser = this.ctx.createAnalyser();
    this.pinkNoiseAnalyser.fftSize = 1024;
    this.envelopeAnalyser = this.ctx.createAnalyser();
    this.envelopeAnalyser.fftSize = 1024;

    this.masterGain.connect(this.preCompAnalyser);
    if (this.masterCompressor && this.masterLimiter) {
      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterLimiter);
      this.masterLimiter.connect(this.masterTrim);
      this.masterLimiter.connect(this.postLimitAnalyser);
    } else if (this.masterSoftClip) {
      this.masterGain.connect(this.masterSoftClip);
      // In-line (not side-tap) analyser: react-native-audio-api only renders
      // nodes on the pulled path to destination, so a side-tap analyser reads
      // permanent silence there. AnalyserNode is a pass-through, so putting it
      // in the chain costs nothing and makes post-chain metering real on
      // native. (The compressor branch above keeps the web-original side-tap.)
      this.masterSoftClip.connect(this.postLimitAnalyser);
      this.postLimitAnalyser.connect(this.masterTrim);
    } else {
      this.masterGain.connect(this.masterTrim);
      this.masterGain.connect(this.postLimitAnalyser);
    }
    this.masterTrim.connect(this.ctx.destination);
  }

  /**
   * Ensure the AudioContext is present and running.
   * Handles Safari's "interrupted" state and recreates the context if it was closed.
   */
  private async ensureContextReady() {
    if (this.disposed) return false;
    this.log('ensureContextReady:begin');
    this.initContext();
    if (!this.ctx) return false;

    // Fire-and-forget media element unlock; don't let a blocked play promise stall resume.
    const unlockPromise = this.unlockWithMediaElement();
    if (unlockPromise) {
      unlockPromise
        .catch((error) => this.log('Media unlock error (non-blocking)', error));
    }

    // Recreate if the context was closed by the browser.
    const state = (this.ctx.state as AudioContextState | 'interrupted');
    if (state === 'closed') {
      this.ctx = null;
      this.masterGain = null;
      this.masterCompressor = null;
      this.masterLimiter = null;
      this.masterSoftClip = null;
      this.masterTrim = null;
      this.preCompAnalyser = null;
      this.postLimitAnalyser = null;
      this.droneAnalyser = null;
      this.subBassAnalyser = null;
      this.pinkNoiseAnalyser = null;
      this.envelopeAnalyser = null;
      this.cueNoiseBuffer = null;
      this.cueReverbCache.clear();
      this.initContext();
      if (!this.ctx) return false;
    }

    if (!this.masterGain && this.ctx) {
      this.buildOutputChain();
    }

    const readyState = (this.ctx.state as AudioContextState | 'interrupted');
    if (readyState === 'suspended' || readyState === 'interrupted') {
      try {
        this.log('Attempting ctx.resume()', { state: this.ctx.state });
        await this.ctx.resume();
        // Some mobile browsers need a beat before the context actually unlocks
        if (this.ctx.state === 'suspended') {
          await new Promise(resolve => setTimeout(resolve, 120));
          await this.ctx.resume();
        }
        if (this.ctx.state === 'suspended') {
          this.log('AudioContext still suspended after resume; recreating');
          const oldCtx = this.ctx;
          try {
            await oldCtx.close();
          } catch (error) {
            this.log('ctx.close failed (can ignore)', error);
          }
          this.ctx = null;
          this.masterGain = null;
          this.masterCompressor = null;
          this.masterLimiter = null;
          this.masterSoftClip = null;
          this.masterTrim = null;
          this.preCompAnalyser = null;
          this.postLimitAnalyser = null;
          this.droneAnalyser = null;
          this.subBassAnalyser = null;
          this.pinkNoiseAnalyser = null;
          this.envelopeAnalyser = null;
          this.initContext();
          if (this.ctx) {
            try {
              await (this.ctx as AudioContext).resume();
            } catch (error) {
              this.log('Recreated ctx resume failed', error);
            }
          }
        }
      } catch (error) {
        console.warn('AudioContext resume failed:', error);
        return false;
      }
    }

    if (this.masterGain && this.ctx && this.masterGain.context !== this.ctx) {
      // Context was rebuilt elsewhere; rebuild the full output chain on the new ctx.
      this.masterGain = null;
      this.masterCompressor = null;
      this.masterLimiter = null;
      this.masterSoftClip = null;
      this.masterTrim = null;
      this.preCompAnalyser = null;
      this.postLimitAnalyser = null;
      this.droneAnalyser = null;
      this.subBassAnalyser = null;
      this.pinkNoiseAnalyser = null;
      this.envelopeAnalyser = null;
      this.cueNoiseBuffer = null;
      this.cueReverbCache.clear();
      this.buildOutputChain();
    }

    this.log('ensureContextReady:end', { state: this.ctx?.state });
    return !this.disposed && this.ctx?.state === 'running';
  }

  public async resume() {
    const ready = await this.ensureContextReady();

    // Mobile browsers require explicit resume after user interaction
    if (ready) {
      this.playSilentUnlock();
    }

    return ready;
  }

  private playSilentUnlock() {
    if (!this.ctx) return;
    const destination = this.masterGain ?? this.ctx.destination;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      osc.connect(gain);
      gain.connect(destination);
      const endTime = now + 0.02;
      osc.start(now);
      osc.stop(endTime);
      this.log('playSilentUnlock fired');
      const cleanup = () => {
        osc.disconnect();
        gain.disconnect();
        osc.removeEventListener('ended', cleanup);
      };
      osc.addEventListener('ended', cleanup);
    } catch (error) {
      console.warn('Silent unlock failed:', error);
    }
  }

  public setThemeColor(colorHex: string) {
    if (!colorHex) return;
    this.themeColor = colorHex;
  }

  public setBreathingMode(mode: ModeName) {
    this.breathingMode = mode;
  }

  /**
   * Slowly rotate drone sources around the listener (8D audio).
   * Orbit speed may be reduced by the session-arc (tickSessionArc).
   */
  public updateSpatial(time: number) {
    if (!this.ctx || this.droneNodes.length === 0) return;
    const speed = this.spatialSpeedOverride ?? 0.0005;

    this.droneNodes.forEach((node, index) => {
      const offset = index * (Math.PI / 2);
      const px = Math.cos(time * speed + offset) * 2;
      const pz = Math.sin(time * speed + offset) * 2;
      if (node.spatial.kind === 'hrtf') {
        node.spatial.panner.positionX.value = px;
        node.spatial.panner.positionZ.value = pz;
        node.spatial.panner.positionY.value = 0;
      } else {
        // Stereo fallback: project the orbit's X onto pan. Depth (Z) is lost;
        // scaled to ±0.8 so partials never hard-pin to one ear.
        node.spatial.panner.pan.value = (px / 2) * 0.8;
      }
    });
  }

  /**
   * Session-arc evolution — slowly drift drone params over the first ~4 minutes
   * of a session so the texture deepens. Called from the rAF loop with the
   * elapsed session seconds. All ramps go to setTargetAtTime so a pause/resume
   * picks up smoothly without restarting the arc.
   *
   * - Root drops a whole tone (factor 8/9) over 4 min — kept small because the
   *   cue layer uses fixed Hz; large drift creates tritones against the cues
   *   (will be revisited when cues become root-relative).
   * - Per-partial LFO rate slows to ~50% over 4 min
   * - 8D orbit speed slows by ~40% over 4 min
   *
   * No-op when no drone is active.
   */
  public tickSessionArc(elapsedSeconds: number) {
    if (!this.ctx || !this.droneArc || this.droneNodes.length === 0) return;
    const window = Math.max(1, this.arcWindowSeconds);
    const t = Math.max(0, Math.min(1, elapsedSeconds / window));
    if (t === 0) return; // Nothing to update on the very first tick.

    const ctxTime = this.ctx.currentTime;
    const TC = 8; // setTargetAtTime time constant — long, imperceptible per-frame change

    // Root: drift toward `rootHz * arcRootDriftFactor` over the window.
    // 1.0 = no drift, 8/9 = whole tone (current default), 2/3 = perfect 5th.
    const driftFactor = this.arcRootDriftFactor;
    const rootTarget = this.droneArc.rootHz * (1 - t * (1 - driftFactor));
    this.droneNodes.forEach((node, index) => {
      // Each partial keeps its ratio to root: [1, 1.5, 2, 0.99]
      const ratios = [1, 1.5, 2, 0.99];
      const ratio = ratios[index] ?? 1;
      this.glideParam(node.osc.frequency, rootTarget * ratio, TC);
    });

    // LFO: slow from initial → (1 - arcLfoSlowdownFactor) over the arc window.
    this.droneLfoNodes.forEach((lfo, index) => {
      const initial = this.droneArc!.lfoRates[index] ?? 0.1;
      const target = initial * (1 - t * this.arcLfoSlowdownFactor);
      this.glideParam(lfo.frequency, target, TC);
    });

    // 8D orbit speed: slow by arcOrbitSlowdownFactor over the arc window.
    this.spatialSpeedOverride = this.droneArc.spatialSpeed * (1 - t * this.arcOrbitSlowdownFactor);
  }

  public setVolume(cueVol: number, musicVol: number) {
    this.cueVolume = cueVol;
    this.musicVolume = musicVol;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.droneNodes.forEach((node) =>
      node.gain.gain.setTargetAtTime(this.droneTargetGain(), now, 0.5)
    );
    this.binauralNodes.forEach((node) =>
      node.gain.gain.setTargetAtTime(this.binauralTargetGain(), now, 0.5)
    );
    if (this.noiseNode) {
      this.noiseNode.gain.gain.setTargetAtTime(this.pinkNoiseTargetGain(), now, 0.5);
    }
    if (this.subBassNode) {
      this.subBassNode.gain.gain.setTargetAtTime(this.subBassTargetGain(), now, 0.5);
    }
  }

  private droneTargetGain() {
    return this.isMuted ? 0 : this.musicVolume * 0.3 * this.droneScale;
  }
  private subBassTargetGain() {
    return this.isMuted ? 0 : this.musicVolume * 0.10 * this.subBassScale;
  }
  private pinkNoiseTargetGain() {
    return this.isMuted ? 0 : this.musicVolume * 0.25 * this.pinkNoiseScale;
  }
  private binauralTargetGain() {
    return this.isMuted ? 0 : 0.05 * this.binauralScale;
  }
  private phaseEnvelopePeakGain() {
    return this.isMuted ? 0 : this.musicVolume * 0.22 * this.phaseEnvelopeScale;
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.1);
    }
  }

  public stopAmbient() {
    this.stopDrone();
    this.stopSubBass();
    this.stopPhaseEnvelope();
    this.stopPinkNoise();
    this.stopBinaural();
  }

  public stopCues() {
    if (!this.ctx) {
      this.activeCueBuses.clear();
      return;
    }

    const now = this.ctx.currentTime;
    this.activeCueBuses.forEach((cueBus) => {
      try {
        cueBus.gain.cancelScheduledValues(now);
        cueBus.gain.setValueAtTime(cueBus.gain.value, now);
        cueBus.gain.linearRampToValueAtTime(0, now + 0.03);
      } catch {
        // Cue may already have ended while the page was backgrounding.
      }
    });
  }

  public async dispose() {
    if (this.disposed) return;
    this.disposed = true;

    const context = this.ctx;
    if (context && this.masterGain && context.state !== 'closed') {
      try {
        const now = context.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
      } catch {
        // Context may already be closing.
      }
    }

    this.stopCues();
    this.stopAmbient();

    if (context && context.state !== 'closed') {
      try {
        await context.close();
      } catch {
        // Ignore browser shutdown races.
      }
    }

    this.ctx = null;
    this.masterGain = null;
    this.masterCompressor = null;
    this.masterLimiter = null;
    this.masterSoftClip = null;
    this.masterTrim = null;
    this.preCompAnalyser = null;
    this.postLimitAnalyser = null;
    this.droneAnalyser = null;
    this.subBassAnalyser = null;
    this.pinkNoiseAnalyser = null;
    this.envelopeAnalyser = null;
    this.droneNodes = [];
    this.droneLfoNodes = [];
    this.binauralNodes = [];
    this.noiseNode = null;
    this.subBassNode = null;
    this.phaseEnvelopeNode = null;
    this.droneLowpass = null;
    this.droneArc = null;
    this.cueNoiseBuffer = null;
    this.cueReverbCache.clear();
    this.activeCueBuses.clear();
  }

  public async fadeOutAndSuspend(options: { fadeSeconds?: number } = {}) {
    const fadeSeconds = options.fadeSeconds ?? 0.35;
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const previousMaster = this.masterGain.gain.value;

    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(previousMaster, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + Math.max(0.05, fadeSeconds));
    } catch {
      // ignore
    }

    this.stopDrone();
    this.stopSubBass();
    this.stopPhaseEnvelope();
    this.stopPinkNoise();
    this.stopBinaural();

    await new Promise((resolve) => setTimeout(resolve, (fadeSeconds * 1000) + 40));

    try {
      await this.ctx.suspend();
    } catch {
      // ignore
    }

    try {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(previousMaster, this.ctx.currentTime);
    } catch {
      // ignore
    }
  }

  /**
   * Breathing cues now adapt oscillator types/envelopes to the color palette.
   */
  public playCue(type: CueType, colorHex?: string, options: CuePlaybackOptions = {}) {
    if (this.isMuted || !this.ctx || !this.masterGain) {
      // If context is suspended, try to resume
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume().catch(console.warn);
      }
      return;
    }

    if (this.ctx.state !== 'running') {
      void this.resume();
      return;
    }

    const theme = colorHex || this.themeColor;
    const preset = this.getCuePreset(this.breathingMode, type, theme);
    const t = this.ctx.currentTime;
    const endTime = t + preset.duration;
    const gainScale = Math.max(0, options.gainScale ?? 1);
    const pitchSemitones = Math.max(-24, Math.min(24, options.pitchSemitones ?? 0));

    const cueBus = this.ctx.createGain();
    cueBus.gain.setValueAtTime(1, t);

    const cueOutput = this.ctx.createGain();
    cueOutput.gain.setValueAtTime(1, t);
    cueOutput.connect(this.masterGain);
    this.activeCueBuses.add(cueOutput);

    const masterLowpass = this.ctx.createBiquadFilter();
    masterLowpass.type = 'lowpass';
    masterLowpass.frequency.setValueAtTime(preset.masterLowpassHz, t);
    masterLowpass.Q.setValueAtTime(0.7, t);

    const dryGain = this.ctx.createGain();
    dryGain.gain.setValueAtTime(1, t);

    cueBus.connect(masterLowpass);
    masterLowpass.connect(dryGain);
    dryGain.connect(cueOutput);

    let convolver: ConvolverNode | null = null;
    let wetGain: GainNode | null = null;
    if (preset.reverb) {
      convolver = this.getCueReverb(preset.reverb.duration, preset.reverb.decay);
      if (convolver) {
        wetGain = this.ctx.createGain();
        const mix = Math.max(0, Math.min(1, preset.reverb.mix * this.cueReverbMix));
        wetGain.gain.setValueAtTime(mix, t);
        masterLowpass.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(cueOutput);
      }
    }

    const cleanup = () => {
      this.activeCueBuses.delete(cueOutput);
      try {
        cueBus.disconnect();
        cueOutput.disconnect();
        masterLowpass.disconnect();
        dryGain.disconnect();
        convolver?.disconnect();
        wetGain?.disconnect();
      } catch {
        // ignore
      }
    };

    const nodesToStop: Array<{ stopAt: number; node: AudioScheduledSourceNode }> = [];

    if (preset.noise) {
      const buffer = this.getCueNoiseBuffer();
      if (buffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const gain = this.ctx.createGain();
        const n = preset.noise;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.Q.setValueAtTime(n.q, t);
        lowpass.frequency.setValueAtTime(n.lowpassStart, t);
        lowpass.frequency.linearRampToValueAtTime(n.lowpassEnd, endTime);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.Q.setValueAtTime(0.7, t);
        highpass.frequency.setValueAtTime(n.highpass, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(
          n.gain * this.cueVolume * this.cueNoiseScale * gainScale,
          t + n.attack,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.attack + n.release);

        src.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(cueBus);

        src.start(t);
        nodesToStop.push({ node: src, stopAt: endTime + 0.05 });
      }
    }

    if (preset.tone) {
      const tone = preset.tone;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = tone.oscType;
      osc.detune.setValueAtTime(tone.detune + pitchSemitones * 100, t);
      osc.frequency.setValueAtTime(tone.freqStart, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, tone.freqEnd), endTime);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(
        tone.gain * this.cueVolume * this.cueToneScale * gainScale,
        t + tone.attack,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.attack + tone.release);

      osc.connect(gain);
      gain.connect(cueBus);

      osc.start(t);
      nodesToStop.push({ node: osc, stopAt: endTime + 0.05 });
    }

    nodesToStop.forEach(({ node, stopAt }) => {
      try {
        node.stop(stopAt);
        node.addEventListener('ended', cleanup, { once: true });
      } catch {
        // ignore
      }
    });
  }

  public async startBinaural(beatHz: number = 10) {
    this.stopBinaural();
    const ready = await this.ensureContextReady();
    if (!ready || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const baseFreq = 200;

    const makeChannel = (panValue: number, detune: number) => {
      const osc = this.ctx!.createOscillator();
      const pan = this.ctx!.createStereoPanner();
      const gain = this.ctx!.createGain();

      osc.frequency.value = baseFreq + detune;
      osc.type = 'sine';
      pan.pan.value = panValue;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.binauralTargetGain(), t + 2);

      osc.connect(gain);
      gain.connect(pan);
      pan.connect(this.masterGain!);
      osc.start(t);

      this.binauralNodes.push({ osc, pan, gain });
    };

    makeChannel(-1, 0);
    makeChannel(1, beatHz);
  }

  public stopBinaural() {
    if (!this.ctx) {
      this.binauralNodes = [];
      return;
    }
    const t = this.ctx.currentTime;
    this.binauralNodes.forEach((node) => {
      node.gain.gain.cancelScheduledValues(t);
      node.gain.gain.setValueAtTime(node.gain.gain.value, t);
      node.gain.gain.linearRampToValueAtTime(0, t + 1);
      node.osc.stop(t + 1.1);
    });
    this.binauralNodes = [];
  }

  public async startDrone(colorHex: string) {
    this.stopDrone();
    const ready = await this.ensureContextReady();
    if (!ready || !this.ctx || !this.masterGain) return;

    this.themeColor = colorHex || this.themeColor;
    const profile = this.getCueProfile(this.themeColor);
    const baseFreq = this.getDroneRootFrequency(colorHex);
    const partials = [1, 1.5, 2, 0.99];
    const lfoRates: number[] = [];

    // Shared drone bus: all partials → one lowpass → master. Removes the
    // triangle-harmonic / panner-zipper HF that read as "static" while leaving
    // the low warm pad intact.
    const droneLowpass = this.ctx.createBiquadFilter();
    droneLowpass.type = 'lowpass';
    droneLowpass.frequency.value = DRONE_LOWPASS_HZ;
    droneLowpass.Q.value = DRONE_LOWPASS_Q;
    droneLowpass.connect(this.masterGain);
    if (this.droneAnalyser) droneLowpass.connect(this.droneAnalyser);
    this.droneLowpass = droneLowpass;

    // HRTF spatializer where the platform implements PannerNode; StereoPanner
    // orbit approximation elsewhere (react-native-audio-api, for now).
    const supportsHrtf = typeof (this.ctx as any).createPanner === 'function';

    partials.forEach((ratio, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      let spatial: (typeof this.droneNodes)[number]['spatial'];
      if (supportsHrtf) {
        const panner = this.ctx!.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 2;
        spatial = { kind: 'hrtf', panner };
      } else {
        spatial = { kind: 'stereo', panner: this.ctx!.createStereoPanner() };
      }
      osc.frequency.value = baseFreq * ratio;
      osc.type = profile.oscType === 'triangle' ? 'triangle' : 'sine';
      osc.detune.value = profile.detune * (index + 0.5);

      const t = this.ctx!.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.droneTargetGain(), t + 2);

      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      const lfoRate = 0.08 + Math.random() * 0.12;
      lfo.frequency.value = lfoRate;
      lfoRates.push(lfoRate);
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(t);
      this.droneLfoNodes.push(lfo);

      osc.connect(gain);
      gain.connect(spatial.panner);
      spatial.panner.connect(droneLowpass);

      osc.start(t);
      this.droneNodes.push({ osc, spatial, gain });
    });

    // Capture session-arc baseline.
    this.droneArc = {
      startedAt: this.ctx.currentTime,
      rootHz: baseFreq,
      lfoRates,
      spatialSpeed: 0.0005
    };
  }

  public stopDrone() {
    if (!this.ctx) {
      this.droneNodes = [];
      this.droneLfoNodes = [];
      this.droneLowpass = null;
      this.droneArc = null;
      this.spatialSpeedOverride = null;
      return;
    }
    const t = this.ctx.currentTime;
    this.droneNodes.forEach((node) => {
      // Cancel any session-arc frequency ramps so the gain ramp lands cleanly.
      node.osc.frequency.cancelScheduledValues(t);
      node.gain.gain.cancelScheduledValues(t);
      node.gain.gain.setValueAtTime(node.gain.gain.value, t);
      node.gain.gain.linearRampToValueAtTime(0, t + 1);
      node.osc.stop(t + 1.1);
    });
    this.droneLfoNodes.forEach((lfo) => {
      try {
        lfo.frequency.cancelScheduledValues(t);
        lfo.stop(t + 1.1);
      } catch {
        // already stopped
      }
    });
    // Drop the shared lowpass reference; its feeding oscillators stop at t+1.1
    // and auto-disconnect, so the orphaned filter becomes GC-eligible.
    this.droneLowpass = null;
    this.droneNodes = [];
    this.droneLfoNodes = [];
    this.droneArc = null;
    this.spatialSpeedOverride = null;
  }

  /**
   * Sub-bass body-resonance layer. Single sine an octave below the drone
   * root (rootHz/2), routed omnidirectionally — no HRTF panning. Adds
   * chest-resonance on headphones / decent speakers; harmless on phone
   * speakers that can't reproduce ~65 Hz. Slow LFO (0.05 Hz) so the
   * layer breathes too.
   *
   * Gain is intentionally low — sits under the drone, not next to it.
   */
  public async startSubBass(colorHex?: string) {
    this.stopSubBass();
    const ready = await this.ensureContextReady();
    if (!ready || !this.ctx || !this.masterGain) return;

    const root = this.getDroneRootFrequency(colorHex || this.themeColor);
    this.subBassRootHz = root;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = Math.max(40, (root / 2) * this.subBassFreqMultiplier);

    const t = this.ctx.currentTime;
    // Conservative gain — small phone speakers can't reproduce ~65 Hz and
    // even on headphones the sub layer is meant to FEEL, not be heard. 0.18
    // was muddy on the homepage stack (drone + binaural + cue stack on Box).
    const targetGain = this.subBassTargetGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(targetGain, t + 3);

    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = targetGain * 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    gain.connect(this.masterGain);
    if (this.subBassAnalyser) gain.connect(this.subBassAnalyser);
    osc.start(t);
    lfo.start(t);

    this.subBassNode = { osc, gain, lfo };
  }

  /**
   * Phase-length sonic envelope — a continuous low-amplitude tonal layer
   * whose gain + filter cutoff ride breath progress 0→1. Currently gated
   * behind eyes-closed mode in Resonance.tsx for measurement isolation.
   *
   * Inhale: gain swells up, filter opens. Exhale: gain decays, filter
   * closes. Hold: steady at current value. Layered under (not replacing)
   * the existing transition cue.
   */
  public async startPhaseEnvelope(colorHex?: string) {
    this.stopPhaseEnvelope();
    const ready = await this.ensureContextReady();
    if (!ready || !this.ctx || !this.masterGain) return;

    const root = this.getDroneRootFrequency(colorHex || this.themeColor);
    this.phaseEnvelopeRootHz = root;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // 3× root (perfect 12th) sits outside the drone's [1, 1.5, 2, 0.99] partials,
    // so no beating with the 2× partial — important because session arc drifts
    // the drone root but the envelope frequency is captured at startPhaseEnvelope.
    osc.frequency.value = root * 3 * this.phaseEnvelopeFreqMultiplier;
    filter.type = 'lowpass';
    filter.Q.value = 0.9;
    filter.frequency.value = 800;

    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    if (this.envelopeAnalyser) gain.connect(this.envelopeAnalyser);
    osc.start(t);

    this.phaseEnvelopeNode = { osc, gain, filter };
  }

  public stopPhaseEnvelope() {
    if (!this.ctx || !this.phaseEnvelopeNode) {
      this.phaseEnvelopeNode = null;
      return;
    }
    const t = this.ctx.currentTime;
    const { osc, gain } = this.phaseEnvelopeNode;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);
    osc.stop(t + 0.7);
    this.phaseEnvelopeNode = null;
  }

  /**
   * Drive the phase-length envelope from the rAF loop with the current
   * breath phase + progress (0..1). No-op when envelope isn't running.
   */
  public updatePhaseEnvelope(phase: 'inhale' | 'exhale' | 'hold', progress: number) {
    if (!this.ctx || !this.phaseEnvelopeNode) return;
    const { gain, filter } = this.phaseEnvelopeNode;
    const t = this.ctx.currentTime;
    const p = Math.max(0, Math.min(1, progress));

    const PEAK_GAIN = this.phaseEnvelopePeakGain();
    const FILTER_BASE = 500;
    const FILTER_PEAK = 2200;

    let targetGain: number;
    let targetFilter: number;
    if (phase === 'inhale') {
      // Smooth ease-in via sin curve so the swell feels organic, not linear.
      const eased = Math.sin(p * Math.PI / 2);
      targetGain = PEAK_GAIN * eased;
      targetFilter = FILTER_BASE + (FILTER_PEAK - FILTER_BASE) * eased;
    } else if (phase === 'exhale') {
      const eased = Math.cos(p * Math.PI / 2);
      targetGain = PEAK_GAIN * eased;
      targetFilter = FILTER_BASE + (FILTER_PEAK - FILTER_BASE) * eased;
    } else {
      // Hold: keep tracking the previous target, don't ramp anything new.
      return;
    }

    this.glideParam(gain.gain, targetGain, 0.05);
    this.glideParam(filter.frequency, targetFilter, 0.08);
  }

  public stopSubBass() {
    if (!this.ctx || !this.subBassNode) {
      this.subBassNode = null;
      return;
    }
    const t = this.ctx.currentTime;
    const { osc, gain, lfo } = this.subBassNode;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.5);
    osc.stop(t + 1.6);
    lfo.stop(t + 1.6);
    this.subBassNode = null;
  }

  public async startPinkNoise() {
    this.stopPinkNoise();
    const ready = await this.ensureContextReady();
    if (!ready || !this.ctx || !this.masterGain) return;

    const buffer = this.generatePinkNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Breath-coupled low-pass filter — driven by updatePinkNoisePhase from
    // the rAF loop. Cutoff opens on inhale (sounds like ocean swelling
    // toward the shore) and closes on exhale (settling away). The cue layer
    // already does this per-transition; this couples the BED to the breath
    // so the whole texture breathes with the user.
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = this.noiseFilterQ;
    filter.frequency.value = this.noiseFilterBaseHz;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.pinkNoiseTargetGain(), t + 2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    if (this.pinkNoiseAnalyser) gain.connect(this.pinkNoiseAnalyser);
    source.start(t);

    this.noiseNode = { source, gain, filter };
  }

  /**
   * Modulate the pink-noise filter cutoff with breath progress (0..1) per phase.
   * progress=0 → cutoff at NOISE_FILTER_BASE_HZ; progress=1 → cutoff at
   * NOISE_FILTER_PEAK_HZ for inhale, swept back down for exhale. Holds keep
   * cutoff steady at the current position.
   *
   * Called from BOTH the normal animate loop and the Wim Hof animateProtocol
   * loop so all session types breathe with the user.
   */
  public updatePinkNoisePhase(phase: 'inhale' | 'exhale' | 'hold', progress: number) {
    if (!this.ctx || !this.noiseNode) return;
    const t = this.ctx.currentTime;
    const p = Math.max(0, Math.min(1, progress));
    let target: number;
    const base = this.noiseFilterBaseHz;
    const peak = this.noiseFilterPeakHz;
    if (phase === 'inhale') {
      target = base + (peak - base) * p;
    } else if (phase === 'exhale') {
      target = peak - (peak - base) * p;
    } else {
      // Hold: hold the current target steady — no ramp.
      return;
    }
    // Short time constant for smooth tracking without zipper noise.
    this.glideParam(this.noiseNode.filter.frequency, target, 0.08);
  }

  public stopPinkNoise() {
    if (!this.ctx || !this.noiseNode) {
      this.noiseNode = null;
      return;
    }
    const t = this.ctx.currentTime;
    this.noiseNode.gain.gain.cancelScheduledValues(t);
    this.noiseNode.gain.gain.setValueAtTime(this.noiseNode.gain.gain.value, t);
    this.noiseNode.gain.gain.linearRampToValueAtTime(0, t + 1);
    this.noiseNode.source.stop(t + 1.1);
    this.noiseNode = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Debug-panel surface: live setters, meter readings, tuning snapshot.
  // Only the ?debug=audio panel calls these — keep them inert when unused.
  // ─────────────────────────────────────────────────────────────────────────

  public setCompressorParams(params: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>) {
    if (!this.masterCompressor) return;
    if (params.threshold !== undefined) this.masterCompressor.threshold.value = params.threshold;
    if (params.knee !== undefined) this.masterCompressor.knee.value = params.knee;
    if (params.ratio !== undefined) this.masterCompressor.ratio.value = params.ratio;
    if (params.attack !== undefined) this.masterCompressor.attack.value = params.attack;
    if (params.release !== undefined) this.masterCompressor.release.value = params.release;
  }

  public setLimiterParams(params: Partial<{ threshold: number; knee: number; ratio: number; attack: number; release: number }>) {
    if (!this.masterLimiter) return;
    if (params.threshold !== undefined) this.masterLimiter.threshold.value = params.threshold;
    if (params.knee !== undefined) this.masterLimiter.knee.value = params.knee;
    if (params.ratio !== undefined) this.masterLimiter.ratio.value = params.ratio;
    if (params.attack !== undefined) this.masterLimiter.attack.value = params.attack;
    if (params.release !== undefined) this.masterLimiter.release.value = params.release;
  }

  public setMasterTrim(linearGain: number) {
    if (!this.masterTrim) return;
    this.masterTrim.gain.value = Math.max(0, linearGain);
  }

  public setDroneGain(scale: number) {
    this.droneScale = Math.max(0, scale);
    if (!this.ctx || this.droneNodes.length === 0) return;
    const target = this.droneTargetGain();
    const t = this.ctx.currentTime;
    this.droneNodes.forEach((node) => node.gain.gain.setTargetAtTime(target, t, 0.1));
  }

  public setSubBassGain(scale: number) {
    this.subBassScale = Math.max(0, scale);
    if (!this.ctx || !this.subBassNode) return;
    this.subBassNode.gain.gain.setTargetAtTime(this.subBassTargetGain(), this.ctx.currentTime, 0.1);
  }

  public setSubBassFreqMultiplier(x: number) {
    this.subBassFreqMultiplier = Math.max(0.1, x);
    if (!this.ctx || !this.subBassNode || this.subBassRootHz === 0) return;
    const target = Math.max(40, (this.subBassRootHz / 2) * this.subBassFreqMultiplier);
    this.subBassNode.osc.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  public setPinkNoiseGain(scale: number) {
    this.pinkNoiseScale = Math.max(0, scale);
    if (!this.ctx || !this.noiseNode) return;
    this.noiseNode.gain.gain.setTargetAtTime(this.pinkNoiseTargetGain(), this.ctx.currentTime, 0.1);
  }

  public setPinkNoiseFilterRange(range: Partial<{ baseHz: number; peakHz: number; q: number }>) {
    if (range.baseHz !== undefined) this.noiseFilterBaseHz = Math.max(20, range.baseHz);
    if (range.peakHz !== undefined) this.noiseFilterPeakHz = Math.max(this.noiseFilterBaseHz, range.peakHz);
    if (range.q !== undefined) this.noiseFilterQ = Math.max(0.01, range.q);
    if (this.noiseNode) {
      this.noiseNode.filter.Q.value = this.noiseFilterQ;
    }
  }

  public setBinauralGain(scale: number) {
    this.binauralScale = Math.max(0, scale);
    if (!this.ctx) return;
    const target = this.binauralTargetGain();
    const t = this.ctx.currentTime;
    this.binauralNodes.forEach((node) => node.gain.gain.setTargetAtTime(target, t, 0.1));
  }

  public setPhaseEnvelopeGain(scale: number) {
    this.phaseEnvelopeScale = Math.max(0, scale);
    // Peak gain is sampled per-tick from phaseEnvelopePeakGain(); next
    // updatePhaseEnvelope call honors the new scale without further wiring.
  }

  public setPhaseEnvelopeFreqMultiplier(x: number) {
    this.phaseEnvelopeFreqMultiplier = Math.max(0.1, x);
    if (!this.ctx || !this.phaseEnvelopeNode || this.phaseEnvelopeRootHz === 0) return;
    const target = this.phaseEnvelopeRootHz * 3 * this.phaseEnvelopeFreqMultiplier;
    this.phaseEnvelopeNode.osc.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  public setCueToneScale(x: number) {
    this.cueToneScale = Math.max(0, x);
  }

  public setCueNoiseScale(x: number) {
    this.cueNoiseScale = Math.max(0, x);
  }

  public setCueReverbMix(x: number) {
    this.cueReverbMix = Math.max(0, x);
  }

  public setArcWindowSeconds(s: number) {
    this.arcWindowSeconds = Math.max(1, s);
  }

  public setArcRootDriftFactor(x: number) {
    this.arcRootDriftFactor = Math.max(0.1, Math.min(1, x));
  }

  public setArcLfoSlowdownFactor(x: number) {
    this.arcLfoSlowdownFactor = Math.max(0, Math.min(1, x));
  }

  public setArcOrbitSlowdownFactor(x: number) {
    this.arcOrbitSlowdownFactor = Math.max(0, Math.min(1, x));
  }

  public getTuning(): TuningSnapshot {
    return {
      compressor: {
        threshold: this.masterCompressor?.threshold.value ?? -14,
        knee: this.masterCompressor?.knee.value ?? 24,
        ratio: this.masterCompressor?.ratio.value ?? 3,
        attack: this.masterCompressor?.attack.value ?? 0.02,
        release: this.masterCompressor?.release.value ?? 0.3,
      },
      limiter: {
        threshold: this.masterLimiter?.threshold.value ?? -3,
        knee: this.masterLimiter?.knee.value ?? 0,
        ratio: this.masterLimiter?.ratio.value ?? 20,
        attack: this.masterLimiter?.attack.value ?? 0.001,
        release: this.masterLimiter?.release.value ?? 0.05,
      },
      masterTrim: this.masterTrim?.gain.value ?? 0.71,
      droneScale: this.droneScale,
      subBassScale: this.subBassScale,
      subBassFreqMultiplier: this.subBassFreqMultiplier,
      pinkNoiseScale: this.pinkNoiseScale,
      pinkNoiseFilter: {
        baseHz: this.noiseFilterBaseHz,
        peakHz: this.noiseFilterPeakHz,
        q: this.noiseFilterQ,
      },
      binauralScale: this.binauralScale,
      phaseEnvelopeScale: this.phaseEnvelopeScale,
      phaseEnvelopeFreqMultiplier: this.phaseEnvelopeFreqMultiplier,
      cueToneScale: this.cueToneScale,
      cueNoiseScale: this.cueNoiseScale,
      cueReverbMix: this.cueReverbMix,
      arcWindowSeconds: this.arcWindowSeconds,
      arcRootDriftFactor: this.arcRootDriftFactor,
      arcLfoSlowdownFactor: this.arcLfoSlowdownFactor,
      arcOrbitSlowdownFactor: this.arcOrbitSlowdownFactor,
    };
  }

  public getMeterValues(): MeterValues {
    const reduction = (node: DynamicsCompressorNode | null): number => {
      if (!node) return 0;
      const r = (node as unknown as { reduction: number | AudioParam }).reduction;
      return typeof r === 'number' ? r : (r?.value ?? 0);
    };
    return {
      preCompressor: AudioService.computeLevels(this.preCompAnalyser),
      postLimiter: AudioService.computeLevels(this.postLimitAnalyser),
      compressorReductionDb: reduction(this.masterCompressor),
      limiterReductionDb: reduction(this.masterLimiter),
      layers: {
        drone: AudioService.computeLevels(this.droneAnalyser),
        subBass: AudioService.computeLevels(this.subBassAnalyser),
        pinkNoise: AudioService.computeLevels(this.pinkNoiseAnalyser),
        envelope: AudioService.computeLevels(this.envelopeAnalyser),
      },
    };
  }

  private static computeLevels(analyser: AnalyserNode | null): MeterReading {
    if (!analyser) return { peakDb: -Infinity, rmsDb: -Infinity };
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let peak = 0;
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i]);
      if (v > peak) peak = v;
      sumSq += buf[i] * buf[i];
    }
    const rms = Math.sqrt(sumSq / buf.length);
    return {
      peakDb: 20 * Math.log10(Math.max(peak, 1e-6)),
      rmsDb: 20 * Math.log10(Math.max(rms, 1e-6)),
    };
  }

  public getDebugState() {
    return {
      ctx: {
        state: this.ctx?.state,
        sampleRate: this.ctx?.sampleRate,
        currentTime: this.ctx?.currentTime
      },
      nodes: {
        drone: this.droneNodes.length,
        binaural: this.binauralNodes.length,
        noise: Boolean(this.noiseNode)
      },
      gain: {
        master: this.masterGain?.gain.value,
        cueVolume: this.cueVolume,
        musicVolume: this.musicVolume,
        muted: this.isMuted
      },
      themeColor: this.themeColor
    };
  }

  private generatePinkNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = 4 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  private getCuePreset(mode: ModeName, type: CueType, colorHex: string): CuePreset {
    const metrics = this.getColorMetrics(colorHex);
    const bright = metrics.luminance > 0.55;

    if (mode === ModeName.Box) {
      if (type === 'inhale') {
        return {
          duration: 0.28,
          masterLowpassHz: 2800,
          tone: {
            oscType: 'sine',
            freqStart: 520,
            freqEnd: 660,
            detune: -8,
            attack: 0.02,
            release: 0.18,
            gain: 0.8
          },
          noise: {
            gain: 0.18,
            attack: 0.02,
            release: 0.22,
            lowpassStart: 900,
            lowpassEnd: 2200,
            highpass: 140,
            q: 0.8
          },
          reverb: { mix: 0.08, duration: 0.35, decay: 3.2 }
        };
      }

      if (type === 'exhale') {
        return {
          duration: 0.3,
          masterLowpassHz: 2400,
          tone: {
            oscType: 'sine',
            freqStart: 520,
            freqEnd: 420,
            detune: -10,
            attack: 0.02,
            release: 0.22,
            gain: 0.75
          },
          noise: {
            gain: 0.16,
            attack: 0.02,
            release: 0.26,
            lowpassStart: 2000,
            lowpassEnd: 850,
            highpass: 140,
            q: 0.9
          },
          reverb: { mix: 0.08, duration: 0.35, decay: 3.2 }
        };
      }

      return {
        duration: 0.24,
        masterLowpassHz: 2200,
        tone: {
          oscType: 'triangle',
          freqStart: 660,
          freqEnd: 660,
          detune: -5,
          attack: 0.01,
          release: 0.16,
          gain: 0.55
        },
        reverb: { mix: 0.05, duration: 0.25, decay: 3.8 }
      };
    }

    if (mode === ModeName.Relax) {
      if (type === 'inhale') {
        return {
          duration: 0.38,
          masterLowpassHz: 1800,
          tone: {
            oscType: 'triangle',
            freqStart: 220,
            freqEnd: 247,
            detune: 9,
            attack: 0.05,
            release: 0.32,
            gain: 0.75
          },
          noise: {
            gain: 0.22,
            attack: 0.04,
            release: 0.34,
            lowpassStart: 650,
            lowpassEnd: bright ? 1600 : 1300,
            highpass: 120,
            q: 0.7
          },
          reverb: { mix: 0.14, duration: 0.6, decay: 2.6 }
        };
      }

      if (type === 'exhale') {
        return {
          duration: 0.42,
          masterLowpassHz: 1700,
          tone: {
            oscType: 'triangle',
            freqStart: 220,
            freqEnd: 196,
            detune: 7,
            attack: 0.05,
            release: 0.36,
            gain: 0.8
          },
          noise: {
            gain: 0.24,
            attack: 0.04,
            release: 0.38,
            lowpassStart: bright ? 1700 : 1400,
            lowpassEnd: 520,
            highpass: 120,
            q: 0.7
          },
          reverb: { mix: 0.16, duration: 0.7, decay: 2.5 }
        };
      }

      return {
        duration: 0.26,
        masterLowpassHz: 1600,
        tone: {
          oscType: 'sine',
          freqStart: 330,
          freqEnd: 330,
          detune: 4,
          attack: 0.03,
          release: 0.22,
          gain: 0.5
        },
        reverb: { mix: 0.12, duration: 0.55, decay: 2.8 }
      };
    }

    if (mode === ModeName.Coherent) {
      if (type === 'inhale') {
        return {
          duration: 0.34,
          masterLowpassHz: 2600,
          tone: {
            oscType: 'sine',
            freqStart: 294,
            freqEnd: 330,
            detune: -4,
            attack: 0.04,
            release: 0.26,
            gain: 0.7
          },
          noise: {
            gain: 0.25,
            attack: 0.03,
            release: 0.28,
            lowpassStart: 700,
            lowpassEnd: bright ? 2400 : 2000,
            highpass: 130,
            q: 0.75
          },
          reverb: { mix: 0.12, duration: 0.5, decay: 2.9 }
        };
      }

      if (type === 'exhale') {
        return {
          duration: 0.36,
          masterLowpassHz: 2400,
          tone: {
            oscType: 'sine',
            freqStart: 294,
            freqEnd: 262,
            detune: -6,
            attack: 0.04,
            release: 0.3,
            gain: 0.75
          },
          noise: {
            gain: 0.26,
            attack: 0.03,
            release: 0.32,
            lowpassStart: bright ? 2200 : 1800,
            lowpassEnd: 650,
            highpass: 130,
            q: 0.8
          },
          reverb: { mix: 0.13, duration: 0.55, decay: 2.8 }
        };
      }

      return {
        duration: 0.24,
        masterLowpassHz: 2300,
        tone: {
          oscType: 'triangle',
          freqStart: 440,
          freqEnd: 440,
          detune: -2,
          attack: 0.02,
          release: 0.18,
          gain: 0.45
        },
        reverb: { mix: 0.08, duration: 0.4, decay: 3.1 }
      };
    }

    if (type === 'inhale') {
      return {
        duration: 0.24,
        masterLowpassHz: 2900,
        tone: {
          oscType: 'sine',
          freqStart: 540,
          freqEnd: 740,
          detune: 0,
          attack: 0.015,
          release: 0.18,
          gain: 0.85
        },
        noise: {
          gain: 0.24,
          attack: 0.015,
          release: 0.2,
          lowpassStart: 800,
          lowpassEnd: 2600,
          highpass: 160,
          q: 0.75
        },
        reverb: { mix: 0.1, duration: 0.45, decay: 2.9 }
      };
    }

    if (type === 'exhale') {
      return {
        duration: 0.3,
        masterLowpassHz: 2500,
        tone: {
          oscType: 'sine',
          freqStart: 480,
          freqEnd: 360,
          detune: 0,
          attack: 0.02,
          release: 0.24,
          gain: 0.85
        },
        noise: {
          gain: 0.26,
          attack: 0.02,
          release: 0.28,
          lowpassStart: 2300,
          lowpassEnd: 700,
          highpass: 160,
          q: 0.8
        },
        reverb: { mix: 0.1, duration: 0.5, decay: 2.8 }
      };
    }

    return {
      duration: 0.22,
      masterLowpassHz: 2200,
      tone: {
        oscType: 'triangle',
        freqStart: 620,
        freqEnd: 620,
        detune: 0,
        attack: 0.01,
        release: 0.16,
        gain: 0.55
      },
      reverb: { mix: 0.07, duration: 0.35, decay: 3.1 }
    };
  }

  private getCueNoiseBuffer() {
    if (!this.ctx) return null;
    if (this.cueNoiseBuffer) return this.cueNoiseBuffer;

    const durationSeconds = 1;
    const length = Math.floor(this.ctx.sampleRate * durationSeconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    this.cueNoiseBuffer = buffer;
    return buffer;
  }

  private getCueReverb(duration: number, decay: number) {
    if (!this.ctx) return null;
    // Key by (duration, decay) so each per-mode preset gets its intended IR
    // instead of the first call's IR being reused for the rest of the session.
    const safeDuration = Math.max(0.08, duration);
    const safeDecay = Math.max(0.5, decay);
    const key = `${safeDuration.toFixed(2)}:${safeDecay.toFixed(2)}`;
    const cached = this.cueReverbCache.get(key);
    if (cached) return cached;

    const length = Math.max(1, Math.floor(this.ctx.sampleRate * safeDuration));
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const x = 1 - i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(x, safeDecay);
      }
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = buffer;
    this.cueReverbCache.set(key, convolver);
    return convolver;
  }

  private getDroneRootFrequency(colorHex: string) {
    // Per-mode-color root-note table. Each root is chosen to be consonant
    // with that mode's fixed cue preset pitches:
    //
    //   Box cues 520–660 Hz (~C5–E5)        → C3 root (C major)
    //   Relax cues 196–247 Hz (~G3–B3)      → D3 root (D major / G mixolydian)
    //   Coherent cues 262–330 Hz (~C4–E4)   → E3 root (E minor / C major)
    //   Sigh / default cues 360–740 Hz      → F2 root (broad, low foundation)
    //
    // Falls back to A2 for unknown colors — A is a flexible tonal center
    // that pairs with any of the cue presets without obvious dissonance.
    //
    // Note: keeping this small + curated rather than hue-derived because the
    // cue layer uses fixed Hz, not scale degrees — a wandering hue-mapped
    // root creates tritones against the cues. Until cues become root-relative
    // (follow-up), the drone root must stay in a known-consonant set.
    const mapping: Record<string, number> = {
      // Curated mode/theme colors
      '#e11d48': 130.81, // rose          → C3 (Box)
      '#4f46e5': 146.83, // indigo        → D3 (Relax)
      '#059669': 164.81, // emerald       → E3 (Coherent)
      '#0ea5e9': 87.31,  // sky           → F2 (Sigh)
      '#f97316': 130.81, // orange        → C3 (Wim Hof — root-consonant w/ default cues)
      '#10b981': 164.81, // emerald-2     → E3 (PursedLip)
      '#8b5cf6': 146.83, // violet        → D3 (NadiShodhana)
      '#0891b2': 130.81, // cyan          → C3 (Ujjayi)
      '#f59e0b': 130.81, // amber         → C3 (Belly)
      '#38bdf8': 146.83, // sky-2         → D3 (Buteyko)
      '#dc2626': 130.81, // deep red      → C3 (Tummo)
      '#ea580c': 130.81, // hot orange    → C3 (BreathOfFire + evening time-of-day)
      '#0d9488': 164.81, // teal          → E3 (morning time-of-day)
    };
    const key = colorHex?.toLowerCase();
    return mapping[key] ?? 110; // A2 — neutral, pairs with all cue presets
  }

  private getCueProfile(colorHex: string): CueProfile {
    const metrics = this.getColorMetrics(colorHex);
    const warm = metrics.hue < 80 || metrics.hue > 300;
    const airy = metrics.luminance > 0.55;

    return {
      oscType: warm ? 'triangle' : 'sine',
      attack: airy ? 0.05 : 0.08,
      decay: airy ? 0.4 : 0.8,
      sustain: airy ? 0.65 : 0.45,
      release: warm ? 2.6 : 1.6,
      pitchShift: airy ? 1.03 : 0.96,
      detune: warm ? 12 : -6,
      harmonics: warm ? [0.55, 0.3, 0.15, 0.08] : [0.6, 0.25, 0.12]
    };
  }

  private getColorMetrics(colorHex: string) {
    const { r, g, b } = this.hexToRgb(colorHex);
    const { h, s } = this.rgbToHsl(r, g, b);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return { hue: h, saturation: s, luminance: Math.min(Math.max(luminance, 0), 1) };
  }

  private hexToRgb(hex: string) {
    let sanitized = hex.replace('#', '');
    if (sanitized.length === 3) {
      sanitized = sanitized.split('').map((c) => c + c).join('');
    }
    const int = parseInt(sanitized, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  }

  private rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }
}
