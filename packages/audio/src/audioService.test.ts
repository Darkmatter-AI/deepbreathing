import { afterEach, describe, expect, it, vi } from 'vitest';

import { AudioService } from './audioService';
import { ModeName } from './modes';

class FakeParam {
  value = 0;

  setValueAtTime(value: number) { this.value = value; return this; }
  linearRampToValueAtTime(value: number) { this.value = value; return this; }
  exponentialRampToValueAtTime(value: number) { this.value = value; return this; }
  setTargetAtTime(value: number) { this.value = value; return this; }
  cancelScheduledValues() { return this; }
}

class FakeNode {
  readonly disconnectCalls: unknown[] = [];
  readonly connections: unknown[] = [];

  constructor(readonly context: FakeContext) {}

  connect(destination: unknown) {
    this.connections.push(destination);
    return destination;
  }

  disconnect(destination?: unknown) {
    this.disconnectCalls.push(destination);
  }
}

class FakeSource extends FakeNode {
  // This is deliberately RNAA-shaped: no addEventListener, only onEnded.
  onEnded: ((event?: unknown) => void) | null = null;
  readonly stopCalls: number[] = [];
  started = false;
  buffer: unknown = null;
  loop = false;

  start(when = 0) {
    this.started = true;
    this.stopCalls.push(when);
  }

  stop(when = 0) {
    this.stopCalls.push(when);
  }
}

class FakeOscillator extends FakeSource {
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  type: OscillatorType = 'sine';
}

class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeFilter extends FakeNode {
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
  type: BiquadFilterType = 'lowpass';
}

class FakePanner extends FakeNode {
  readonly pan = new FakeParam();
}

class FakeAnalyser extends FakeNode {
  fftSize = 1024;
  readonly frequencyBinCount = 512;
  getFloatFrequencyData() {}
  getFloatTimeDomainData() {}
}

class FakeWaveShaper extends FakeNode {
  curve: Float32Array | null = null;
  oversample: OverSampleType = 'none';
}

class FakeConvolver extends FakeNode {
  buffer: unknown = null;
}

class FakeBuffer {
  readonly numberOfChannels: number;

  constructor(
    readonly sampleRate: number,
    readonly length: number,
    numberOfChannels: number,
  ) {
    this.numberOfChannels = numberOfChannels;
  }

  getChannelData() {
    return new Float32Array(this.length);
  }
}

class FakeContext {
  state: AudioContextState | 'interrupted' = 'running';
  readonly currentTime = 0;
  readonly sampleRate = 44100;
  readonly destination: FakeNode;
  readonly createdNodes: FakeNode[] = [];
  readonly sources: FakeSource[] = [];
  resolveResume: (() => void) | null = null;

  constructor() {
    this.destination = this.make(new FakeNode(this));
  }

  private make<T extends FakeNode>(node: T) {
    this.createdNodes.push(node);
    if (node instanceof FakeSource) this.sources.push(node);
    return node;
  }

  createGain() { return this.make(new FakeGain(this)); }
  createBiquadFilter() { return this.make(new FakeFilter(this)); }
  createOscillator() { return this.make(new FakeOscillator(this)); }
  createStereoPanner() { return this.make(new FakePanner(this)); }
  createAnalyser() { return this.make(new FakeAnalyser(this)); }
  createWaveShaper() { return this.make(new FakeWaveShaper(this)); }
  createConvolver() { return this.make(new FakeConvolver(this)); }
  createBufferSource() { return this.make(new FakeSource(this)); }
  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new FakeBuffer(sampleRate, length, numberOfChannels);
  }

  resume() {
    return new Promise<void>((resolve) => {
      this.resolveResume = () => {
        this.state = 'running';
        resolve();
      };
    });
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

function createService(context: FakeContext) {
  return new AudioService({
    platform: {
      createContext: () => context as unknown as AudioContext,
    },
  });
}

afterEach(() => {
  vi.useRealTimers();
});
describe('AudioService lifecycle safety', () => {
  it('does not resurrect a drone after stop while context startup is awaited', async () => {
    const context = new FakeContext();
    context.state = 'suspended';
    const service = createService(context);

    const startup = service.startDrone('#e11d48');
    await Promise.resolve();
    service.stopDrone();
    context.resolveResume?.();

    await startup;

    expect((service as unknown as { droneNodes: unknown[] }).droneNodes).toHaveLength(0);
    expect(context.sources.filter((source) => source.started)).toHaveLength(0);
  });

  it('cleans every phase-cue source and graph edge through RNAA onEnded', async () => {
    const context = new FakeContext();
    const service = createService(context);
    await service.startDrone('#e11d48');

    const sourceStart = context.sources.length;
    const nodeStart = context.createdNodes.length;
    service.setBreathingMode(ModeName.Box);
    service.playCue('inhale', '#e11d48');

    const cueSources = context.sources.slice(sourceStart);
    const cueNodes = context.createdNodes.slice(nodeStart);
    expect(cueSources).toHaveLength(2);
    expect((service as unknown as { activeCueBuses: Set<unknown> }).activeCueBuses.size).toBe(1);

    cueSources[0].onEnded?.();
    expect((service as unknown as { activeCueBuses: Set<unknown> }).activeCueBuses.size).toBe(1);
    cueSources[1].onEnded?.();

    expect((service as unknown as { activeCueBuses: Set<unknown> }).activeCueBuses.size).toBe(0);
    expect(cueNodes.every((node) => node.disconnectCalls.length > 0)).toBe(true);
  });

  it('keeps cached reverb fan-out intact while removing each cue send', async () => {
    const context = new FakeContext();
    const service = createService(context);
    await service.startDrone('#e11d48');

    const firstCueSourceStart = context.sources.length;
    service.playCue('inhale', '#e11d48');
    const firstCueSources = context.sources.slice(firstCueSourceStart);

    const secondCueSourceStart = context.sources.length;
    service.playCue('inhale', '#e11d48');
    const secondCueSources = context.sources.slice(secondCueSourceStart);

    firstCueSources.forEach((source) => source.onEnded?.());
    secondCueSources.forEach((source) => source.onEnded?.());

    const reverb = [...(service as unknown as {
      cueReverbCache: Map<string, FakeConvolver>;
    }).cueReverbCache.values()][0];
    expect(reverb).toBeDefined();
    expect(reverb.disconnectCalls.length).toBeGreaterThan(0);
    expect(reverb.disconnectCalls.every((destination) => destination !== undefined)).toBe(true);
  });

  it('bounds completion-cue graph lifetime when ended is interrupted', async () => {
    vi.useFakeTimers();
    const context = new FakeContext();
    const service = createService(context);
    await service.startDrone('#e11d48');

    service.playCompletionCue();
    expect((service as unknown as { activeCueBuses: Set<unknown> }).activeCueBuses.size).toBe(1);

    vi.advanceTimersByTime(1200);

    expect((service as unknown as { activeCueBuses: Set<unknown> }).activeCueBuses.size).toBe(0);
  });
});
