#!/usr/bin/env node
/*
 * render_matrix.js — seam-safe batch render driver for the YouTube launch package.
 *
 * Pipeline per (technique × theme × orientation):
 *   1. Render ONE master at its integer-cycle length via Remotion (clean audio
 *      bed baked in via <Audio>), 4K landscape or 1440×2560 shorts.
 *   2. Normalize the master to a 1-second GOP (keyframe every fps frames) so that
 *      a `-c copy -t <integerSeconds>` cut lands exactly on a keyframe — every
 *      target duration is an integer number of seconds, so every cut is
 *      frame-accurate. (Skipped if NORMALIZE_GOP=false.)
 *   3. Stream-copy-loop the master to each target duration (no re-encode of
 *      video; audio gets a short fade-out so mid-bed cuts don't end abruptly).
 *
 * Resumable: any output that already exists and passes validVideo() is skipped.
 * Structured log -> out/launch/render.log.
 *
 * Usage:
 *   node scripts/render_matrix.js              # render masters + loop finals
 *   node scripts/render_matrix.js --qa         # QA pass only (ffprobe + seam + beds)
 *   node scripts/render_matrix.js --only box   # restrict to one technique slug
 *   node scripts/render_matrix.js --masters    # render/normalize masters only
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, ".."); // tools/orb-video
const MASTERS = path.join(ROOT, "out/_masters");
const LAUNCH = path.join(ROOT, "out/launch");
const PUBLIC = path.join(ROOT, "public");
const LOG = path.join(LAUNCH, "render.log");
const FPS = 60;
const NORMALIZE_GOP = true; // enforce 1s keyframes for frame-accurate copy cuts
const SEAM_ABS = 3.0; // absolute YAVG ceiling for the loop seam
const SEAM_REL = 2.2; // seam must be <= this × an adjacent-frame baseline diff

const TECHNIQUES = [
  { slug: "box", pattern: "box", bed: "box", color: "#e11d48", master: 48 },
  { slug: "coherent", pattern: "coherent", bed: "coherent", color: "#059669", master: 44 },
  { slug: "4-7-8", pattern: "relax", bed: "relax", color: "#4f46e5", master: 38 },
  { slug: "physiological-sigh", pattern: "sigh", bed: "sigh", color: "#0ea5e9", master: 44 },
  { slug: "belly", pattern: "belly", bed: "belly", color: "#f59e0b", master: 50 },
];
const THEMES = ["light", "dark"];
// Per-orient `themes` overrides the global THEMES (default both light+dark).
// tiktok is light-only so we don't waste dark renders the plan doesn't ship.
const ORIENTS = {
  landscape: { w: 3840, h: 2160, durations: [["1min", 60], ["2min", 120], ["5min", 300], ["10min", 600]] },
  shorts: { w: 1440, h: 2560, durations: [["30s", 30], ["60s", 60]] },
  tiktok: { w: 1080, h: 1920, themes: ["light"], durations: [["15s", 15], ["30s", 30], ["60s", 60]] },
};

fs.mkdirSync(MASTERS, { recursive: true });
fs.mkdirSync(LAUNCH, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + "\n"); } catch {}
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, ...opts });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

function ffprobeJSON(file) {
  const r = run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]);
  if (r.code !== 0) return null;
  try { return JSON.parse(r.out); } catch { return null; }
}

function validVideo(file, w, h, durSec, needAudio = true) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 1024) return { ok: false, reason: "missing/empty" };
  const j = ffprobeJSON(file);
  if (!j) return { ok: false, reason: "unprobeable" };
  const v = (j.streams || []).find((s) => s.codec_type === "video");
  const a = (j.streams || []).find((s) => s.codec_type === "audio");
  if (!v) return { ok: false, reason: "no video stream" };
  if (v.codec_name !== "h264") return { ok: false, reason: `codec ${v.codec_name}` };
  // Remotion natively emits full-range yuvj420p (faithful to the browser-rendered
  // site, YouTube-compatible). Accept both the limited- and full-range 8-bit 4:2:0.
  if (v.pix_fmt !== "yuv420p" && v.pix_fmt !== "yuvj420p") return { ok: false, reason: `pix_fmt ${v.pix_fmt}` };
  if (v.width !== w || v.height !== h) return { ok: false, reason: `dims ${v.width}x${v.height} != ${w}x${h}` };
  const dur = parseFloat((j.format && j.format.duration) || "0");
  if (Math.abs(dur - durSec) > 0.15) return { ok: false, reason: `dur ${dur.toFixed(3)} != ${durSec}` };
  if (needAudio) {
    if (!a) return { ok: false, reason: "no audio stream" };
    if (a.codec_name !== "aac") return { ok: false, reason: `audio ${a.codec_name}` };
  }
  return { ok: true, dur };
}

function masterPath(t, theme, orient) {
  return path.join(MASTERS, `${t.slug}_${theme}_${orient}.mp4`);
}
function finalPath(t, theme, orient, durLabel) {
  return path.join(LAUNCH, t.slug, orient, `${t.slug}-${theme}-${orient}-${durLabel}.mp4`);
}

function renderMaster(t, theme, orient) {
  const o = ORIENTS[orient];
  const out = masterPath(t, theme, orient);
  if (validVideo(out, o.w, o.h, t.master, true).ok) { log(`SKIP master (valid): ${path.basename(out)}`); return true; }
  const bed = `${t.bed}.mp3`;
  if (!fs.existsSync(path.join(PUBLIC, bed))) { log(`ERROR: missing bed public/${bed} for ${t.slug}`); return false; }
  const props = JSON.stringify({
    patternKey: t.pattern, color: t.color, speed: 1, audioSrc: bed, theme,
    labels: { Inhale: "Inhale", Hold: "Hold", Exhale: "Exhale" },
    durationSec: t.master, loopSec: t.master, width: o.w, height: o.h,
  });
  log(`RENDER master ${path.basename(out)} (${o.w}x${o.h}, ${t.master}s)`);
  const tmp = out + ".raw.mp4";
  const r = run("npx", [
    "remotion", "render", "src/index.ts", "Breathing", NORMALIZE_GOP ? tmp : out,
    "--codec=h264", "--concurrency=3", "--timeout=300000",
    "--crf=18", "--x264-preset=slow", "--pixel-format=yuv420p",
    `--props=${props}`,
  ], { cwd: ROOT });
  if (r.code !== 0) { log(`RENDER FAILED ${path.basename(out)}:\n${r.out.slice(-1500)}`); return false; }

  if (NORMALIZE_GOP) {
    log(`NORMALIZE GOP ${path.basename(out)} (keyint=${FPS})`);
    const n = run("ffmpeg", [
      "-y", "-i", tmp,
      "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
      "-x264-params", `keyint=${FPS}:min-keyint=${FPS}:scenecut=0`,
      "-c:a", "copy", "-movflags", "+faststart", out,
    ]);
    if (n.code !== 0) { log(`NORMALIZE FAILED ${path.basename(out)}:\n${n.out.slice(-1500)}`); return false; }
    fs.unlinkSync(tmp);
  }
  const v = validVideo(out, o.w, o.h, t.master, true);
  if (!v.ok) { log(`MASTER INVALID ${path.basename(out)}: ${v.reason}`); return false; }
  log(`OK master ${path.basename(out)} dur=${v.dur.toFixed(3)}`);
  return true;
}

function loopFinal(t, theme, orient, durLabel, durSec) {
  const o = ORIENTS[orient];
  const master = masterPath(t, theme, orient);
  const out = finalPath(t, theme, orient, durLabel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (validVideo(out, o.w, o.h, durSec, true).ok) { log(`SKIP final (valid): ${path.basename(out)}`); return true; }
  if (!validVideo(master, o.w, o.h, t.master, true).ok) { log(`ERROR: master not ready for ${path.basename(out)}`); return false; }
  const N = Math.ceil(durSec / t.master) - 1;
  const fadeSt = (durSec - 0.4).toFixed(3);
  log(`LOOP final ${path.basename(out)} (stream_loop ${N} -> ${durSec}s)`);
  const r = run("ffmpeg", [
    "-y", "-stream_loop", String(N), "-i", master, "-t", String(durSec),
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-af", `afade=t=out:st=${fadeSt}:d=0.4`,
    "-movflags", "+faststart", out,
  ]);
  if (r.code !== 0) { log(`LOOP FAILED ${path.basename(out)}:\n${r.out.slice(-1200)}`); return false; }
  const v = validVideo(out, o.w, o.h, durSec, true);
  if (!v.ok) { log(`FINAL INVALID ${path.basename(out)}: ${v.reason}`); return false; }
  log(`OK final ${path.basename(out)} dur=${v.dur.toFixed(3)}`);
  return true;
}

// ---- seam diff ----
function extractFrame(file, n, outPng) {
  return run("ffmpeg", ["-y", "-i", file, "-vf", `select=eq(n\\,${n})`, "-frames:v", "1", outPng]).code === 0;
}
function frameDiff(a, b) {
  const r = run("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi",
    "blend=difference,signalstats,metadata=print:file=-", "-f", "null", "-"]);
  const m = r.out.match(/signalstats\.YAVG=([0-9.]+)/);
  if (!m) return null;
  return parseFloat(m[1]);
}
function seamCheck(t, theme, orient) {
  const o = ORIENTS[orient];
  const master = masterPath(t, theme, orient);
  if (!fs.existsSync(master)) return { ok: false, reason: "no master" };
  const last = Math.round(t.master * FPS) - 1;
  const tmp = path.join(MASTERS, ".seam");
  fs.mkdirSync(tmp, { recursive: true });
  const f0 = path.join(tmp, "f0.png"), fL = path.join(tmp, "fL.png");
  const b0 = path.join(tmp, "b0.png"), b1 = path.join(tmp, "b1.png");
  extractFrame(master, 0, f0); extractFrame(master, last, fL);
  extractFrame(master, 100, b0); extractFrame(master, 101, b1);
  const seam = frameDiff(f0, fL);
  const base = frameDiff(b0, b1);
  const ok = seam != null && (seam <= SEAM_ABS || (base != null && seam <= base * SEAM_REL));
  return { ok, seam, base, master: path.basename(master) };
}

// ---- bed spectrogram QA ----
function bedCheck(t) {
  const bed = path.join(PUBLIC, `${t.bed}.mp3`);
  if (!fs.existsSync(bed)) return { ok: false, reason: "missing bed" };
  const tp = run("ffmpeg", ["-hide_banner", "-nostats", "-i", bed, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const peaks = (tp.out.match(/Peak:\s*(-?[0-9.]+)/g) || []).map((s) => parseFloat(s.split(":")[1]));
  const truePeak = peaks.length ? Math.max(...peaks) : null;
  const st = run("ffmpeg", ["-hide_banner", "-nostats", "-i", bed, "-af", "astats=metadata=1:measure_overall=Flat_factor", "-f", "null", "-"]);
  const fm = st.out.match(/Flat factor:\s*([0-9.]+)/);
  const flat = fm ? parseFloat(fm[1]) : null;
  const ok = truePeak != null && truePeak < -1.0 && (flat == null || flat < 1.0);
  return { ok, truePeak, flat, bed: `${t.bed}.mp3` };
}

// ---- drivers ----
function buildList(onlySlug) {
  const list = [];
  for (const t of TECHNIQUES) {
    if (onlySlug && t.slug !== onlySlug) continue;
    for (const orient of Object.keys(ORIENTS)) {
      const themes = ORIENTS[orient].themes || THEMES;
      for (const theme of themes) list.push({ t, theme, orient });
    }
  }
  return list;
}

function doRender(onlySlug, mastersOnly) {
  const cells = buildList(onlySlug);
  let okM = 0, failM = 0, okF = 0, failF = 0;
  for (const { t, theme, orient } of cells) {
    if (renderMaster(t, theme, orient)) okM++; else { failM++; continue; }
    if (mastersOnly) continue;
    for (const [durLabel, durSec] of ORIENTS[orient].durations) {
      if (loopFinal(t, theme, orient, durLabel, durSec)) okF++; else failF++;
    }
  }
  log(`DONE render: masters ok=${okM} fail=${failM}; finals ok=${okF} fail=${failF}`);
}

function doQA(onlySlug) {
  const cells = buildList(onlySlug);
  let pass = 0, fail = 0;
  log("=== QA: finals ===");
  for (const { t, theme, orient } of cells) {
    const o = ORIENTS[orient];
    for (const [durLabel, durSec] of o.durations) {
      const out = finalPath(t, theme, orient, durLabel);
      const v = validVideo(out, o.w, o.h, durSec, true);
      if (v.ok) { pass++; } else { fail++; log(`FINAL FAIL ${path.basename(out)}: ${v.reason}`); }
    }
  }
  log(`finals: pass=${pass} fail=${fail}`);
  log("=== QA: master seams ===");
  let sP = 0, sF = 0;
  for (const { t, theme, orient } of cells) {
    const s = seamCheck(t, theme, orient);
    const tag = s.ok ? "OK" : "FAIL";
    if (s.ok) sP++; else sF++;
    log(`seam ${tag} ${s.master || t.slug + "_" + theme + "_" + orient}: seam=${s.seam} base=${s.base}`);
  }
  log(`seams: pass=${sP} fail=${sF}`);
  log("=== QA: beds ===");
  let bP = 0, bF = 0;
  for (const t of TECHNIQUES) {
    if (onlySlug && t.slug !== onlySlug) continue;
    const b = bedCheck(t);
    const tag = b.ok ? "OK" : "FAIL";
    if (b.ok) bP++; else bF++;
    log(`bed ${tag} ${b.bed || t.bed}: truePeak=${b.truePeak} dBTP flat=${b.flat} ${b.reason || ""}`);
  }
  log(`beds: pass=${bP} fail=${bF}`);
  log(`QA SUMMARY: finals ${pass}/${pass + fail}, seams ${sP}/${sP + sF}, beds ${bP}/${bP + bF}`);
}

const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const onlySlug = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
if (args.includes("--qa")) doQA(onlySlug);
else doRender(onlySlug, args.includes("--masters"));
