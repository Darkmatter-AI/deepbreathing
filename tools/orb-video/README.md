# orb-video — breathing-orb video generator

Renders deterministic, high-fidelity videos of the deepbreathingexercises.com
breathing orb (box, coherent, relax, sigh, …) at any resolution / framerate /
duration, with the site's real audio. Built for a YouTube content library
(see the Ahrefs finding: YouTube presence is the #1 correlate of AI brand visibility).

## Why Remotion (not screen capture)

The orb animation is React state driven by `requestAnimationFrame`. Real-time
screen capture topped out at ~25fps with VP8 colour glitches; a raw CDP
virtual-clock approach hit React commit races. Remotion makes **time an input**
(`useCurrentFrame()`), so we re-implemented the orb math as pure functions and
get reliable, parallel, true-60fps renders at any resolution.

## Layout

- `src/breathing.ts` — pure port of the phase/scale state machine + `morph`/hue keyframes
- `src/particles.ts` — deterministic port of the particle physics (radial in/out + drift + smoothing)
- `src/colors.ts` — theme-derived background tinting
- `src/font.ts` + `src/font-data.ts` — Inter embedded as base64 (no network at render time → reliable)
- `src/Orb.tsx` — the composition (orb, glow, ring, label, particles); fully parametrized
- `src/Root.tsx` — `calculateMetadata` derives duration/dimensions from props
- `scripts/capture_audio.js` — taps the live WebAudio graph → real stereo site audio
- `scripts/capture5.js` — full A/V tap (audio + reference video) against a live URL
- `scripts/audio-spectrogram.sh` — clipping diagnostic (spectrogram + true-peak + flatness)

## Setup

```bash
cd tools/orb-video
npm install
```

## Capture audio (real site sound)

```bash
ORB_URL='https://deepbreathingexercises.com/breathe/box?duration=300' ORB_D=61 \
  node scripts/capture_audio.js          # -> public/site_audio.{webm} ; convert to mp3 for <Audio>
ffmpeg -y -i aud/site_audio.webm -c:a libmp3lame -b:a 192k -ac 2 public/site_audio.mp3
```

## Render

```bash
# default props (box, light, rose, 1080p, 60s, audio)
npx remotion render src/index.ts Breathing out/box.mp4 --codec=h264

# any matrix entry via a props file (see scripts/props.example.json)
npx remotion render src/index.ts Breathing out/coherent_shorts.mp4 \
  --codec=h264 --props=./props.json --timeout=300000 --concurrency=3
```

Props: `patternKey`, `color`, `speed`, `audioSrc`, `theme` (light|dark),
`labels`, `durationSec`, `width`, `height`. Absolute sizes (blur, ring, particles)
scale with resolution, so 4K looks identical to 1080p — just sharper.

## Gotchas learned the hard way

- **Embed fonts** (`font-data.ts`), don't fetch from Google Fonts — a blocking
  `delayRender` on a network font fetch intermittently hangs render tabs → timeouts.
- Long clips: render one short master (one breath cycle is periodic) and
  `ffmpeg -stream_loop` to length instead of rendering 10 minutes of frames.
- Use `--timeout=300000` and bounded `--concurrency` for big renders.

## Audio

The video audio is captured from **production**, which currently serves the
pre-limiter audio → the cue-tone "clipping". The fix lives on the
`audio-v2-overnight` branch (master compressor + true-peak limiter). Ship that,
then re-capture. See `ROADMAP.md`.
