// gen-tiktok-package.mjs — TikTok metadata + manual-upload package.
//
// TikTok's metadata model differs from YouTube: ONE caption (no separate title,
// no chapters), hashtag-driven discovery, and no clickable links (link in bio
// only). This generator iterates 5 techniques × light × {15s,30s,60s} = 15
// vertical (1080×1920) finals and writes, per video, a paste-ready caption +
// hashtags, plus a manifest CSV and a manual-upload setup doc.
//
// Run with the @/-alias loader (same as gen-launch-package.mjs):
//   node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-tiktok-package.mjs
//
// Search volumes (out/launch/keywords.json) seed the primary technique hashtag
// when present; the generator degrades gracefully to the curated set if absent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { breathingPageMap } from "@/data/breathing-pages.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../.."); // scripts/launch -> scripts -> tools/orb-video
const LAUNCH = path.join(ROOT, "out/launch");
const KEYWORDS_FILE = path.join(LAUNCH, "keywords.json");
const SITE = "https://deepbreathingexercises.com";

// ---- matrix config (must match render_matrix.js tiktok orient + filename contract) ----
// orb: the on-screen breath cue, matched to each pattern's phases.
// hook: a short, punchy lead derived from the page hero.subtitle / first benefit.
// peakSec: when the orb is first at full size (inhale peak) — the TikTok cover frame.
// hashtags: curated TikTok set; the primary tag is re-seeded from keywords.json below.
const TECHNIQUES = [
  {
    slug: "box", display: "Box Breathing", captionName: "Box breathing",
    hook: "Steady your focus.", orb: "Inhale as the orb grows, hold, exhale as it shrinks.",
    peakSec: 4,
    hashtags: ["#boxbreathing", "#breathwork", "#anxietyrelief", "#stressrelief", "#calm", "#breathingexercise", "#nervoussystem"],
  },
  {
    slug: "coherent", display: "Coherent Breathing", captionName: "Coherent breathing",
    hook: "Settle your system.", orb: "Inhale as the orb grows, exhale as it shrinks.",
    peakSec: 5.5,
    hashtags: ["#coherentbreathing", "#resonancebreathing", "#breathwork", "#hrv", "#calm", "#stressrelief", "#nervoussystem"],
  },
  {
    slug: "4-7-8", display: "4-7-8 Breathing", captionName: "4-7-8 breathing",
    hook: "Wind down fast.", orb: "Inhale as the orb grows, hold, exhale slowly as it shrinks.",
    peakSec: 4,
    hashtags: ["#478breathing", "#breathwork", "#sleep", "#fallasleep", "#anxietyrelief", "#calm", "#breathingexercise"],
  },
  {
    slug: "physiological-sigh", display: "Physiological Sigh", captionName: "Physiological sigh",
    hook: "Calm fast.", orb: "Two quick inhales as the orb grows, then a long exhale as it shrinks.",
    peakSec: 4,
    hashtags: ["#physiologicalsigh", "#breathwork", "#stressrelief", "#anxietyrelief", "#calm", "#nervoussystem", "#breathingexercise"],
  },
  {
    slug: "belly", display: "Belly Breathing", captionName: "Belly breathing",
    hook: "Breathe deeper.", orb: "Inhale into your belly as the orb grows, exhale as it shrinks.",
    peakSec: 4,
    hashtags: ["#bellybreathing", "#diaphragmaticbreathing", "#breathwork", "#stressrelief", "#calm", "#relaxation", "#nervoussystem"],
  },
];
const THEME = "light";
const ORIENT = "tiktok";
const DURATIONS = [["15s", 15], ["30s", 30], ["60s", 60]];
const DUR_HUMAN = { 15: "15 seconds", 30: "30 seconds", 60: "60 seconds" };

// ---- helpers (mirrors gen-launch-package.mjs) ----
const keywords = fs.existsSync(KEYWORDS_FILE) ? JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf8")) : {};
function kwBase(slug) {
  const k = keywords[slug];
  if (!k) return [];
  return [...(k._base || [])].sort((a, b) => (b.volume || 0) - (a.volume || 0));
}
function toHashtag(kw) {
  return "#" + String(kw).toLowerCase().replace(/[^a-z0-9]/g, "");
}
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Seed the primary hashtag from the highest-volume keyword, then dedupe to a
// 6–8 tag set with #fyp pinned last for the calm/breathwork niche.
function buildHashtags(t) {
  const primary = kwBase(t.slug).length ? toHashtag(kwBase(t.slug)[0].keyword) : t.hashtags[0];
  const seen = new Set();
  const core = [];
  for (const tag of [primary, ...t.hashtags]) {
    if (!seen.has(tag)) { seen.add(tag); core.push(tag); }
  }
  return [...core.slice(0, 7), "#fyp"];
}

function buildCaption(t, durSec) {
  const durHuman = DUR_HUMAN[durSec];
  // Front-loaded first paragraph: hook + technique + duration + the orb cue (the
  // most important part, kept inside the first ~120 visible chars), then the CTA.
  const body =
    `${t.hook} ${t.captionName} in ${durHuman}. ${t.orb} 🫧` +
    `\n\nFree guided timer + every technique — link in bio 🔗`;
  return body;
}

// ---- main ----
fs.mkdirSync(LAUNCH, { recursive: true });
const rows = [];
const issues = [];
let count = 0;

for (const t of TECHNIQUES) {
  const page = breathingPageMap[t.slug];
  if (!page) { issues.push(`MISSING page for ${t.slug}`); continue; }
  const hashtags = buildHashtags(t);
  const hashtagStr = hashtags.join(" ");
  for (const [durLabel, durSec] of DURATIONS) {
    const base = `${t.slug}-${THEME}-${ORIENT}-${durLabel}`;
    const file = `${base}.mp4`;
    const relPath = `out/launch/${t.slug}/${ORIENT}/${file}`;
    const caption = buildCaption(t, durSec);
    const captionTxt = `${caption}\n\n${hashtagStr}\n`;
    const coverHint = `~${t.peakSec}s (first inhale peak — orb largest)`;
    const ctaUrl = `${SITE}/breathe/${t.slug}`;
    const sound = "Original audio (baked ambient bed)";
    const privacy = "owner-set at upload (Public/Private)";

    // validations
    if (captionTxt.length > 2200) issues.push(`CAPTION >2200 (${captionTxt.length}): ${base}`);
    if (hashtags.length < 6 || hashtags.length > 8) issues.push(`HASHTAGS ${hashtags.length} (want 6–8): ${base}`);

    // per-video paste-ready caption (caption + hashtags)
    const dir = path.join(LAUNCH, t.slug, ORIENT);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${base}.caption.txt`), captionTxt);

    rows.push([
      file, relPath, t.display, durLabel, durSec, THEME, caption, hashtagStr,
      sound, coverHint, privacy, ctaUrl,
    ]);
    count++;
  }
}

// manifest
const header = ["filename", "path", "technique", "duration", "duration_seconds", "theme",
  "caption", "hashtags", "sound", "cover_hint", "privacy", "cta_url"];
const csv = [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(LAUNCH, "tiktok_manifest.csv"), csv);

// setup doc
writeSetup();

console.log(`Generated ${count} TikTok caption sidecars (.caption.txt).`);
console.log(`Manifest: out/launch/tiktok_manifest.csv (${rows.length} rows).`);
console.log(`Hashtag seed: ${Object.keys(keywords).length ? "keywords.json (search volumes)" : "curated fallback"}.`);
if (issues.length) { console.log(`\nVALIDATION ISSUES (${issues.length}):`); issues.forEach((i) => console.log("  - " + i)); }
else console.log("All TikTok checks passed (captions ≤2200, 6–8 hashtags each).");

function writeSetup() {
  const md = `# TikTok Setup — Deep Breathing Exercises

_Manual upload via TikTok Studio. The Content Posting API can't post publicly
until a 2–4 week TikTok app audit, so launch is hand-uploaded._

## Account
- **Handle:** \`@deepbreathingexercises\` _(fallback: \`@breathingorb\`)_
- **Display name:** Deep Breathing Exercises
- **Account type:** switch to a **Business** or **Creator** account (Settings →
  Account → Switch to Business/Creator). Business unlocks the clickable bio link
  and basic analytics; Creator gives a slightly wider trending-sound library
  (not needed here — see Audio).

## Bio (≤80 chars) + the one allowed link
> Free guided breathing timers 🫧 Follow the orb. Inhale, hold, exhale.

**Bio link (the only clickable link on TikTok):** \`${SITE}\`
TikTok blocks links in captions, so every caption ends with "link in bio 🔗" and
the bio link carries all traffic. (Per-technique deep links live in each video's
\`cta_url\`; point the bio link at the homepage, or rotate it to the technique
you're pushing that day.)

## Audio — original, no trending sound
Every clip ships with its **original baked ambient bed** (the same calming audio
as the YouTube masters). This calm/breathwork niche does NOT need a trending
sound — a trending pop track would break the mood and the guided pacing. Keep
"original sound" and do not swap. (60fps is preserved; TikTok accepts it — the
generic "30fps" guidance doesn't apply.)

## Posting cadence
- **1–2 posts/day.** Lead with **Box Breathing** and the **Physiological Sigh**
  (highest-intent, most-searched: stress/anxiety relief).
- Mix durations: a 15s or 30s clip as the daily hook, a 60s for watch-time.
- Suggested first week (one technique's 30s + 60s per day):
  Mon Box · Tue Physiological Sigh · Wed 4-7-8 · Thu Coherent · Fri Belly,
  then repeat with 15s cuts and alternate captions.

## Safe zone (vertical 1080×1920)
TikTok overlays a **right action rail** (~right 120px: like/comment/share/profile)
and the **bottom ~20%** (caption, handle, music ticker). The orb is centered
(~389px diameter at (540,960), spanning x≈345–735 / y≈765–1155) and the phase
label is centered — both clear the rail and the bottom band. Don't add text or
key visuals in the right 120px or the bottom 20%.

## Per-video assets
- \`out/launch/<slug>/tiktok/<base>.caption.txt\` — paste-ready caption + hashtags.
- \`out/launch/tiktok_manifest.csv\` — one row per video (filename, path, caption,
  hashtags, sound, cover hint, privacy, cta_url).
- **Cover:** scrub to each video's \`cover_hint\` second (the first inhale peak,
  orb largest) and set it as the cover for a strong, on-brand thumbnail.

## Upload defaults (every video)
- Privacy: **owner sets at upload** (Public to launch; Private/Friends to stage).
- Allow comments / Duet / Stitch: owner's call (Duet/Stitch on can aid reach).
- Disclose content / AI: not applicable.
`;
  fs.writeFileSync(path.join(LAUNCH, "tiktok_setup.md"), md);
}
