// Audio-layer isolation harness for the breathing soundtrack "static" hunt.
//
// Adapted from capture_audio.js. For each config in the table it:
//   1. loads /breathe/wim-hof?...&debug=audio (fresh context → clean WebAudio tap)
//   2. waits for window.__audioService (exposed at mount by the ?debug=audio hook)
//   3. applies the layer config via the public setters BEFORE click-to-start, so
//      muted layers never produce a single sample (critical for the reverb row,
//      whose ConvolverNode tail would otherwise contaminate the recording)
//   4. clicks to start, waits for ctx.state === 'running'
//   5. records ORB_D seconds via the MediaStreamDestination tap → webm
//   6. ffmpeg → ~/Downloads/<name>.mp3  (for the user's ears)
//   7. ffmpeg true-peak / flatness line on the LOSSLESS webm (for the record)
//
// One config mutes exactly one layer (others at production defaults) so the
// export where the static disappears names the culprit. Run:
//   cd tools/orb-video && node scripts/capture_isolate.js
//   node scripts/capture_isolate.js 1 R   # only rows 1 and R
const { chromium } = require('playwright');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.ORB_BASE || 'http://localhost:3031';
const TECH = process.env.ORB_TECH || 'wim-hof';
const D = Number(process.env.ORB_D || 35);
const TMP = process.env.ORB_TMP || '/tmp/orbcap/iso';
const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const SPEC = path.join(__dirname, 'audio-spectrogram.sh');

// Production defaults — every non-muted layer is driven to these so each row is
// self-contained and does NOT depend on the uncommitted TEST edits in source.
const DEFAULTS = {
  drone: 1, subBass: 1, binaural: 1, phaseEnv: 1,
  cueTone: 1, cueNoise: 1, cueReverbMix: 1, pinkNoise: 1, noisePeakHz: 2400,
};

// Ordered by suspicion. `eyesClosed` rows load with ?eyesClosed=1 so the
// phase-envelope layer is actually active to be tested.
const CONFIGS = [
  { id: '0', name: 'iso_0_silence_control',
    cfg: { drone: 0, subBass: 0, binaural: 0, phaseEnv: 0, cueTone: 0, cueNoise: 0, cueReverbMix: 0, pinkNoise: 0, noisePeakHz: 2400 } },
  { id: '1', name: 'iso_1_reverb_off',   cfg: { ...DEFAULTS, cueReverbMix: 0 } },
  { id: '2', name: 'iso_2_drone_off',    cfg: { ...DEFAULTS, drone: 0 } },
  { id: '3', name: 'iso_3_binaural_off', cfg: { ...DEFAULTS, binaural: 0 } },
  { id: '4', name: 'iso_4_subbass_off',  cfg: { ...DEFAULTS, subBass: 0 } },
  { id: '5', name: 'iso_5_cuetone_off',  cfg: { ...DEFAULTS, cueTone: 0 } },
  { id: '6', name: 'iso_6_phaseenv_off', cfg: { ...DEFAULTS, phaseEnv: 0 }, eyesClosed: true },
  { id: 'R', name: 'iso_R_baseline',     cfg: { ...DEFAULTS } },
];

const initScript = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  const ctxTap = new WeakMap(); window.__tap = [];
  const Native = window.AudioContext || window.webkitAudioContext;
  function Patched(...a) {
    const c = new Native(...a);
    try {
      const tap = c.createMediaStreamDestination();
      const rec = new MediaRecorder(tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      ctxTap.set(c, tap); window.__tap.push({ c, tap, rec, chunks });
    } catch (e) { window.__tapErr = String(e); }
    return c;
  }
  Patched.prototype = Native.prototype; window.AudioContext = Patched; window.webkitAudioContext = Patched;
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (t, ...r) {
    try { if (t && t.context && ctxTap.has(t.context) && t === t.context.destination) oc.call(this, ctxTap.get(t.context)); } catch (e) {}
    return oc.call(this, t, ...r);
  };
  window.__startRec = () => window.__tap.forEach(t => { try { t.rec.start(); } catch (e) {} });
  window.__stopRec = () => new Promise((res) => {
    const t = window.__tap.find(x => x.rec.state !== 'inactive'); if (!t) return res(null);
    t.rec.onstop = async () => { const buf = await new Blob(t.chunks).arrayBuffer(); const by = new Uint8Array(buf); let s = ''; for (let i = 0; i < by.length; i++) s += String.fromCharCode(by[i]); res(btoa(s)); };
    t.rec.stop();
  });
};

async function runOne(browser, { id, name, cfg, eyesClosed }) {
  const url = `${BASE}/breathe/${TECH}?duration=120&debug=audio${eyesClosed ? '&eyesClosed=1' : ''}`;
  console.log(`\n[${id}] ${name}  ${url}`);
  console.log(`     cfg ${JSON.stringify(cfg)}`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
  await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for the debug hook to publish the singleton, then apply config PRE-start.
  await page.waitForFunction(() => !!window.__audioService, { timeout: 10000 });
  await page.evaluate((c) => {
    const a = window.__audioService;
    a.setDroneGain(c.drone);
    a.setSubBassGain(c.subBass);
    a.setBinauralGain(c.binaural);
    a.setPhaseEnvelopeGain(c.phaseEnv);
    a.setCueToneScale(c.cueTone);
    a.setCueNoiseScale(c.cueNoise);
    a.setCueReverbMix(c.cueReverbMix);
    a.setPinkNoiseGain(c.pinkNoise);
    a.setPinkNoiseFilterRange({ peakHz: c.noisePeakHz });
  }, cfg);

  await page.waitForTimeout(400);
  // Programmatic start — Resonance listens for this and calls handleTogglePlay.
  // More robust than clicking the orb (no layout/geometry assumptions). The
  // no-user-gesture autoplay flag lets the AudioContext start without a click.
  await page.evaluate(() => window.dispatchEvent(new Event('resonance:start')));

  // Technique-agnostic start signal: the AudioContext goes running.
  try {
    await page.waitForFunction(() => {
      const a = window.__audioService;
      if (!a || !a.getDebugState) return false;
      const s = a.getDebugState();
      // Session truly started once the always-on drone layer has built its
      // nodes (count stays > 0 even when the layer is muted to scale 0).
      return s.ctx.state === 'running' && s.nodes.drone > 0;
    }, { timeout: 10000 });
  } catch (e) {
    console.log('     WARN: session never reported started, recording anyway');
  }
  // Re-assert config now that nodes exist (defensive; setters are idempotent).
  await page.evaluate((c) => {
    const a = window.__audioService;
    a.setDroneGain(c.drone); a.setSubBassGain(c.subBass); a.setBinauralGain(c.binaural);
    a.setPhaseEnvelopeGain(c.phaseEnv); a.setCueToneScale(c.cueTone); a.setCueNoiseScale(c.cueNoise);
    a.setCueReverbMix(c.cueReverbMix); a.setPinkNoiseGain(c.pinkNoise);
  }, cfg);

  await page.evaluate(() => window.__startRec());
  console.log(`     recording ${D}s...`);
  await page.waitForTimeout(D * 1000);
  const b64 = await page.evaluate(() => window.__stopRec());
  await context.close();

  if (!b64) { console.log('     ERROR: no audio captured'); return; }
  const webm = path.join(TMP, `${name}.webm`);
  fs.writeFileSync(webm, Buffer.from(b64, 'base64'));
  const mp3 = path.join(DOWNLOADS, `${name}.mp3`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-codec:a', 'libmp3lame', '-q:a', '2', mp3]);
  console.log(`     wrote ${mp3}`);

  // True-peak / flatness on the LOSSLESS webm (mp3 adds its own HF floor).
  // ffmpeg writes the measurement to stderr and exits 0 — spawnSync always
  // returns stderr regardless of exit code.
  const stat = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', webm,
    '-af', 'ebur128=peak=true,astats=metadata=1:measure_overall=Peak_level+Flat_factor',
    '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  const lines = stat.split('\n')
    .filter(l => /True peak|Peak level dB|Flat factor/i.test(l))
    .map(l => l.replace(/.*\]\s*/, '').trim());
  const tpeak = lines.filter(l => /True peak/i.test(l)).slice(-2);
  const apeak = lines.filter(l => /Peak level dB|Flat factor/i.test(l)).slice(0, 2);
  if (tpeak.length || apeak.length) console.log('     ' + [...tpeak, ...apeak].join('  |  '));
}

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const wanted = process.argv.slice(2);
  const rows = wanted.length ? CONFIGS.filter(c => wanted.includes(c.id)) : CONFIGS;
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const row of rows) {
    try { await runOne(browser, row); } catch (e) { console.log(`     FAIL ${row.name}:`, e.message); }
  }
  await browser.close();
  console.log('\nDONE. Compare ~/Downloads/iso_*.mp3 against iso_R_baseline.mp3 by ear.');
  console.log('Spectrograms: tools/orb-video/scripts/audio-spectrogram.sh ' + TMP + '/<name>.webm');
})();
