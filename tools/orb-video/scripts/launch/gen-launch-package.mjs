// gen-launch-package.mjs — Part B2 of the YouTube launch package.
//
// Imports the live editorial copy from the app (breathing-pages.ts via the
// @/-alias loader), applies templates, and writes for every one of the 60 final
// videos: a structured JSON sidecar + a paste-ready .txt description, plus
// out/launch/upload_manifest.csv and out/launch/channel_setup.md.
//
// Run:
//   node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-launch-package.mjs
//
// Ahrefs keyword volumes (out/launch/keywords.json) are used when present and
// the generator degrades gracefully to static benefit copy when they're absent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { breathingPageMap } from "@/data/breathing-pages.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../.."); // scripts/launch -> scripts -> tools/orb-video
const LAUNCH = path.join(ROOT, "out/launch");
const KEYWORDS_FILE = path.join(LAUNCH, "keywords.json");
const SITE = "https://deepbreathingexercises.com";

// ---- matrix config (must match render_matrix.js filename contract) ----
const TECHNIQUES = [
  { slug: "box", short: "Box", display: "Box Breathing", timer: "Box Breathing Timer",
    color: "#e11d48", benefitTail: "Navy SEAL Calm & Focus", tailExclude: "box" },
  { slug: "coherent", short: "Coherent", display: "Coherent Breathing", timer: "Coherent Breathing Timer",
    color: "#059669", benefitTail: "5.5s Resonance for HRV", tailExclude: "coherent" },
  { slug: "4-7-8", short: "4-7-8", display: "4-7-8 Breathing", timer: "4-7-8 Breathing Timer",
    color: "#4f46e5", benefitTail: "Fall Asleep Faster", tailExclude: "4-7-8" },
  { slug: "physiological-sigh", short: "Physiological Sigh", display: "Physiological Sigh", timer: "Physiological Sigh Timer",
    color: "#0ea5e9", benefitTail: "Instant Stress Relief", tailExclude: "physiological" },
  { slug: "belly", short: "Belly", display: "Belly Breathing", timer: "Belly Breathing Timer",
    color: "#f59e0b", benefitTail: "Diaphragmatic Calm", tailExclude: "belly" },
];
const THEMES = ["light", "dark"];
const ORIENTS = {
  landscape: { durations: [["1min", 60], ["2min", 120], ["5min", 300], ["10min", 600]] },
  shorts: { durations: [["30s", 30], ["60s", 60]] },
};

const DUR_DISPLAY = { 30: "30 Seconds", 60: "60 Seconds", 120: "2 Minutes", 300: "5 Minutes", 600: "10 Minutes" };
function landscapeDurDisplay(sec) { return sec === 60 ? "1 Minute" : DUR_DISPLAY[sec]; }

// ---- helpers ----
const keywords = fs.existsSync(KEYWORDS_FILE) ? JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf8")) : {};
function kwBucket(slug, durLabel) {
  const k = keywords[slug];
  if (!k) return [];
  const bucket = k[durLabel] || [];
  return [...bucket].sort((a, b) => (b.volume || 0) - (a.volume || 0));
}
function kwBase(slug) {
  const k = keywords[slug];
  if (!k) return [];
  return [...(k._base || [])].sort((a, b) => (b.volume || 0) - (a.volume || 0));
}

function stripMd(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
    .replace(/\s+/g, " ")
    .trim();
}
function tsFmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function clampLen(s, n) { return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…"; }

// ---- titles ----
function makeTitle(t, orient, durLabel, durSec) {
  if (orient === "shorts") {
    return `${t.short === "Physiological Sigh" ? "Physiological Sigh" : t.display} in ${DUR_DISPLAY[durSec]} #shorts`;
  }
  const dd = landscapeDurDisplay(durSec);
  const head = `${t.timer} — ${dd}`;
  // pick highest-volume keyword tail that adds a distinct term (not a repeat of
  // the technique name already in the head) and keeps the whole title <= 100
  const kwCands = [...kwBucket(t.slug, durLabel), ...kwBase(t.slug)]
    .filter((x) => x.volume > 0)
    .map((x) => x.keyword)
    .filter((k) => !k.toLowerCase().includes(t.tailExclude));
  const candidates = [...kwCands, t.benefitTail];
  for (const tail of candidates) {
    const tailCased = tail.replace(/\b\w/g, (c) => c.toUpperCase());
    const full = `${head} | ${tailCased}`;
    if (full.length <= 100) return full;
  }
  return clampLen(head, 100);
}

// ---- chapters (landscape only) ----
function makeChapters(t, durSec) {
  const raw = [[0, "Intro & Posture"]];
  const startT = Math.max(10, Math.round(durSec * 0.08));
  raw.push([startT, `${t.short} Breathing Begins`]);
  if (durSec >= 240) raw.push([Math.round(durSec * 0.5), "Midpoint — Settle Deeper"]);
  raw.push([Math.min(Math.round(durSec * 0.9), durSec - 10), "Wind-Down & Close"]);
  // enforce: sorted, first==0, each >= prev+10, last <= durSec-10
  const out = [];
  for (const [sec, label] of raw.sort((a, b) => a[0] - b[0])) {
    if (sec > durSec - 10 && out.length) continue;
    if (!out.length || sec >= out[out.length - 1][0] + 10) out.push([sec, label]);
  }
  return out; // [[sec,label],...]  (>=3 guaranteed for our durations)
}

// ---- tags (<=500 chars total) ----
function makeTags(t, page, orient, durLabel, durSec) {
  const seen = new Set();
  const add = (arr, list) => { for (const x of list) { const v = String(x).trim().toLowerCase(); if (v && !seen.has(v)) { seen.add(v); arr.push(v); } } };
  const tags = [];
  add(tags, page.keywords || []);
  add(tags, page.synonyms || []);
  add(tags, kwBase(t.slug).map((x) => x.keyword));
  add(tags, kwBucket(t.slug, durLabel).map((x) => x.keyword));
  const dd = orient === "shorts" ? DUR_DISPLAY[durSec] : landscapeDurDisplay(durSec);
  add(tags, [
    "breathing timer", "guided breathing", "breathe with me", "breathing exercise",
    "meditation timer", "relaxation", "stress relief", "calm", "mindfulness",
    `${t.short.toLowerCase()} breathing ${dd.toLowerCase()}`,
  ]);
  if (orient === "shorts") add(tags, ["shorts", "breathing shorts", "60 second meditation"]);
  // cap so the actual ", "-joined string is <= 500 chars
  const capped = [];
  for (const tag of tags) {
    const next = capped.concat(tag).join(", ");
    if (next.length > 500) break;
    capped.push(tag);
  }
  return capped;
}

// ---- description ----
function bodySection(page, headingIncludes) {
  const s = (page.body || []).find((b) => b.heading.toLowerCase().includes(headingIncludes));
  return s ? stripMd(s.content) : "";
}

function makeDescription(t, page, orient, durLabel, durSec, chapters) {
  const url = `${SITE}/breathe/${t.slug}`;
  const dd = orient === "shorts" ? DUR_DISPLAY[durSec] : landscapeDurDisplay(durSec);
  const L = [];

  // Hook (kw-first, above the fold) + CTA
  const topKw = (kwBucket(t.slug, durLabel)[0] || kwBase(t.slug)[0] || {}).keyword;
  const hookLead = topKw ? `${topKw.replace(/\b\w/g, (c) => c.toUpperCase())}. ` : "";
  L.push(`${hookLead}${stripMd(page.hero.intro)}`);
  L.push("");
  L.push(`▶ Practice along with the free interactive timer: ${url}`);
  L.push("");

  if (orient === "landscape" && chapters?.length) {
    L.push("⏱ CHAPTERS");
    for (const [sec, label] of chapters) L.push(`${tsFmt(sec)} ${label}`);
    L.push("");
  } else {
    L.push(`A ${dd.toLowerCase()} guided ${t.display.toLowerCase()} session — follow the orb: expand to inhale, contract to exhale.`);
    L.push("");
  }

  const what = bodySection(page, "what it is");
  if (what) { L.push(`WHAT IS ${t.display.toUpperCase()}?`); L.push(what); L.push(""); }

  if ((page.benefits || []).length) {
    L.push("BENEFITS");
    for (const b of page.benefits) L.push(`• ${b.title} — ${stripMd(b.description)}`);
    L.push("");
  }

  if (page.howTo && (page.howTo.steps || []).length) {
    L.push(`HOW TO DO ${t.display.toUpperCase()}`);
    page.howTo.steps.forEach((s, i) => L.push(`${i + 1}. ${s.name}: ${stripMd(s.instruction)}${s.duration ? ` (${s.duration})` : ""}`));
    L.push("");
  }

  if (page.frequency) { L.push("HOW OFTEN"); L.push(stripMd(page.frequency)); L.push(""); }

  // Science: lineage + studies
  if (page.lineage || (page.research && page.research.studies?.length)) {
    L.push("THE SCIENCE");
    if (page.lineage) L.push(stripMd(page.lineage));
    for (const st of (page.research?.studies || []).slice(0, 4)) {
      L.push(`• ${stripMd(st.title)} — ${stripMd(st.summary)}${st.url ? ` ${st.url}` : ""}`);
    }
    L.push("");
  }

  if (page.research && (page.research.safety || []).length) {
    L.push("SAFETY");
    for (const s of page.research.safety) L.push(`• ${stripMd(s)}`);
    L.push("");
  }

  const faq = (page.voiceSearch && page.voiceSearch.length)
    ? page.voiceSearch.map((q) => [q.question, q.answer])
    : (page.faqs || []).map((q) => [q.question, q.answer]);
  if (faq.length) {
    L.push("FREQUENTLY ASKED QUESTIONS");
    for (const [q, a] of faq.slice(0, 6)) { L.push(`Q: ${stripMd(q)}`); L.push(`A: ${stripMd(a)}`); L.push(""); }
  }

  if ((page.related || []).length) {
    L.push("MORE BREATHING SESSIONS");
    for (const r of page.related.slice(0, 5)) {
      const rp = breathingPageMap[r.slug];
      const name = rp ? rp.hero.title.replace(/ (Visualizer|Trainer|Timer).*$/i, "") : r.slug;
      L.push(`• ${name}: ${SITE}/breathe/${r.slug}`);
    }
    L.push("");
  }

  L.push(`▶ Free breathing timers, all techniques: ${url}`);
  const techHash = "#" + t.slug.replace(/-/g, "");
  L.push(`#breathing ${techHash} #meditation${orient === "shorts" ? " #shorts" : ""}`);

  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---- CSV ----
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---- main ----
fs.mkdirSync(LAUNCH, { recursive: true });
const rows = [];
let count = 0;
const issues = [];

for (const t of TECHNIQUES) {
  const page = breathingPageMap[t.slug];
  if (!page) { issues.push(`MISSING page for ${t.slug}`); continue; }
  for (const theme of THEMES) {
    for (const orient of Object.keys(ORIENTS)) {
      for (const [durLabel, durSec] of ORIENTS[orient].durations) {
        const base = `${t.slug}-${theme}-${orient}-${durLabel}`;
        const file = `${base}.mp4`;
        const relPath = `out/launch/${t.slug}/${orient}/${file}`;
        const title = makeTitle(t, orient, durLabel, durSec);
        const chapters = orient === "landscape" ? makeChapters(t, durSec) : [];
        const description = makeDescription(t, page, orient, durLabel, durSec, chapters);
        const tags = makeTags(t, page, orient, durLabel, durSec);
        const tagsStr = tags.join(", ");
        const chaptersStr = chapters.map(([s, l]) => `${tsFmt(s)} ${l}`).join("; ");
        const ctaUrl = `${SITE}/breathe/${t.slug}`;
        const visibility = theme === "light" ? "public" : "scheduled (+48h stagger)";
        const playlist = t.display;

        // validations
        if (title.length > 100) issues.push(`TITLE >100 (${title.length}): ${base}`);
        if (tagsStr.length > 500) issues.push(`TAGS >500 (${tagsStr.length}): ${base}`);
        if (orient === "shorts" && !/#shorts/.test(title)) issues.push(`SHORTS missing #shorts: ${base}`);
        if (orient === "landscape" && chapters.length < 3) issues.push(`CHAPTERS <3: ${base}`);
        if (orient === "landscape") {
          if (chapters[0][0] !== 0) issues.push(`CHAPTER first != 0:00: ${base}`);
          for (let i = 1; i < chapters.length; i++) if (chapters[i][0] - chapters[i - 1][0] < 10) issues.push(`CHAPTER spacing <10s: ${base}`);
        }

        const struct = {
          file, path: relPath, technique: t.display, slug: t.slug,
          orientation: orient, duration: durLabel, duration_seconds: durSec, theme,
          title, tags, chapters: chapters.map(([s, l]) => ({ time: tsFmt(s), seconds: s, label: l })),
          category: "Education", visibility, playlist, made_for_kids: "No", language: "en",
          cta_url: ctaUrl, description,
        };
        const dir = path.join(LAUNCH, t.slug, orient);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(struct, null, 2));
        fs.writeFileSync(path.join(dir, `${base}.txt`), `${title}\n\n${description}\n`);

        rows.push([
          file, relPath, t.display, durLabel, durSec, orient, theme, title, description,
          tagsStr, "Education", visibility, playlist, "No", "en", chaptersStr, ctaUrl,
        ]);
        count++;
      }
    }
  }
}

// manifest
const header = ["filename", "path", "technique", "duration", "duration_seconds", "orientation", "theme",
  "title", "description", "tags", "category", "visibility", "playlist", "made_for_kids", "language", "chapters", "cta_url"];
const csv = [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(LAUNCH, "upload_manifest.csv"), csv);

// channel_setup.md
writeChannelSetup();

console.log(`Generated ${count} video metadata sidecars (.json + .txt).`);
console.log(`Manifest: out/launch/upload_manifest.csv (${rows.length} rows).`);
console.log(`Keywords source: ${Object.keys(keywords).length ? "Ahrefs keywords.json" : "static fallback (no keywords.json)"}.`);
if (issues.length) { console.log(`\nVALIDATION ISSUES (${issues.length}):`); issues.forEach((i) => console.log("  - " + i)); }
else console.log("All YouTube limit checks passed (titles <=100, tags <=500, chapters valid, shorts tagged).");

function writeChannelSetup() {
  const md = `# YouTube Channel Setup — Deep Breathing Exercises

_Generated for the Monday launch. Manual setup; no auto-upload._

## Channel name (brand-match first)
1. **Deep Breathing Exercises** _(recommended — exact brand match to deepbreathingexercises.com)_
2. Deep Breathing Exercises — Guided Timers
3. DeepBreathingExercises.com
4. The Breathing Orb

Handle: **@deepbreathingexercises** (fallback: @breathingorb)

## Channel bio (≤1000 chars)
Free, guided breathing timers you can follow with your eyes closed — just watch (or listen to) the orb: it expands as you inhale and contracts as you exhale, with clean, calming audio.

Every session is built on a real technique: Box Breathing (the Navy SEAL 4-4-4-4 reset), Coherent Breathing (5.5-second resonance for HRV), 4-7-8 Breathing (wind down and fall asleep), the Physiological Sigh (the fastest way to defuse a stress spike), and Belly Breathing (the diaphragmatic foundation for all of it).

Pick a length — 1, 2, 5, or 10 minutes — and breathe. Use them before a meeting, between tasks, during a panic spike, or in bed when your mind won't switch off. Shorts give you a 30–60 second reset on the go.

Everything here is free and ad-light, and mirrors the interactive trainer at deepbreathingexercises.com, where you can practice along, adjust the pace, and read the science behind each pattern.

Subscribe and breathe with us. New sessions and techniques added regularly.
→ deepbreathingexercises.com

## Featured / channel trailer
**Box Breathing Timer — 5 Minutes (light)** — strongest brand+search match; pin as the channel spotlight.

## Playlists
**By technique**
${TECHNIQUES.map((t) => `- ${t.display} — all lengths (1/2/5/10 min + Shorts)`).join("\n")}

**By use-case**
- Anxiety & Panic Relief (Box, Physiological Sigh)
- Sleep & Wind-Down (4-7-8, Coherent)
- Focus & Reset (Box, Belly)
- 60-Second Resets (all Shorts)

**By duration**
- 1-Minute Breathing Timers
- 2-Minute Breathing Timers
- 5-Minute Breathing Timers
- 10-Minute Breathing Timers

## Anti-cannibalization: light public / dark staggered
Each technique×duration is rendered in **light** and **dark**. Publishing both at once would split watch-time and pit near-identical videos against each other in search.

- **Light = public on launch.** Light is the hero/brand look and the channel default.
- **Dark = scheduled ~48h later** (staggered), positioned as "Dark Mode / night" variants and slotted into the same playlists below the light versions.

This gives two publish waves from one render batch without self-competition.

## Launch-week cadence
- **Mon (launch):** Box, Coherent, 4-7-8 — 5-min light as primary uploads + channel trailer (Box 5-min). Publish each technique's Shorts (light) same day to drive discovery.
- **Tue:** Physiological Sigh + Belly — 5-min light + Shorts.
- **Wed:** Dark variants of Mon's set (staggered).
- **Thu:** 1-/2-/10-min light variants across techniques; fill playlists.
- **Fri:** Dark variants of the rest; review retention/CTR; pin best performer.

All videos: Category **Education**, **Not Made for Kids**, language **en**.
`;
  fs.writeFileSync(path.join(LAUNCH, "channel_setup.md"), md);
}
