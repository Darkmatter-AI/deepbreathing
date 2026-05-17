/**
 * Generative audio engine for Resonance.
 * - Drone pads move through an 8D panner.
 * - Pink noise beds emulate rain.
 * - Phase cues shift timbre based on the active color theme.
 * - Binaural beats accept adaptive entrainment frequencies.
 */
 import { ModeName } from '../types';

type CueType = 'inhale' | 'exhale' | 'hold';

// Pink-noise bed breath-coupled filter cutoff range. Tuned by ear: opens
// enough to feel like the texture "brightens" on inhale without becoming
// hissy, closes far enough on exhale to feel like the wave receded.
const NOISE_FILTER_BASE_HZ = 480;
const NOISE_FILTER_PEAK_HZ = 2400;

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

export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterLimiter: GainNode | null = null;
  private debug = false;
  private mediaUnlocking: Promise<void> | null = null;
  private mediaUnlocked = false;

  private droneNodes: { osc: OscillatorNode; panner: PannerNode; gain: GainNode }[] = [];
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

   private breathingMode: ModeName = ModeName.Box;
   private cueNoiseBuffer: AudioBuffer | null = null;
   private cueReverbCache: Map<string, ConvolverNode> = new Map();

  private isMuted = false;
  private cueVolume = 0.32;
  private musicVolume = 0.3;
  private themeColor = '#4f46e5';

  constructor(options: { debug?: boolean } = {}) {
    this.debug = Boolean(options.debug);
  }

  private log(...args: unknown[]) {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[AudioService]', ...args);
    }
  }

  private async unlockWithMediaElement() {
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
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      try {
        this.ctx = new AudioCtor({ latencyHint: 'playback' });
      } catch {
        this.ctx = new AudioCtor();
      }
      this.buildOutputChain();
      if (this.debug && this.ctx) {
        this.ctx.onstatechange = () => {
          this.log('statechange', this.ctx?.state);
        };
        this.log('AudioContext created', { state: this.ctx.state });
      }
    }
  }

  /**
   * Build the output chain: masterGain → compressor → limiter → destination.
   * Compressor tames the cumulative peaks from stacked layers (drone + binaural
   * + pink noise + cue tone + cue noise + reverb tail can clip on loud presets).
   * Limiter is a fixed gain trim that keeps true-peak below 0 dBFS.
   *
   * Called from initContext AND from ensureContextReady's recreate branch so the
   * chain survives Safari's "interrupted → closed" lifecycle.
   */
  private buildOutputChain() {
    if (!this.ctx) return;
    this.masterGain = this.ctx.createGain();
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -6;
    this.masterCompressor.knee.value = 30;
    this.masterCompressor.ratio.value = 4;
    this.masterCompressor.attack.value = 0.01;
    this.masterCompressor.release.value = 0.25;
    this.masterLimiter = this.ctx.createGain();
    // ~-1 dBFS trim — quiet enough to keep digital headroom after the compressor.
    this.masterLimiter.gain.value = 0.89;

    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);
  }

  /**
   * Ensure the AudioContext is present and running.
   * Handles Safari's "interrupted" state and recreates the context if it was closed.
   */
  private async ensureContextReady() {
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
      this.cueNoiseBuffer = null;
      this.cueReverbCache.clear();
      this.buildOutputChain();
    }

    this.log('ensureContextReady:end', { state: this.ctx?.state });
    return this.ctx?.state === 'running';
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
   */
  public updateSpatial(time: number) {
    if (!this.ctx || this.droneNodes.length === 0) return;
    const speed = 0.0005;

    this.droneNodes.forEach((node, index) => {
      const offset = index * (Math.PI / 2);
      const px = Math.cos(time * speed + offset) * 2;
      const pz = Math.sin(time * speed + offset) * 2;
      node.panner.positionX.value = px;
      node.panner.positionZ.value = pz;
      node.panner.positionY.value = 0;
    });
  }

  public setVolume(cueVol: number, musicVol: number) {
    this.cueVolume = cueVol;
    this.musicVolume = musicVol;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.droneNodes.forEach((node) =>
      node.gain.gain.setTargetAtTime(this.isMuted ? 0 : this.musicVolume * 0.1, now, 0.5)
    );
    this.binauralNodes.forEach((node) =>
      node.gain.gain.setTargetAtTime(this.isMuted ? 0 : 0.05, now, 0.5)
    );
    if (this.noiseNode) {
      this.noiseNode.gain.gain.setTargetAtTime(this.isMuted ? 0 : this.musicVolume * 0.15, now, 0.5);
    }
    if (this.subBassNode) {
      this.subBassNode.gain.gain.setTargetAtTime(this.isMuted ? 0 : this.musicVolume * 0.18, now, 0.5);
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.1);
    }
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
  public playCue(type: CueType, colorHex?: string) {
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

    const cueBus = this.ctx.createGain();
    cueBus.gain.setValueAtTime(1, t);

    const masterLowpass = this.ctx.createBiquadFilter();
    masterLowpass.type = 'lowpass';
    masterLowpass.frequency.setValueAtTime(preset.masterLowpassHz, t);
    masterLowpass.Q.setValueAtTime(0.7, t);

    const dryGain = this.ctx.createGain();
    dryGain.gain.setValueAtTime(1, t);

    const output = this.masterGain;
    cueBus.connect(masterLowpass);
    masterLowpass.connect(dryGain);
    dryGain.connect(output);

    let convolver: ConvolverNode | null = null;
    let wetGain: GainNode | null = null;
    if (preset.reverb) {
      convolver = this.getCueReverb(preset.reverb.duration, preset.reverb.decay);
      if (convolver) {
        wetGain = this.ctx.createGain();
        wetGain.gain.setValueAtTime(Math.max(0, Math.min(1, preset.reverb.mix)), t);
        masterLowpass.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(output);
      }
    }

    const cleanup = () => {
      try {
        cueBus.disconnect();
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
        gain.gain.linearRampToValueAtTime(n.gain * this.cueVolume, t + n.attack);
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
      osc.detune.setValueAtTime(tone.detune, t);
      osc.frequency.setValueAtTime(tone.freqStart, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, tone.freqEnd), endTime);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(tone.gain * this.cueVolume, t + tone.attack);
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
      gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.05, t + 2);

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

    partials.forEach((ratio, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const panner = this.ctx!.createPanner();

      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 2;
      osc.frequency.value = baseFreq * ratio;
      osc.type = profile.oscType === 'triangle' ? 'triangle' : 'sine';
      osc.detune.value = profile.detune * (index + 0.5);

      const t = this.ctx!.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.3, t + 2);

      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.value = 0.08 + Math.random() * 0.12;
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(t);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);

      osc.start(t);
      this.droneNodes.push({ osc, panner, gain });
    });
  }

  public stopDrone() {
    if (!this.ctx) {
      this.droneNodes = [];
      return;
    }
    const t = this.ctx.currentTime;
    this.droneNodes.forEach((node) => {
      node.gain.gain.cancelScheduledValues(t);
      node.gain.gain.setValueAtTime(node.gain.gain.value, t);
      node.gain.gain.linearRampToValueAtTime(0, t + 1);
      node.osc.stop(t + 1.1);
    });
    this.droneNodes = [];
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
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = Math.max(40, root / 2);

    const t = this.ctx.currentTime;
    const targetGain = this.isMuted ? 0 : this.musicVolume * 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(targetGain, t + 3);

    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = targetGain * 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    lfo.start(t);

    this.subBassNode = { osc, gain, lfo };
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
    filter.Q.value = 0.7;
    filter.frequency.value = NOISE_FILTER_BASE_HZ;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.25, t + 2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
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
    if (phase === 'inhale') {
      target = NOISE_FILTER_BASE_HZ + (NOISE_FILTER_PEAK_HZ - NOISE_FILTER_BASE_HZ) * p;
    } else if (phase === 'exhale') {
      target = NOISE_FILTER_PEAK_HZ - (NOISE_FILTER_PEAK_HZ - NOISE_FILTER_BASE_HZ) * p;
    } else {
      // Hold: hold the current target steady — no ramp.
      return;
    }
    // Short time constant for smooth tracking without zipper noise.
    this.noiseNode.filter.frequency.setTargetAtTime(target, t, 0.08);
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
    // Hue → root-note mapping across an octave. Red anchors at C3 (warm,
    // grounding), then we walk the spectrum: orange→D3, yellow→E3, green→G3,
    // teal/cyan→A3, blue→C4, violet→A2 (deep, mystical), back to red.
    //
    // Saturation low (greys) → drop to A2 fallback so neutral palettes still
    // get a deliberate root rather than a hue artifact.
    //
    // Equal-temperament frequencies (A4 = 440 reference):
    //   A2 110.00 · C3 130.81 · D3 146.83 · E3 164.81 · G3 196.00
    //   A3 220.00 · C4 261.63
    if (!colorHex) return 110;
    const { hue, saturation } = this.getColorMetrics(colorHex);
    if (saturation < 0.15) return 110; // grey / very desaturated → deep A2

    // Hue is in degrees [0, 360). Bucket into 7 zones spanning a perfect 4th
    // up and a 5th down from the indigo-default D3 — pleasant pentatonic-ish
    // intervals that all sit in the C major / A minor neighborhood so
    // breathing cues stay tonally consonant with the drone.
    const h = ((hue % 360) + 360) % 360;
    if (h < 25)  return 130.81; // red       → C3
    if (h < 50)  return 146.83; // orange    → D3
    if (h < 75)  return 164.81; // amber     → E3
    if (h < 165) return 196.00; // green     → G3
    if (h < 210) return 220.00; // teal/cyan → A3
    if (h < 255) return 130.81; // blue      → C3 (octave below blue-violet)
    if (h < 310) return 110.00; // violet    → A2 (mystical, deep)
    return 130.81;              // magenta/rose → C3
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
