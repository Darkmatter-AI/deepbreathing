# YouTube Launch — Publish Handoff

**For:** a Claude cowork agent picking up the upload + web-publish work.
**Status:** all assets are **built, QA'd, and approved**. Nothing is uploaded yet
(no channel existed at build time — uploading is irreversible, so it was left manual).
Your job is **Phases 1–4 below**: create the channel, upload the 60 videos, wire
the resulting YouTube IDs back into the website, and log the experiment.

> Read `out/launch/SUMMARY.md` first — it's the build report. This file is the
> action plan.

---

## 0. Where everything lives

All paths are relative to the orb-video tool dir:

```
/Users/abi/Sites/deepbreathing-orb-render/tools/orb-video
```

This is an isolated git worktree on branch `chore/orb-video-launch-assets`. The
**website source** (the Next.js app you'll deploy in Phase 3) is the SAME worktree's
root: `/Users/abi/Sites/deepbreathing-orb-render` (it shares the repo; the live site
is `deepbreathingexercises.com`, deployed on Vercel).

> ⚠️ The video assets are **local-only and gitignored** (`out/` = 5.7 GB). They are
> NOT in git and NOT on any remote. If you run on a different machine, the assets
> must be copied first (Drive/bucket). On this machine they're already in place.

### The package — `out/launch/`
```
out/launch/
├── upload_manifest.csv          ← SOURCE OF TRUTH for uploads (60 rows, one per video)
├── channel_setup.md             ← channel name, bio, playlists, launch cadence
├── keywords.json                ← DataForSEO search volumes (reference)
├── SUMMARY.md                   ← build report + QA results
├── sample-particles-box-*.png   ← look reference (already approved)
├── render.log                   ← build log
└── <technique>/
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

---

## 1. What's already done (the homework) — DO NOT REDO

✅ **Rendered & QA-verified** (`node scripts/render_matrix.js --qa`):
- 60/60 finals pass ffprobe (h264, 8-bit 4:2:0, correct resolution, duration ±0.1s, AAC audio).
- 20/20 masters are seam-safe (loop join is invisible — verified by frame diff).
- Clean audio baked in. 5/5 beds hiss-fixed, no clipping (the drone-static fix is in).

✅ **Per-video metadata generated** (`scripts/launch/gen-launch-package.mjs`):
- Titles (all ≤100 chars), descriptions, tags (all ≤500 chars), chapters
  (landscape only: first 00:00, ≥3, ≥10s spacing), built from the live site
  editorial copy in `src/data/breathing-pages.ts`.
- Real search-volume keywords baked into titles/tags (box breathing 49.5k,
  diaphragmatic breathing 40.5k, 4-7-8 14.8k, etc.).

✅ **Channel copy** drafted in `channel_setup.md` (name, ≤1000-char bio, playlists, cadence).

✅ **Look approved** — the closed-form particle motion + light/dark themes were signed off.

❌ **Not done (your job):** create the channel, upload, set publish schedule, wire
videos into the site, deploy, log the experiment. **No thumbnails were made** (out of scope).

---

## 2. The manifest — your upload source of truth

`out/launch/upload_manifest.csv`, 60 rows. It's RFC-4180 (descriptions contain
quoted newlines — parse with a real CSV reader / Sheets / `python -c "import csv"`,
**not** `wc -l`). Columns:

| column | use |
|---|---|
| `filename` | the .mp4 to upload |
| `path` | its location under the repo (`out/launch/...`) |
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

Tip: the `.txt` sidecar next to each video is the cleanest paste source — line 1 = title, blank line, then the full description (chapters already embedded).

---

## 3. PHASE 1 — Create the channel

Follow `out/launch/channel_setup.md`. Summary:
- **Name:** "Deep Breathing Exercises" (exact brand match). Handle `@deepbreathingexercises`.
- **Bio:** paste the ≤1000-char bio from that file.
- **Defaults for every upload:** Category **Education**, **Not made for kids**, language **en**.
- **Channel trailer / featured:** Box Breathing 5-min (light) → `out/launch/box/landscape/box-light-landscape-5min.mp4`.
- Create the **playlists** listed in `channel_setup.md` (by technique, by use-case, by duration).

> Uploading needs a logged-in Google/YouTube session. If you have YouTube Data API
> credentials you can script `videos.insert`; otherwise drive YouTube Studio in a
> browser (claude-in-chrome). **Confirm the channel owner is signed in before the
> first irreversible upload.**

---

## 4. PHASE 2 — Upload the 60 videos

Process each manifest row: upload `path`, set `title`/`description`/`tags`, Category
Education, Not-made-for-kids, language en, add to `playlist`.

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

**Shorts:** titles already end with `#shorts`; upload portrait (1440×2560) ones from
`<technique>/shorts/`. No chapters on Shorts (correct).

**Chapters (landscape):** already in the description, so YouTube will render them
automatically. The `chapters` CSV column is a backup.

✅ **Done-check for Phase 2:** all 60 live or scheduled; **record each video's YouTube
ID** (you need them for Phase 3). Append a `youtube_id` column to a copy of the
manifest, or keep a `slug,theme,orientation,duration → youtube_id` map.

---

## 5. PHASE 3 — Push to the web (wire videos into the site + deploy)

The site already renders ONE embedded YouTube video per technique page (an `<iframe>`
+ a `VideoObject` schema for SEO). It's the `video` field on each entry in
`src/data/breathing-pages.ts`:

```ts
video: {
  youtubeId: "XXXXXXXXXXX",
  title: "…",
  description: "…",
},
```

Rendered by `src/app/breathe/pattern-page.tsx` (iframe ~line 404, VideoObject schema ~line 185).

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

**Deploy:** this repo deploys on **Vercel**. After editing `breathing-pages.ts`:
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

Per repo policy (`CLAUDE.md` → `docs/PRODUCT-EXPERIMENTS.md`), add an entry BEFORE/at
launch with hypothesis + baseline + pre-committed success criteria, e.g.:
- **Hypothesis:** a YouTube channel of guided breathing timers drives qualified
  traffic + new sessions to deepbreathingexercises.com.
- **Baseline:** current organic sessions / referral from YouTube (≈0).
- **Success (pre-commit):** "Success if YouTube referral sessions ≥ X/week and
  assisted signups ≥ Y within 4 weeks." (Owner sets X/Y.)
- Set a measure-after date; mark 🔄 Implemented.

Also tick the remaining ROADMAP item in `tools/orb-video/ROADMAP.md` ("Manual upload")
once done.

---

## 7. Constraints, gotchas & how to regenerate

- **Irreversible / outward-facing:** channel creation, uploads, and prod deploys are
  public. Confirm owner authorization before each first-of-its-kind action.
- **Audio provenance:** beds were captured from the LOCAL hiss-fixed build (`:3031`,
  `dbe-audio-v2`), not production. If audio-v2 ships to prod and differs, re-capture:
  `bash scripts/capture_beds.sh && node scripts/render_matrix.js && node scripts/render_matrix.js --qa`.
- **Re-generate metadata only** (no re-render) after editing copy/keywords:
  `node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-launch-package.mjs`
- **Re-render is resumable:** `node scripts/render_matrix.js` skips any valid existing output.
- **Format note:** finals are full-range `yuvj420p` (Remotion-native, YouTube-OK). Don't "fix" this.
- **node_modules** in `tools/orb-video` is a symlink to the sibling worktree — fine for
  running scripts; don't commit it.

---

## 8. Quick start for the agent

```bash
cd /Users/abi/Sites/deepbreathing-orb-render/tools/orb-video
cat out/launch/SUMMARY.md           # build report
cat out/launch/channel_setup.md     # channel name/bio/playlists
column -s, -t < out/launch/upload_manifest.csv | less -S   # (rough view; use a real CSV parser for descriptions)
ls out/launch/box/landscape/        # see the files + .txt paste sources
```
1. Phase 1: create channel from `channel_setup.md`.
2. Phase 2: upload all 60 per the manifest; light public / dark +48h; capture YouTube IDs.
3. Phase 3: wire IDs into `src/data/breathing-pages.ts` (belly first; ask before replacing authority embeds), deploy via Vercel.
4. Phase 4: log in `docs/PRODUCT-EXPERIMENTS.md`; tick `ROADMAP.md`.
