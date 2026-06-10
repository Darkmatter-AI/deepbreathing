# YouTube Launch — Publish Handoff

**For:** a Claude cowork agent picking up the upload + web-publish work.
**Status:** all assets are **built, QA'd, and approved**. Nothing is uploaded yet
(no channel existed at build time — uploading is irreversible, so it was left manual).
Your job is **Phases 1–4 below**: create the channel, upload the 60 videos, wire
the resulting YouTube IDs back into the website, and log the experiment.

> Read `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/SUMMARY.md`
> first — it's the build report. This file is the action plan.

---

## 0. Where everything lives (absolute paths)

| What | Absolute path |
|---|---|
| Orb-video tool dir | `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video` |
| Website source (Next.js app you deploy) | `/Users/abi/Sites/deepbreathing-orb-render` |
| The launch package | `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch` |
| Rendered masters (intermediate) | `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/_masters` |
| Audio beds | `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/public/{box,coherent,relax,sigh,belly}.mp3` |

This is an isolated git worktree on branch `chore/orb-video-launch-assets`. The website
source shares the same repo (the live site is `deepbreathingexercises.com`, deployed on Vercel).

> ⚠️ The video assets are **local-only and gitignored** (`out/` = 5.7 GB). They are
> NOT in git and NOT on any remote. If you run on a different machine, copy the assets
> first (Drive/bucket). On this machine they're already in place.

### The package — `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/`
```
/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/
├── upload_manifest.csv          ← SOURCE OF TRUTH for uploads (60 rows, one per video)
├── channel_setup.md             ← channel name, bio, playlists, launch cadence
├── keywords.json                ← DataForSEO search volumes (reference)
├── SUMMARY.md                   ← build report + QA results
├── sample-particles-box-light.png   ← look reference (already approved)
├── sample-particles-box-dark.png    ← look reference (already approved)
├── render.log                   ← build log
└── <technique>/                 ← technique ∈ {box, coherent, 4-7-8, physiological-sigh, belly}
    ├── landscape/<technique>-<theme>-landscape-<dur>.mp4   (4K 3840×2160; dur ∈ 1min/2min/5min/10min)
    │   + <same-name>.json   (structured metadata)
    │   + <same-name>.txt    (PASTE-READY title line + description)
    └── shorts/<technique>-<theme>-shorts-<dur>.mp4         (1440×2560; dur ∈ 30s/60s)
        + .json + .txt
```
- **5 techniques:** `box`, `coherent`, `4-7-8`, `physiological-sigh`, `belly`.
- **60 videos** = 5 techniques × 2 themes (`light`/`dark`) × (4 landscape + 2 shorts).
- Every `.mp4` has a matching `.json` (machine-readable) and `.txt` (the first line is
  the **title**, the rest is the **description** ready to paste into YouTube).

Example full paths:
```
/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/box/landscape/box-light-landscape-5min.mp4
/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/box/landscape/box-light-landscape-5min.txt
/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/belly/shorts/belly-dark-shorts-30s.mp4
```

---

## 1. What's already done (the homework) — DO NOT REDO

✅ **Rendered & QA-verified** (`node /Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/scripts/render_matrix.js --qa`):
- 60/60 finals pass ffprobe (h264, 8-bit 4:2:0, correct resolution, duration ±0.1s, AAC audio).
- 20/20 masters are seam-safe (loop join is invisible — verified by frame diff).
- Clean audio baked in. 5/5 beds hiss-fixed, no clipping (the drone-static fix is in).

✅ **Per-video metadata generated** (`/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/scripts/launch/gen-launch-package.mjs`):
- Titles (all ≤100 chars), descriptions, tags (all ≤500 chars), chapters
  (landscape only: first 00:00, ≥3, ≥10s spacing), built from the live site
  editorial copy in `/Users/abi/Sites/deepbreathing-orb-render/src/data/breathing-pages.ts`.
- Real search-volume keywords baked into titles/tags (box breathing 49.5k,
  diaphragmatic breathing 40.5k, 4-7-8 14.8k, etc.).

✅ **Channel copy** drafted in `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/channel_setup.md` (name, ≤1000-char bio, playlists, cadence).

✅ **Look approved** — the closed-form particle motion + light/dark themes were signed off.

❌ **Not done (your job):** create the channel, upload, set publish schedule, wire
videos into the site, deploy, log the experiment. **No thumbnails were made** (out of scope).

---

## 2. The manifest — your upload source of truth

`/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/upload_manifest.csv`,
60 rows. It's RFC-4180 (descriptions contain quoted newlines — parse with a real CSV
reader / Sheets / `python3 -c "import csv"`, **not** `wc -l`). Columns:

| column | use |
|---|---|
| `filename` | the .mp4 to upload |
| `path` | its location, relative to `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video` (e.g. `out/launch/box/landscape/box-light-landscape-5min.mp4`) |
| `technique` | e.g. "Box Breathing" |
| `duration` / `duration_seconds` | e.g. `5min` / `300` |
| `orientation` | `landscape` or `shorts` |
| `theme` | `light` or `dark` |
| `title` | YouTube title (≤100) |
| `description` | YouTube description (paste verbatim; also in the `.txt` sidecar) |
| `tags` | comma-separated YouTube tags (≤500 total) |
| `category` | `Education` |
| `visibility` | `public` (light) or `scheduled (+48h stagger)` (dark) — see §4 |
| `playlist` | the technique playlist to add it to |
| `made_for_kids` | `No` (set "Not made for kids") |
| `language` | `en` |
| `chapters` | `0:00 Intro; …` (landscape; YouTube auto-detects them from the description too) |
| `cta_url` | `https://deepbreathingexercises.com/breathe/<slug>` (in the description) |

> The `path` column is repo-relative for portability. To get the absolute path, prefix
> with `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/`.

Tip: the `.txt` sidecar next to each video is the cleanest paste source — line 1 = title, blank line, then the full description (chapters already embedded).

---

## 3. PHASE 1 — Create the channel

Follow `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/channel_setup.md`. Summary:
- **Name:** "Deep Breathing Exercises" (exact brand match). Handle `@deepbreathingexercises`.
- **Bio:** paste the ≤1000-char bio from that file.
- **Defaults for every upload:** Category **Education**, **Not made for kids**, language **en**.
- **Channel trailer / featured:** Box Breathing 5-min (light) →
  `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/box/landscape/box-light-landscape-5min.mp4`.
- Create the **playlists** listed in `channel_setup.md` (by technique, by use-case, by duration).

> Uploading needs a logged-in Google/YouTube session. If you have YouTube Data API
> credentials you can script `videos.insert`; otherwise drive YouTube Studio in a
> browser (claude-in-chrome). **Confirm the channel owner is signed in before the
> first irreversible upload.**

---

## 4. PHASE 2 — Upload the 60 videos

Process each manifest row: upload the file at
`/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/<path>`, set
`title`/`description`/`tags`, Category Education, Not-made-for-kids, language en,
add to `playlist`.

**Publish schedule (anti-cannibalization — already decided):**
- **`theme=light` → publish public** on its launch day.
- **`theme=dark` → schedule ~48h later** (staggered). Position dark as the "night/dark
  mode" variant in the same playlists, below the light one. This avoids two
  near-identical videos competing in search.

**Suggested day-by-day order** (from `channel_setup.md`; adjust freely):
- Mon: Box, Coherent, 4-7-8 — 5-min light + their Shorts (light) + channel trailer.
- Tue: Physiological Sigh, Belly — 5-min light + Shorts.
- Wed: dark variants of Mon's set.
- Thu: 1/2/10-min light variants across techniques.
- Fri: remaining dark variants; review CTR/retention; pin the best.

**Shorts:** titles already end with `#shorts`; upload the portrait (1440×2560) files from
`/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/<technique>/shorts/`.
No chapters on Shorts (correct).

**Chapters (landscape):** already in the description, so YouTube will render them
automatically. The `chapters` CSV column is a backup.

✅ **Done-check for Phase 2:** all 60 live or scheduled; **record each video's YouTube
ID** (you need them for Phase 3). Append a `youtube_id` column to a copy of the
manifest, or keep a `slug,theme,orientation,duration → youtube_id` map.

---

## 5. PHASE 3 — Push to the web (wire videos into the site + deploy)

The site already renders ONE embedded YouTube video per technique page (an `<iframe>`
+ a `VideoObject` schema for SEO). It's the `video` field on each entry in
`/Users/abi/Sites/deepbreathing-orb-render/src/data/breathing-pages.ts`:

```ts
video: {
  youtubeId: "XXXXXXXXXXX",
  title: "…",
  description: "…",
},
```

Rendered by `/Users/abi/Sites/deepbreathing-orb-render/src/app/breathe/pattern-page.tsx`
(iframe ~line 404, VideoObject schema ~line 185).

**Current state — IMPORTANT editorial decision:**
| technique | current `video` embed | note |
|---|---|---|
| box | `GZzhk9jEkkI` — Mark Divine (Navy SEAL) | high-authority third-party |
| coherent | `CMsFIEyITPc` — James Nestor | high-authority third-party |
| 4-7-8 | `YRPh_GaiL8s` — Dr. Andrew Weil | high-authority third-party |
| physiological-sigh | `kSZKIupBUuc` — Stanford/Huberman | high-authority third-party |
| belly | **none** | no video field at all |

These third-party embeds are real **E-E-A-T authority signals** (Weil, Nestor,
Huberman). **Do not blindly replace them.** Recommended approach:

1. **Belly:** add a `video` field pointing to **our** uploaded video
   (`belly-light-landscape-5min` → its YouTube ID). This is a pure win — belly has none today.
2. **box / coherent / 4-7-8 / physiological-sigh:** **keep the authority embed** and
   instead add our own guided-timer video as a *secondary* element (e.g. a "Practice
   along — 5-minute guided timer" card linking to the YouTube video, or a second embed
   below the authority one). If you (or the owner) prefer to own the embed+schema,
   you MAY swap in our video — but treat that as a deliberate authority trade-off, not a default.
   **Get owner sign-off before replacing any authority embed.**
3. For any field you set, reuse the YouTube title/description (or a page-appropriate variant).

**Other web touch-points to consider (optional, owner's call):**
- Add a "Watch on YouTube" / channel link in the site footer or `/breathe` index.
- The descriptions already drive YouTube→site (CTA to `/breathe/<slug>`); this closes the loop site→YouTube.

**Deploy:** this repo deploys on **Vercel**. After editing
`/Users/abi/Sites/deepbreathing-orb-render/src/data/breathing-pages.ts`:
```bash
cd /Users/abi/Sites/deepbreathing-orb-render
# make changes on a feature branch, commit, then:
vercel deploy            # preview first
vercel deploy --prod     # promote after verifying the preview
```
(Or merge the branch and let Vercel's git integration deploy.) **Pushing to `main`
and prod deploys require owner approval** per repo policy — confirm before promoting.
Verify the changed `/breathe/<slug>` pages render the new embed + that the VideoObject
schema validates (Rich Results Test).

---

## 6. PHASE 4 — Log the experiment

Per repo policy (`/Users/abi/Sites/deepbreathing-orb-render/CLAUDE.md` →
`/Users/abi/Sites/deepbreathing-orb-render/docs/PRODUCT-EXPERIMENTS.md`), add an entry
BEFORE/at launch with hypothesis + baseline + pre-committed success criteria, e.g.:
- **Hypothesis:** a YouTube channel of guided breathing timers drives qualified
  traffic + new sessions to deepbreathingexercises.com.
- **Baseline:** current organic sessions / referral from YouTube (≈0).
- **Success (pre-commit):** "Success if YouTube referral sessions ≥ X/week and
  assisted signups ≥ Y within 4 weeks." (Owner sets X/Y.)
- Set a measure-after date; mark 🔄 Implemented.

Also tick the remaining ROADMAP item in
`/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/ROADMAP.md` ("Manual upload")
once done.

---

## 7. Constraints, gotchas & how to regenerate

- **Irreversible / outward-facing:** channel creation, uploads, and prod deploys are
  public. Confirm owner authorization before each first-of-its-kind action.
- **Audio provenance:** beds were captured from the LOCAL hiss-fixed build (`:3031`,
  `dbe-audio-v2`), not production. If audio-v2 ships to prod and differs, re-capture (run from `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video`):
  ```bash
  bash scripts/capture_beds.sh
  node scripts/render_matrix.js
  node scripts/render_matrix.js --qa
  ```
- **Re-generate metadata only** (no re-render) after editing copy/keywords, from `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video`:
  ```bash
  node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-launch-package.mjs
  ```
- **Re-render is resumable:** `node scripts/render_matrix.js` skips any valid existing output.
- **Format note:** finals are full-range `yuvj420p` (Remotion-native, YouTube-OK). Don't "fix" this.
- **node_modules** at `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/node_modules`
  is a symlink to the sibling worktree — fine for running scripts; don't commit it.

---

## 8. Quick start for the agent

```bash
cd /Users/abi/Sites/deepbreathing-orb-render/tools/orb-video
cat out/launch/SUMMARY.md           # build report
cat out/launch/channel_setup.md     # channel name/bio/playlists
python3 -c "import csv;[print(r['filename'],'->',r['title']) for r in csv.DictReader(open('out/launch/upload_manifest.csv'))]"
ls out/launch/box/landscape/        # see the files + .txt paste sources
```
1. Phase 1: create channel from `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/out/launch/channel_setup.md`.
2. Phase 2: upload all 60 per the manifest; light public / dark +48h; capture YouTube IDs.
3. Phase 3: wire IDs into `/Users/abi/Sites/deepbreathing-orb-render/src/data/breathing-pages.ts` (belly first; ask before replacing authority embeds), deploy via Vercel.
4. Phase 4: log in `/Users/abi/Sites/deepbreathing-orb-render/docs/PRODUCT-EXPERIMENTS.md`; tick `/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video/ROADMAP.md`.

---

## 9. TikTok — vertical assets + manual upload

A separate, **vertical-first** package built from the same breathing-orb content.
TikTok is its own platform with a different metadata model — a **single caption**
(no title, no chapters), **hashtag-driven** discovery, and **no clickable links**
(link in bio only). The build is done; **upload is manual via TikTok Studio**
(the Content Posting API can't post publicly until a 2–4 week TikTok app audit).

### 9.1 What's built (the homework — DO NOT REDO)

✅ **15 vertical finals** — TikTok-native **1080×1920**, **light only**, **15s/30s/60s**:
- 5 techniques × {15s, 30s, 60s} = **15 finals** from **5 new masters**.
- Files: `out/launch/<technique>/tiktok/<technique>-light-tiktok-<dur>.mp4`
  (e.g. `out/launch/box/tiktok/box-light-tiktok-60s.mp4`).
- Masters: `out/_masters/<technique>_light_tiktok.mp4`.
- ✅ QA-verified: h264, 1080×1920, dur ±0.1s, AAC; 5/5 masters seam-safe.
- **60fps preserved** (smoother orb; TikTok accepts it — the generic "30fps"
  guidance is for talking-head footage, not this).

✅ **Stronger particle breath-coupling** — the live-web "draw-in on inhale / push-out
on exhale" effect is now clearly visible. `src/particles.ts` was changed from a weak
**additive** radial offset (~5% of screen) to a **multiplicative radial contraction**
of the whole field around center (`PULL=0.60` inhale draw-in → field shrinks to ~0.40×;
`PUSH=0.18` exhale push-out → ~1.18×). Still closed-form and seam-safe. **This is now
the default look for ANY future render** (incl. future YouTube re-renders — accepted).

✅ **Per-video caption package** (`scripts/launch/gen-tiktok-package.mjs`):
- `out/launch/<technique>/tiktok/<base>.caption.txt` — **paste-ready** caption + hashtags.
- `out/launch/tiktok_manifest.csv` — **15 rows**, cols: `filename, path, technique,
  duration, duration_seconds, theme, caption, hashtags, sound, cover_hint, privacy, cta_url`.
- `out/launch/tiktok_setup.md` — account/handle, Business/Creator note, bio + the one
  allowed link, posting cadence, original-audio note, safe-zone.
- Captions are front-loaded (the orb cue lands in the first ~120 visible chars), e.g.
  *"Steady your focus. Box breathing in 60 seconds. Inhale as the orb grows, hold,
  exhale as it shrinks. 🫧"* → blank line → *"Free guided timer + every technique —
  link in bio 🔗"* → hashtags. Hashtags (~8) seed the primary tag from `keywords.json`
  search volume (4-7-8 → `#478breathing`, sigh → `#physiologicalsigh`).

✅ **Safe-zone checked** — orb (~389px at center (540,960), spanning x≈345–735 / y≈765–1155)
and the centered label clear TikTok's right action rail (~right 120px), bottom
caption band (~bottom 20%), and top.

❌ **Not done (your job):** create/sign-in the TikTok account, upload the 15 videos,
set covers, set privacy. **No re-render of the 60 YouTube finals** (intentionally left
as-is; the particle change only applies to the new tiktok renders on disk).

### 9.2 Manual upload via TikTok Studio

1. **Account:** `@deepbreathingexercises` (fallback `@breathingorb`). Switch to a
   **Business** (or Creator) account to unlock the clickable bio link. Set bio + the
   one allowed link to `https://deepbreathingexercises.com` (see `tiktok_setup.md`).
2. **Per video** (one row of `tiktok_manifest.csv`): upload
   `out/launch/<technique>/tiktok/<file>`, paste the matching `.caption.txt`
   (caption + hashtags) into the single caption field, keep **original sound**
   (the baked ambient bed — no trending-sound swap for this calm niche), and set the
   **cover** by scrubbing to the `cover_hint` second (first inhale peak, orb largest).
3. **Privacy:** owner sets Public/Private at upload (no auto-post).
4. **Cadence:** 1–2/day; lead with **Box** and **Physiological Sigh** (highest intent).
   No clickable links in captions — all traffic goes through the **link in bio**.

### 9.3 Regenerate / re-render (TikTok)

```bash
cd /Users/abi/Sites/deepbreathing-orb-render/tools/orb-video
# Re-render TikTok finals only (resumable; skips YouTube + valid tiktok files):
node scripts/render_matrix.js --only box      # one technique
node scripts/render_matrix.js                 # all (skips already-built cells)
node scripts/render_matrix.js --qa            # ffprobe + seam QA (all orients)
# Re-generate captions/manifest only (no re-render), after editing copy/keywords:
node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-tiktok-package.mjs
```
To tune the particle pulse, edit `PULL`/`PUSH` in `src/particles.ts` and re-render.
