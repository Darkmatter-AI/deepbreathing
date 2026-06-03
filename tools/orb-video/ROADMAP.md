# orb-video — roadmap to live

Goal: a YouTube library of breathing-orb videos (per technique × duration,
landscape + Shorts), visually matching the site, with clean audio.

## Done ✅

- [x] Deterministic renderer (Remotion) — true 60fps, any resolution, parallel
- [x] Orb fidelity vs the live site: Inter font, organic blob `morph`, hue-rotate,
      soft **vertical** glow, subtle **ring**, fixed-size (non-scaling) label
- [x] Real particle physics (inhale pulls in / exhale pushes out + drift + smoothing)
- [x] Theme-derived background; **light mode + canonical per-technique colours**
      (box=rose `#e11d48`; coherent/relax/sigh from `constants.ts`)
- [x] Real stereo site audio via WebAudio tap, auto-synced
- [x] 4K validated (3840×2160, ~5.4s wall / video-sec, files compress small)
- [x] Reliable renders (Inter embedded as base64; no network at render time)
- [x] Audio clipping **diagnostic** script (spectrogram + true-peak + flatness)

## Audio — validate & ship `audio-v2-overnight` (fixes web → fixes video) ⬜

The fix already exists (unshipped): master compressor + true-peak brick-wall
limiter (`audioService.ts`, threshold −3 dB / ratio 20 / 1ms attack) targeting
the cue-noise transient puffs that clip.

- [x] Confirm the fix exists on `audio-v2-overnight` and is absent on `main`
- [x] **Local A/B done** (main/prod vs audio-v2 dev on :3031), via `audio-spectrogram.sh`:
      | technique | main true-peak | audio-v2 true-peak | Flat factor |
      |-----------|---------------|--------------------|-------------|
      | box 180s  | −3.1 dBTP     | −3.9 dBTP          | 0 (both)    |
      | wim-hof 60s | −4.7 dBTP   | −5.0 dBTP          | 0 (both)    |
      **No hard clipping on EITHER, on slow or rapid techniques.** The master bus
      tops out ~−3 dB, so the −3 dB limiter barely engages. audio-v2's audible
      change is a richer ambient bed (sub-bass, breath-coupled pink noise, drone
      evolution), not declipping.
- [ ] ⚠️ **Re-localize the perceived clipping** — it's NOT 0 dBFS master clipping.
      Hypotheses: (a) perceptual harshness of the cue-tone transient/noise puff
      (fix = softer cue attack / less cue noise / lower cue gain in `playCue`);
      (b) a non-WebAudio path the tap misses (e.g. a media-element unlock sound);
      (c) specific technique/volume. Need user to point at where they hear it.
- [ ] Once localized: fix at the cue-synthesis level (not the master limiter).
- [ ] Resolve `audio-v2-overnight` WIP state (commit `d20412b` "before machine move");
      decide what ships vs what's experimental (binaural toggle, sub-bass, etc.).
- [ ] Ship `audio-v2` to production (log result against DAR-377 criteria).
- [ ] Re-capture video audio against shipped/preview audio-v2 → re-mux clips.

## Video — matrix & publish ⬜

- [ ] Loop strategy: render one short 4K master per technique, `ffmpeg -stream_loop`
      to {30s, 1, 2, 5, 10 min} (orb/glow/ring are periodic; verify particle seam
      or make particles loop)
- [ ] Matrix: {box, coherent, relax, sigh, belly, physiological-sigh} ×
      {durations}, **landscape 4K** + **Shorts 1440×2560**
- [ ] Per-technique audio passes (themed cues) — one long bed each, sliced/looped
- [ ] Dark-mode variants (one-prop flip: `theme:"dark"`)
- [ ] Publish workflow: titles/descriptions/thumbnails, upload, link back to the tool
- [ ] Log the YouTube bet in `docs/PRODUCT-EXPERIMENTS.md` with success criteria

## Open questions

- Long-clip looping vs full render (seam handling on particles)?
- Where do masters/finals live (not in git — large)? Drive / bucket?
- Shorts dimension: 1080×1920 vs 1440×2560 (VP9 quality vs size)?
