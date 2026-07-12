import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE_FILE = path.join(ROOT, "src/app/sensory-studio/page.tsx");
const STUDIO_FILE = path.join(ROOT, "src/app/sensory-studio/sensory-studio.tsx");
const VISUALIZER_FILE = path.join(
  ROOT,
  "src/components/resonance/components/Visualizer.tsx",
);
const PARTICLES_FILE = path.join(
  ROOT,
  "src/components/resonance/components/ParticleBackground.tsx",
);
const AUDIO_PREVIEW_FILE = path.join(
  ROOT,
  "src/components/resonance/services/sensoryAudioPreview.ts",
);
const AUDIO_SERVICE_FILE = path.join(
  ROOT,
  "src/components/resonance/services/audioService.ts",
);

test("sensory studio is an isolated no-index authoring surface", () => {
  assert.ok(fs.existsSync(PAGE_FILE), "missing sensory studio route");
  assert.ok(fs.existsSync(STUDIO_FILE), "missing sensory studio client");

  const page = fs.readFileSync(PAGE_FILE, "utf8");
  const studio = fs.readFileSync(STUDIO_FILE, "utf8");
  const sitemap = fs.readFileSync(
    path.join(ROOT, "src/lib/seo/sitemap-routes.mjs"),
    "utf8",
  );
  const tracker = fs.readFileSync(
    path.join(ROOT, "src/components/analytics/PageViewTracker.tsx"),
    "utf8",
  );

  assert.match(page, /index:\s*false/);
  assert.match(page, /follow:\s*false/);
  assert.match(page, /nocache:\s*true/);
  assert.match(sitemap, /["']\/sensory-studio["']/);
  assert.match(tracker, /INTERNAL_ROUTES[\s\S]*?["']\/sensory-studio["']/);
  assert.doesNotMatch(studio, /trackEvent|fireGA4Event|enqueueSessionEvent/);
});

test("sensory studio supports safe no-code profile iteration", () => {
  const source = fs.readFileSync(STUDIO_FILE, "utf8");

  assert.match(source, /resonance:sensory-studio:v\$\{STORAGE_VERSION\}/);
  assert.match(source, /normalizeSensoryProfile/);
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /Undo/);
  assert.match(source, /Redo/);
  assert.match(source, /Reset/);
  assert.match(source, /Import/);
  assert.match(source, /Export/);
  assert.match(source, /Copy for Codex/);
  assert.match(source, /Live web engine/);
  assert.match(source, /Phase position/);
  assert.match(source, /Color & light/);
  assert.match(source, /Motion & particles/);
  assert.match(source, /Audio stack/);
  assert.match(source, /Binaural synth/);
  assert.match(source, /Layer mixer/);
  assert.match(source, /Evolution & mastering/);
  assert.match(source, /Production baseline/);
  assert.match(source, /Guidance & landing/);
  assert.match(
    source,
    /const snapshot = cloneProfileMap\(profilesRef\.current\);[\s\S]*?setHistory\(\(current\) => \[\.\.\.current, snapshot\]/,
    "history snapshots must be captured before React runs the state updater",
  );
});

test("sensory studio reuses the production visual engine", () => {
  const studio = fs.readFileSync(STUDIO_FILE, "utf8");
  const visualizer = fs.readFileSync(VISUALIZER_FILE, "utf8");
  const particles = fs.readFileSync(PARTICLES_FILE, "utf8");

  assert.match(studio, /components\/resonance\/components\/Visualizer/);
  assert.match(studio, /components\/resonance\/components\/ParticleBackground/);
  assert.match(studio, /<Visualizer/);
  assert.match(studio, /<ParticleBackground/);
  assert.doesNotMatch(studio, /styles\.orb\b|styles\.orbRings\b|styles\.particleField\b/);

  assert.match(visualizer, /tuning\?\.minScale \?\? 0\.6/);
  assert.match(visualizer, /tuning\?\.maxScale \?\? 1/);
  assert.match(visualizer, /tuning\?\.morphAmount === undefined[\s\S]*?\? 16/);
  assert.match(particles, /configuredDensity === undefined[\s\S]*?isMobile \? 50 : 80/);
  assert.match(particles, /currentTuning\?\.smoothing === undefined[\s\S]*?\? 0\.05/);
  assert.match(particles, /currentTuning\?\.flow/);
  assert.match(particles, /currentTuning\?\.gravityOffsetY/);
});

test("sensory studio reuses the production audio engine", () => {
  const studio = fs.readFileSync(STUDIO_FILE, "utf8");
  const audioPreview = fs.readFileSync(AUDIO_PREVIEW_FILE, "utf8");
  const audioService = fs.readFileSync(AUDIO_SERVICE_FILE, "utf8");

  assert.match(studio, /services\/sensoryAudioPreview/);
  assert.match(studio, /new StudioAudioPreview\(\)/);
  assert.doesNotMatch(studio, /new AudioContext|createOscillator\(|context\.destination/);
  assert.match(audioPreview, /new AudioService\(\)/);
  assert.match(audioPreview, /startPinkNoise/);
  assert.match(audioPreview, /startDrone/);
  assert.match(audioPreview, /startSubBass/);
  assert.match(audioPreview, /startBinaural/);
  assert.match(audioPreview, /startPhaseEnvelope/);
  assert.match(audioPreview, /tickSessionArc/);
  assert.match(audioPreview, /updatePinkNoisePhase/);
  assert.match(audioPreview, /setCompressorParams/);
  assert.match(audioPreview, /setLimiterParams/);
  assert.match(audioPreview, /setMasterTrim/);
  assert.match(audioPreview, /pitchSemitones: phaseAudio\.pitchSemitones/);
  assert.match(audioService, /tone\.detune \+ pitchSemitones \* 100/);
  assert.match(audioService, /cueToneScale \* gainScale/);
  assert.match(audioService, /public async dispose\(\)/);
});
