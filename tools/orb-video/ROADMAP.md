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
- [x] ✅ **Root-caused the "static/hiss" — it's the DRONE layer.** Layer-isolation
      harness (`scripts/capture_isolate.js`) muted one layer at a time at runtime
      and measured HF-band RMS. Muting *only* the drone collapsed >8 kHz energy to
      the silence floor (−73 → −81 dB) on **both wim-hof and box**; every other
      layer mute left HF untouched. The slow modes (Relax/Coherent) use the
      pink-noise bed instead of the drone — which is exactly why they never hissed.
      - **Mechanism:** warm-themed drones use **triangle oscillators** whose high
        harmonics extend into the 6–16 kHz hiss band (the bulk), plus a smaller
        top-octave **HRTF panner "zipper"** from per-frame `positionX/Z.value`
        writes in `updateSpatial` (~60 Hz). A freeze test (panner held still)
        removed only ~2 dB @8k / ~4.6 dB @14k — confirming harmonics dominate.
      - **NOT** the codec: lossless PCM re-capture (`scripts/capture_pcm.js`) had
        the identical HF floor to the MP3, ruling out the Opus→MP3 pipeline.
      - The faint residual in the all-muted control is a *low hum* (100–250 Hz),
        not hiss: the drone's volume LFO is wired additively into `gain.gain`, so
        `setDroneGain(0)` (and the real mute path) leaves ±0.05×osc leaking
        through. **Separate minor bug** — flagged, not fixed in this pass.
- [x] ✅ **Fix: shared drone-bus lowpass** (`audioService.ts`, `DRONE_LOWPASS_HZ`
      = 2000, Q 0.5). All drone partials route panner → one lowpass → master.
      Mechanism-agnostic: kills triangle harmonics *and* the panner zipper (both
      above the cutoff) while keeping the warm low pad (roots 87–165 Hz, partials
      to ~330 Hz). Verified: fixed build measures >14 kHz **below** the silence
      floor and >8 kHz floored on wim-hof + box. Tightening to 1500 Hz gave no
      extra HF benefit (residual @8k is the cue layer, not the drone) so 2000 Hz
      keeps maximum warmth. A/B exports: `~/Downloads/static_{BEFORE,FIXED}_*.mp3`.
- [ ] Land the fix on `audio-v2-overnight`; revert diagnostic edits
      (`window.__audioService` debug hook). Consider also fixing the LFO-additive
      mute leak so the mute button fully silences the drone.
- [ ] Resolve `audio-v2-overnight` WIP state (commit `d20412b` "before machine move");
      decide what ships vs what's experimental (binaural toggle, sub-bass, etc.).
- [ ] Ship `audio-v2` to production (log result against DAR-377 criteria).
- [ ] Re-capture video audio against shipped/preview audio-v2 → re-mux clips.

## Video — matrix & publish 🟡 (assets built; manual upload pending)

- [x] ✅ Loop strategy **solved & seam-safe**. Masters rendered at an integer number
      of breath cycles (box 48s, coherent/sigh 44s, 4-7-8 38s, belly 50s); particles
      rewritten **closed-form periodic** (`src/particles.ts` — pure function of
      `frame mod loopFrames`; Lissajous drift on integer harmonics + breath-coupled
      radial), morph/hue/ring periods re-phased to integer divisors of the loop
      (`src/Orb.tsx`, `loopSec` prop). Proof: loop-seam frame diff ≈ internal
      cycle-boundary diff (0.12–0.23 YAVG, ≪ teleport). Finals **stream-copied**
      (no re-encode) to each duration.
      - **Gotcha:** Remotion keyframes every ~4.17s → masters **normalized to a 1s
        GOP** (`-x264-params keyint=60:min-keyint=60:scenecut=0`) so integer-second
        `-c copy -t` cuts land on a keyframe (all targets are integer seconds).
      - **Gotcha:** Remotion emits full-range **`yuvj420p`** (faithful to the site,
        YouTube-OK), not `yuv420p` — QA accepts both.
- [x] ✅ Matrix: {box, coherent, relax/4-7-8, sigh, belly} × {light,dark} ×
      {landscape 4K 1/2/5/10min + Shorts 1440×2560 30s/60s} = **60 finals from 20
      masters**. Driver: `scripts/render_matrix.js` (resumable, `--qa`). Wim Hof
      deferred (non-loop protocol).
- [x] ✅ Per-technique audio beds — 5 clean beds captured from the hiss-fixed local
      build (`scripts/capture_beds.sh`), trimmed to exact cycle length with fades.
      QA: true-peak −4…−11 dBTP, flat=0, >8 kHz floored.
- [x] ✅ Dark-mode variants (one-prop flip: `theme:"dark"`).
- [x] ✅ Metadata package: per-video title/description/tags/chapters (built from live
      `breathing-pages.ts` via `scripts/launch/gen-launch-package.mjs` + `@/`-alias
      loader), `upload_manifest.csv` (60 rows), `channel_setup.md`, DataForSEO
      `keywords.json`. All YouTube limits enforced. **No thumbnails (out of scope).**
- [ ] **Manual upload** (no channel exists yet — irreversible, deferred to Monday).
      Package staged at `out/launch/` + `out/SUMMARY.md`. Light public / dark +48h.
- [x] ✅ **TikTok vertical assets built** — re-rendered TikTok-native **1080×1920**,
      **light only**, **15s/30s/60s** (5 techniques → **15 finals from 5 masters**;
      `tiktok` orient in `render_matrix.js`). Particle draw-in/out strengthened to a
      **multiplicative radial pulse** (`src/particles.ts`, `PULL`/`PUSH`) so the breath
      coupling is clearly visible vs the old subtle additive offset — now the default
      look for any future render. Package: per-video `.caption.txt`, `tiktok_manifest.csv`
      (15 rows), `tiktok_setup.md` (`scripts/launch/gen-tiktok-package.mjs`). Manual
      upload via TikTok Studio (Content Posting API needs a 2–4 wk audit). YouTube finals
      left untouched (resumable skip). See `PUBLISH-HANDOFF.md` §TikTok.
- [ ] **Manual TikTok upload** via TikTok Studio (per `tiktok_setup.md`; 1–2/day, lead
      Box + Physiological Sigh). Owner sets privacy at upload.
- [ ] Log the YouTube bet in `docs/PRODUCT-EXPERIMENTS.md` with success criteria (post-launch).
- [ ] Re-capture beds against shipped/preview audio-v2 once it lands in prod (currently from local :3031).

## Open questions

- ~~Long-clip looping vs full render (seam handling on particles)?~~ **Resolved: closed-form periodic particles + 1s-GOP stream-copy.**
- Where do masters/finals live (not in git — large)? Drive / bucket? (`out/` stays gitignored; 5.7 GB of finals.)
- ~~Shorts dimension: 1080×1920 vs 1440×2560?~~ **Chose 1440×2560.**
