#!/usr/bin/env python3
"""Generate the native breathing cue wavs (inhale/exhale/hold).

The originals shipped as 200ms of digital silence (placeholder files), which
is why TestFlight builds played no cues. These are modeled on the WebAudio
synthesis in breathing-web/services/audioService.ts (Relax-mode parameters,
the most neutral of the set): a soft triangle tone with a small pitch sweep
plus a band-filtered noise breath, gentle attack/release, light decay tail.

Run from apps/mobile:  python3 scripts/generate-cue-audio.py
Outputs to assets/audio/{inhale,exhale,hold}.wav (44.1 kHz mono 16-bit).
"""
import math
import os
import struct
import wave

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio')


def env(i, n, attack, release):
    """Attack/release envelope: sin-eased attack, exponential-ish release."""
    t = i / SR
    dur = n / SR
    a = min(1.0, t / attack) if attack > 0 else 1.0
    a = math.sin(a * math.pi / 2)
    rel_start = dur - release
    r = 1.0 if t < rel_start else max(0.0, 1.0 - (t - rel_start) / release)
    r = r * r  # steeper tail, avoids an abrupt cut
    return a * r


def triangle(phase):
    p = phase % 1.0
    return 4 * abs(p - 0.5) - 1


def biquad_bandpass(samples, center_start, center_end, q):
    """Bandpass with linearly swept center frequency (RBJ biquad)."""
    out = [0.0] * len(samples)
    x1 = x2 = y1 = y2 = 0.0
    n = len(samples)
    for i, x in enumerate(samples):
        f = center_start + (center_end - center_start) * (i / n)
        w0 = 2 * math.pi * f / SR
        alpha = math.sin(w0) / (2 * q)
        b0, b1, b2 = alpha, 0.0, -alpha
        a0, a1, a2 = 1 + alpha, -2 * math.cos(w0), 1 - alpha
        y = (b0 / a0) * x + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2
        x1, x2 = x, x1
        y1, y2 = y, y1
        out[i] = y
    return out


def lowpass(samples, cutoff):
    rc = 1.0 / (2 * math.pi * cutoff)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    out = [0.0] * len(samples)
    prev = 0.0
    for i, x in enumerate(samples):
        prev = prev + alpha * (x - prev)
        out[i] = prev
    return out


def decay_tail(samples, mix, delay_s, feedback):
    """Cheap feedback-delay tail standing in for the WebAudio reverb."""
    d = int(delay_s * SR)
    out = list(samples) + [0.0] * (d * 4)
    for i in range(d, len(out)):
        out[i] += out[i - d] * feedback * mix
    return out


def rng(seed):
    state = seed

    def nxt():
        nonlocal state
        state = (1103515245 * state + 12345) % (1 << 31)
        return state / (1 << 30) - 1.0

    return nxt


def render(name, dur, tone_f0, tone_f1, tone_gain, noise_gain,
           noise_f0, noise_f1, attack, release, master_lp, seed):
    n = int(dur * SR)
    noise_src = rng(seed)
    tone = [0.0] * n
    phase = 0.0
    for i in range(n):
        f = tone_f0 + (tone_f1 - tone_f0) * (i / n)
        phase += f / SR
        # main osc + slight detuned second osc for warmth
        tone[i] = 0.7 * triangle(phase) + 0.3 * triangle(phase * 1.005)
    noise = biquad_bandpass([noise_src() for _ in range(n)], noise_f0, noise_f1, 0.7)
    mixed = [
        (tone_gain * tone[i] + noise_gain * noise[i]) * env(i, n, attack, release)
        for i in range(n)
    ]
    mixed = lowpass(mixed, master_lp)
    mixed = decay_tail(mixed, mix=0.35, delay_s=0.055, feedback=0.55)
    peak = max(abs(v) for v in mixed) or 1.0
    norm = 0.62 / peak  # sits audibly above the 0.8-volume ambient bed without spiking
    frames = b''.join(
        struct.pack('<h', int(max(-1.0, min(1.0, v * norm)) * 32767)) for v in mixed
    )
    path = os.path.join(OUT_DIR, f'{name}.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(frames)
    print(f'{name}.wav: {len(mixed)/SR:.2f}s peak-normalized to 0.62')


# Relax-mode-inspired neutral set (audioService.ts): rising minor-ish sweep in,
# falling sweep out, steady soft tick for holds.
render('inhale', 0.38, 220, 247, 0.55, 0.22, 650, 1300, 0.05, 0.30, 1800, seed=1234)
render('exhale', 0.42, 220, 196, 0.60, 0.24, 1400, 520, 0.05, 0.34, 1700, seed=5678)
render('hold', 0.26, 330, 330, 0.50, 0.06, 700, 700, 0.02, 0.20, 1600, seed=9012)
