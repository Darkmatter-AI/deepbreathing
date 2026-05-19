'use client';

/**
 * AudioDebugPanel — diagnostic-only DAW-style mixer gated behind ?debug=audio.
 *
 * Performance note: meters update at ~60 Hz via the rAF loop. Naive
 * `setState(meters)` re-renders the whole panel (Radix slider trees included)
 * and stutters the visualizer. Instead, meter components are imperative —
 * the panel holds refs to them and the rAF loop pokes DOM `style.height` /
 * `textContent` directly, so React only re-renders when a slider is dragged.
 */

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import { Slider } from '@/components/ui/slider';
import { AudioService, TuningSnapshot } from './services/audioService';

interface Props {
  audio: AudioService;
}

const RACK_CLS = 'rounded-md border border-border/40 bg-card/70 px-3 py-2 backdrop-blur dark:bg-card/30';
const STRIP_CLS = 'flex flex-col items-center gap-1.5 rounded-md border border-border/40 bg-card/70 px-2 py-2 backdrop-blur dark:bg-card/30';
const LABEL_CLS = 'text-[9px] uppercase tracking-[0.15em] text-muted-foreground';
const VALUE_CLS = 'text-[10px] tabular-nums text-card-foreground';
const STRIP_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.15em] text-card-foreground';

const formatDb = (db: number) => (isFinite(db) ? `${db.toFixed(1)}` : '−∞');
const meterPct = (db: number) => Math.max(0, Math.min(100, ((db + 60) / 60) * 100));

// ─────────────────────────────────────────────────────────────────────────────
// Imperative meters — direct DOM updates, no React render cost.
// ─────────────────────────────────────────────────────────────────────────────
interface LevelMeterHandle {
  update(peakDb: number, rmsDb: number): void;
}
interface ReductionMeterHandle {
  update(reductionDb: number): void;
}
interface NumericReadoutHandle {
  update(value: string): void;
}

const ImperativeLevelMeter = forwardRef<LevelMeterHandle, { height?: string }>(({ height = 'h-36' }, ref) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    update(peakDb, rmsDb) {
      if (fillRef.current) fillRef.current.style.height = `${meterPct(rmsDb)}%`;
      if (peakRef.current) {
        peakRef.current.style.bottom = `${meterPct(peakDb)}%`;
        peakRef.current.style.backgroundColor = peakDb > -0.5 ? 'rgb(239 68 68)' : 'rgba(255,255,255,0.8)';
      }
    },
  }), []);
  return (
    <div className={`relative ${height} w-2 overflow-hidden rounded-sm bg-foreground/10`}>
      <div ref={fillRef} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500" style={{ height: '0%' }} />
      <div ref={peakRef} className="absolute inset-x-0 h-0.5 bg-white/80" style={{ bottom: '0%' }} />
    </div>
  );
});
ImperativeLevelMeter.displayName = 'ImperativeLevelMeter';

const ImperativeReductionMeter = forwardRef<ReductionMeterHandle, { height?: string }>(({ height = 'h-36' }, ref) => {
  const fillRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    update(reductionDb) {
      if (!fillRef.current) return;
      const amount = Math.max(0, -reductionDb);
      const pct = Math.max(0, Math.min(100, (amount / 20) * 100));
      fillRef.current.style.height = `${pct}%`;
    },
  }), []);
  return (
    <div className={`relative ${height} w-2 overflow-hidden rounded-sm bg-foreground/10`}>
      <div ref={fillRef} className="absolute inset-x-0 top-0 bg-amber-400/80" style={{ height: '0%' }} />
    </div>
  );
});
ImperativeReductionMeter.displayName = 'ImperativeReductionMeter';

const NumericReadout = forwardRef<NumericReadoutHandle, { className?: string; initial?: string }>(({ className, initial = '−∞' }, ref) => {
  const elRef = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => ({
    update(value) { if (elRef.current) elRef.current.textContent = value; },
  }), []);
  return <span ref={elRef} className={className ?? VALUE_CLS}>{initial}</span>;
});
NumericReadout.displayName = 'NumericReadout';

// ─────────────────────────────────────────────────────────────────────────────
// Vertical fader — Radix vertical slider with DAW-style flat cap.
// ─────────────────────────────────────────────────────────────────────────────
function VerticalFader({
  value, min, max, step, onChange, ariaLabel, height = 'h-36',
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; ariaLabel: string; height?: string;
}) {
  return (
    <RadixSlider.Root
      orientation="vertical"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
      aria-label={ariaLabel}
      className={`relative flex ${height} w-5 flex-col items-center justify-center touch-none select-none`}
    >
      <RadixSlider.Track className="relative h-full w-1.5 overflow-hidden rounded-full bg-foreground/20">
        <RadixSlider.Range className="absolute left-0 right-0 bottom-0 bg-primary" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-3 w-6 rounded-sm border border-primary/70 bg-card shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80" />
    </RadixSlider.Root>
  );
}

function KnobSlider({
  label, value, min, max, step, onChange, format, width = 'w-24',
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format?: (v: number) => string; width?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${width}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className={LABEL_CLS}>{label}</span>
        <span className={VALUE_CLS}>{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel strip — exposes a single `update(peakDb, rmsDb)` so the rAF loop
// can drive its meter + numeric readout without re-rendering the slider tree.
// ─────────────────────────────────────────────────────────────────────────────
interface ChannelStripHandle {
  update(peakDb: number, rmsDb: number): void;
}
const ChannelStrip = forwardRef<ChannelStripHandle, {
  label: string;
  gain: number;
  gainOnChange: (v: number) => void;
  extras?: React.ReactNode;
  faderRange?: [number, number];
}>(({ label, gain, gainOnChange, extras, faderRange = [0, 2] }, ref) => {
  const meterRef = useRef<LevelMeterHandle>(null);
  const readoutRef = useRef<NumericReadoutHandle>(null);
  useImperativeHandle(ref, () => ({
    update(peakDb, rmsDb) {
      meterRef.current?.update(peakDb, rmsDb);
      readoutRef.current?.update(formatDb(peakDb));
    },
  }), []);
  return (
    <div className={STRIP_CLS}>
      <NumericReadout ref={readoutRef} />
      <div className="flex items-end gap-2">
        <ImperativeLevelMeter ref={meterRef} />
        <VerticalFader
          value={gain}
          min={faderRange[0]}
          max={faderRange[1]}
          step={0.01}
          ariaLabel={`${label} gain`}
          onChange={gainOnChange}
        />
      </div>
      <span className={VALUE_CLS}>×{gain.toFixed(2)}</span>
      {extras ? <div className="mt-1 w-full space-y-1">{extras}</div> : null}
      <span className={`${STRIP_LABEL_CLS} mt-1`}>{label}</span>
    </div>
  );
});
ChannelStrip.displayName = 'ChannelStrip';

export default function AudioDebugPanel({ audio }: Props) {
  const [tuning, setTuning] = useState<TuningSnapshot>(() => audio.getTuning());
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for every imperative meter / readout — the rAF loop pokes these
  // directly so React never re-renders during playback.
  const droneRef = useRef<ChannelStripHandle>(null);
  const subBassRef = useRef<ChannelStripHandle>(null);
  const pinkRef = useRef<ChannelStripHandle>(null);
  const binauralRef = useRef<ChannelStripHandle>(null);
  const envelopeRef = useRef<ChannelStripHandle>(null);
  const preMeterRef = useRef<LevelMeterHandle>(null);
  const preReadoutRef = useRef<NumericReadoutHandle>(null);
  const postMeterRef = useRef<LevelMeterHandle>(null);
  const postReadoutRef = useRef<NumericReadoutHandle>(null);
  const compGrMeterRef = useRef<ReductionMeterHandle>(null);
  const compGrReadoutRef = useRef<NumericReadoutHandle>(null);
  const limGrMeterRef = useRef<ReductionMeterHandle>(null);
  const limGrReadoutRef = useRef<NumericReadoutHandle>(null);

  const rafRef = useRef<number | null>(null);

  // Imperative meter loop — no setState, no re-render. Runs only when expanded.
  useEffect(() => {
    if (collapsed) return;
    const tick = () => {
      const m = audio.getMeterValues();
      droneRef.current?.update(m.layers.drone.peakDb, m.layers.drone.rmsDb);
      subBassRef.current?.update(m.layers.subBass.peakDb, m.layers.subBass.rmsDb);
      pinkRef.current?.update(m.layers.pinkNoise.peakDb, m.layers.pinkNoise.rmsDb);
      binauralRef.current?.update(-Infinity, -Infinity);
      envelopeRef.current?.update(m.layers.envelope.peakDb, m.layers.envelope.rmsDb);
      preMeterRef.current?.update(m.preCompressor.peakDb, m.preCompressor.rmsDb);
      preReadoutRef.current?.update(formatDb(m.preCompressor.peakDb));
      postMeterRef.current?.update(m.postLimiter.peakDb, m.postLimiter.rmsDb);
      postReadoutRef.current?.update(formatDb(m.postLimiter.peakDb));
      compGrMeterRef.current?.update(m.compressorReductionDb);
      compGrReadoutRef.current?.update(Math.max(0, -m.compressorReductionDb).toFixed(1));
      limGrMeterRef.current?.update(m.limiterReductionDb);
      limGrReadoutRef.current?.update(Math.max(0, -m.limiterReductionDb).toFixed(1));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audio, collapsed]);

  // Resync tuning snapshot periodically (handles mobile context rebuild).
  useEffect(() => {
    const id = window.setInterval(() => setTuning(audio.getTuning()), 2000);
    return () => window.clearInterval(id);
  }, [audio]);

  const updateCompressor = useCallback(
    (key: 'threshold' | 'knee' | 'ratio' | 'attack' | 'release', value: number) => {
      audio.setCompressorParams({ [key]: value });
      setTuning((prev) => ({ ...prev, compressor: { ...prev.compressor, [key]: value } }));
    },
    [audio]
  );

  const updateLimiter = useCallback(
    (key: 'threshold' | 'knee' | 'ratio' | 'attack' | 'release', value: number) => {
      audio.setLimiterParams({ [key]: value });
      setTuning((prev) => ({ ...prev, limiter: { ...prev.limiter, [key]: value } }));
    },
    [audio]
  );

  const updatePinkFilter = useCallback(
    (key: 'baseHz' | 'peakHz' | 'q', value: number) => {
      audio.setPinkNoiseFilterRange({ [key]: value });
      setTuning((prev) => ({ ...prev, pinkNoiseFilter: { ...prev.pinkNoiseFilter, [key]: value } }));
    },
    [audio]
  );

  const copyTuning = useCallback(async () => {
    const snapshot = audio.getTuning();
    setTuning(snapshot);
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy tuning JSON:', JSON.stringify(snapshot));
    }
  }, [audio]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-2 pb-2">
      <div className="pointer-events-auto w-full max-w-[1180px] rounded-2xl border border-border/60 bg-background/95 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-card-foreground">Audio Debug</span>
            <span className="text-[10px] text-muted-foreground">?debug=audio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyTuning}
              className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              {copied ? 'Copied' : 'Copy tuning as JSON'}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition hover:text-card-foreground"
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {/* Bus rack */}
            <div className="flex flex-wrap items-stretch gap-2 pb-3">
              <div className={`${RACK_CLS} flex flex-col gap-1.5`}>
                <span className={`${LABEL_CLS} mb-0.5`}>Compressor</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <KnobSlider label="Thresh" value={tuning.compressor.threshold} min={-60} max={0} step={0.5} format={(v) => `${v.toFixed(1)} dB`} onChange={(v) => updateCompressor('threshold', v)} />
                  <KnobSlider label="Knee" value={tuning.compressor.knee} min={0} max={40} step={1} format={(v) => v.toFixed(0)} onChange={(v) => updateCompressor('knee', v)} />
                  <KnobSlider label="Ratio" value={tuning.compressor.ratio} min={1} max={20} step={0.5} format={(v) => `${v.toFixed(1)}:1`} onChange={(v) => updateCompressor('ratio', v)} />
                  <KnobSlider label="Atk" value={tuning.compressor.attack} min={0.001} max={1} step={0.001} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => updateCompressor('attack', v)} />
                  <KnobSlider label="Rel" value={tuning.compressor.release} min={0.01} max={2} step={0.01} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => updateCompressor('release', v)} />
                </div>
              </div>

              <div className={`${RACK_CLS} flex flex-col gap-1.5`}>
                <span className={`${LABEL_CLS} mb-0.5`}>Limiter</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <KnobSlider label="Thresh" value={tuning.limiter.threshold} min={-30} max={0} step={0.5} format={(v) => `${v.toFixed(1)} dB`} onChange={(v) => updateLimiter('threshold', v)} />
                  <KnobSlider label="Ratio" value={tuning.limiter.ratio} min={1} max={20} step={1} format={(v) => `${v.toFixed(0)}:1`} onChange={(v) => updateLimiter('ratio', v)} />
                  <KnobSlider label="Atk" value={tuning.limiter.attack} min={0.0001} max={0.05} step={0.0001} format={(v) => `${(v * 1000).toFixed(2)}ms`} onChange={(v) => updateLimiter('attack', v)} />
                  <KnobSlider label="Rel" value={tuning.limiter.release} min={0.01} max={0.5} step={0.005} format={(v) => `${(v * 1000).toFixed(0)}ms`} onChange={(v) => updateLimiter('release', v)} />
                </div>
              </div>

              <div className={`${RACK_CLS} flex flex-col gap-1.5`}>
                <span className={`${LABEL_CLS} mb-0.5`}>Session arc</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <KnobSlider label="Window" value={tuning.arcWindowSeconds} min={30} max={600} step={10} format={(v) => `${v.toFixed(0)}s`} onChange={(v) => { audio.setArcWindowSeconds(v); setTuning((p) => ({ ...p, arcWindowSeconds: v })); }} />
                  <KnobSlider label="RootDrift" value={tuning.arcRootDriftFactor} min={0.5} max={1} step={0.005} format={(v) => v.toFixed(3)} onChange={(v) => { audio.setArcRootDriftFactor(v); setTuning((p) => ({ ...p, arcRootDriftFactor: v })); }} />
                  <KnobSlider label="LFOslow" value={tuning.arcLfoSlowdownFactor} min={0} max={1} step={0.01} onChange={(v) => { audio.setArcLfoSlowdownFactor(v); setTuning((p) => ({ ...p, arcLfoSlowdownFactor: v })); }} />
                  <KnobSlider label="OrbitSlow" value={tuning.arcOrbitSlowdownFactor} min={0} max={1} step={0.01} onChange={(v) => { audio.setArcOrbitSlowdownFactor(v); setTuning((p) => ({ ...p, arcOrbitSlowdownFactor: v })); }} />
                </div>
              </div>

              <div className={`${RACK_CLS} flex flex-col gap-1.5`}>
                <span className={`${LABEL_CLS} mb-0.5`}>Cues</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  <KnobSlider label="Tone" value={tuning.cueToneScale} min={0} max={2} step={0.01} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => { audio.setCueToneScale(v); setTuning((p) => ({ ...p, cueToneScale: v })); }} />
                  <KnobSlider label="Noise" value={tuning.cueNoiseScale} min={0} max={2} step={0.01} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => { audio.setCueNoiseScale(v); setTuning((p) => ({ ...p, cueNoiseScale: v })); }} />
                  <KnobSlider label="Reverb" value={tuning.cueReverbMix} min={0} max={2} step={0.01} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => { audio.setCueReverbMix(v); setTuning((p) => ({ ...p, cueReverbMix: v })); }} />
                </div>
              </div>
            </div>

            {/* Mixer */}
            <div className="flex items-stretch gap-2 overflow-x-auto pt-2">
              <ChannelStrip
                ref={droneRef}
                label="Drone"
                gain={tuning.droneScale}
                gainOnChange={(v) => { audio.setDroneGain(v); setTuning((p) => ({ ...p, droneScale: v })); }}
              />
              <ChannelStrip
                ref={subBassRef}
                label="Sub-Bass"
                gain={tuning.subBassScale}
                gainOnChange={(v) => { audio.setSubBassGain(v); setTuning((p) => ({ ...p, subBassScale: v })); }}
                extras={
                  <KnobSlider label="Freq×" value={tuning.subBassFreqMultiplier} min={0.5} max={2} step={0.05} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => { audio.setSubBassFreqMultiplier(v); setTuning((p) => ({ ...p, subBassFreqMultiplier: v })); }} width="w-full" />
                }
              />
              <ChannelStrip
                ref={pinkRef}
                label="Pink"
                gain={tuning.pinkNoiseScale}
                gainOnChange={(v) => { audio.setPinkNoiseGain(v); setTuning((p) => ({ ...p, pinkNoiseScale: v })); }}
                extras={
                  <>
                    <KnobSlider label="LP base" value={tuning.pinkNoiseFilter.baseHz} min={100} max={1200} step={10} format={(v) => v.toFixed(0)} onChange={(v) => updatePinkFilter('baseHz', v)} width="w-full" />
                    <KnobSlider label="LP peak" value={tuning.pinkNoiseFilter.peakHz} min={500} max={6000} step={50} format={(v) => v.toFixed(0)} onChange={(v) => updatePinkFilter('peakHz', v)} width="w-full" />
                    <KnobSlider label="Q" value={tuning.pinkNoiseFilter.q} min={0.1} max={4} step={0.05} onChange={(v) => updatePinkFilter('q', v)} width="w-full" />
                  </>
                }
              />
              <ChannelStrip
                ref={binauralRef}
                label="Binaural"
                gain={tuning.binauralScale}
                gainOnChange={(v) => { audio.setBinauralGain(v); setTuning((p) => ({ ...p, binauralScale: v })); }}
              />
              <ChannelStrip
                ref={envelopeRef}
                label="Envelope"
                gain={tuning.phaseEnvelopeScale}
                gainOnChange={(v) => { audio.setPhaseEnvelopeGain(v); setTuning((p) => ({ ...p, phaseEnvelopeScale: v })); }}
                extras={
                  <KnobSlider label="Freq×" value={tuning.phaseEnvelopeFreqMultiplier} min={0.5} max={2} step={0.05} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => { audio.setPhaseEnvelopeFreqMultiplier(v); setTuning((p) => ({ ...p, phaseEnvelopeFreqMultiplier: v })); }} width="w-full" />
                }
              />

              {/* Master strip */}
              <div className={`${STRIP_CLS} ml-auto bg-card/90 dark:bg-card/50`}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <NumericReadout ref={preReadoutRef} />
                    <ImperativeLevelMeter ref={preMeterRef} />
                    <span className={LABEL_CLS}>Pre</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <NumericReadout ref={postReadoutRef} />
                    <ImperativeLevelMeter ref={postMeterRef} />
                    <span className={LABEL_CLS}>Post</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <NumericReadout ref={compGrReadoutRef} initial="0.0" />
                    <ImperativeReductionMeter ref={compGrMeterRef} />
                    <span className={LABEL_CLS}>Comp</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <NumericReadout ref={limGrReadoutRef} initial="0.0" />
                    <ImperativeReductionMeter ref={limGrMeterRef} />
                    <span className={LABEL_CLS}>Lim</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={VALUE_CLS}>{(20 * Math.log10(Math.max(tuning.masterTrim, 1e-3))).toFixed(1)}</span>
                    <VerticalFader
                      value={tuning.masterTrim}
                      min={0}
                      max={1}
                      step={0.01}
                      ariaLabel="Master trim"
                      onChange={(v) => { audio.setMasterTrim(v); setTuning((p) => ({ ...p, masterTrim: v })); }}
                    />
                    <span className={LABEL_CLS}>Trim</span>
                  </div>
                </div>
                <span className={`${STRIP_LABEL_CLS} mt-1`}>Master</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
