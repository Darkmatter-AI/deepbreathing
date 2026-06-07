// Lossless PCM control capture — rules the MediaRecorder(Opus)→MP3 codec
// pipeline in or out as the source of the residual "static" the user still
// hears in iso_0 (all WebAudio layers muted).
//
// Instead of MediaStreamDestination + MediaRecorder (Opus, lossy) it taps the
// master with a ScriptProcessorNode and writes raw 32-bit float WAV — zero
// lossy stages. If the silence row is truly silent here but hissy in the mp3,
// the residual was the codec, not the web app. If it hisses here too, there's
// a real always-on WebAudio source.
//
//   cd tools/orb-video && PLAYWRIGHT_BROWSERS_PATH=0 node scripts/capture_pcm.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.ORB_BASE || 'http://localhost:3031';
const TECH = process.env.ORB_TECH || 'wim-hof';
const D = Number(process.env.ORB_D || 20);
const TMP = process.env.ORB_TMP || '/tmp/orbcap/iso';
const DOWNLOADS = path.join(os.homedir(), 'Downloads');

const DEFAULTS = { drone: 1, subBass: 1, binaural: 1, phaseEnv: 1, cueTone: 1, cueNoise: 1, cueReverbMix: 1, pinkNoise: 1, noisePeakHz: 2400 };
const ALL_OFF = { drone: 0, subBass: 0, binaural: 0, phaseEnv: 0, cueTone: 0, cueNoise: 0, cueReverbMix: 0, pinkNoise: 0, noisePeakHz: 2400 };

const ROWS = [
  { name: 'pcm_0_silence_control', cfg: ALL_OFF },
  { name: 'pcm_R_baseline',        cfg: DEFAULTS },
];

const initScript = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  const ctxTap = new WeakMap(); window.__pcm = [];
  const Native = window.AudioContext || window.webkitAudioContext;
  function Patched(...a) {
    const c = new Native(...a);
    try {
      const sp = c.createScriptProcessor(4096, 2, 2);
      const rec = { sp, on: false, L: [], R: [], sr: c.sampleRate };
      sp.onaudioprocess = (e) => {
        if (!rec.on) return;
        const ib = e.inputBuffer;
        rec.L.push(new Float32Array(ib.getChannelData(0)));
        rec.R.push(new Float32Array(ib.numberOfChannels > 1 ? ib.getChannelData(1) : ib.getChannelData(0)));
      };
      sp.connect(c.destination); // ScriptProcessor must reach destination to be pulled
      ctxTap.set(c, sp); window.__pcm.push(rec);
    } catch (e) { window.__pcmErr = String(e); }
    return c;
  }
  Patched.prototype = Native.prototype; window.AudioContext = Patched; window.webkitAudioContext = Patched;
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (t, ...r) {
    try { if (t && t.context && ctxTap.has(t.context) && t === t.context.destination) oc.call(this, ctxTap.get(t.context)); } catch (e) {}
    return oc.call(this, t, ...r);
  };
  window.__startPcm = () => window.__pcm.forEach(r => { r.on = true; });
  window.__stopPcm = () => {
    const r = window.__pcm.find(x => x.L.length); if (!r) return null;
    r.on = false;
    const flat = (arrs) => { let n = 0; arrs.forEach(a => n += a.length); const out = new Float32Array(n); let o = 0; arrs.forEach(a => { out.set(a, o); o += a.length; }); return out; };
    const L = flat(r.L), R = flat(r.R), n = Math.min(L.length, R.length);
    // 32-bit float WAV (format 3), interleaved stereo, lossless.
    const buf = new ArrayBuffer(44 + n * 2 * 4); const dv = new DataView(buf);
    const ws = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 8, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 2, true);
    dv.setUint32(24, r.sr, true); dv.setUint32(28, r.sr * 8, true); dv.setUint16(32, 8, true); dv.setUint16(34, 32, true);
    ws(36, 'data'); dv.setUint32(40, n * 8, true);
    let off = 44;
    for (let i = 0; i < n; i++) { dv.setFloat32(off, L[i], true); off += 4; dv.setFloat32(off, R[i], true); off += 4; }
    const by = new Uint8Array(buf); let s = ''; for (let i = 0; i < by.length; i++) s += String.fromCharCode(by[i]); return btoa(s);
  };
};

async function runOne(browser, { name, cfg }) {
  const url = `${BASE}/breathe/${TECH}?duration=120&debug=audio`;
  console.log(`\n${name}  ${JSON.stringify(cfg)}`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
  await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => !!window.__audioService, { timeout: 10000 });
  await page.evaluate((c) => {
    const a = window.__audioService;
    a.setDroneGain(c.drone); a.setSubBassGain(c.subBass); a.setBinauralGain(c.binaural);
    a.setPhaseEnvelopeGain(c.phaseEnv); a.setCueToneScale(c.cueTone); a.setCueNoiseScale(c.cueNoise);
    a.setCueReverbMix(c.cueReverbMix); a.setPinkNoiseGain(c.pinkNoise); a.setPinkNoiseFilterRange({ peakHz: c.noisePeakHz });
  }, cfg);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.dispatchEvent(new Event('resonance:start')));
  try {
    await page.waitForFunction(() => { const a = window.__audioService; const s = a && a.getDebugState && a.getDebugState(); return s && s.ctx.state === 'running' && s.nodes.drone > 0; }, { timeout: 10000 });
  } catch (e) { console.log('     WARN: session not confirmed'); }
  await page.evaluate((c) => {
    const a = window.__audioService;
    a.setDroneGain(c.drone); a.setSubBassGain(c.subBass); a.setBinauralGain(c.binaural);
    a.setPhaseEnvelopeGain(c.phaseEnv); a.setCueToneScale(c.cueTone); a.setCueNoiseScale(c.cueNoise);
    a.setCueReverbMix(c.cueReverbMix); a.setPinkNoiseGain(c.pinkNoise);
  }, cfg);
  await page.evaluate(() => window.__startPcm());
  console.log(`     recording ${D}s PCM...`);
  await page.waitForTimeout(D * 1000);
  const b64 = await page.evaluate(() => window.__stopPcm());
  const err = await page.evaluate(() => window.__pcmErr || null);
  await context.close();
  if (!b64) { console.log('     ERROR: no PCM captured', err || ''); return; }
  const wav = path.join(TMP, `${name}.wav`);
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  const dl = path.join(DOWNLOADS, `${name}.wav`);
  fs.copyFileSync(wav, dl);
  console.log(`     wrote ${dl}`);
}

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const row of ROWS) { try { await runOne(browser, row); } catch (e) { console.log('     FAIL', row.name, e.message); } }
  await browser.close();
  console.log('\nDONE PCM. Lossless WAVs in ~/Downloads (pcm_*.wav).');
})();
