const { chromium } = require('playwright');
const fs = require('fs');

const URL = process.env.ORB_URL || 'https://deepbreathingexercises.com/breathe/box?duration=300';
const D = Number(process.env.ORB_D || 61);
const OUT = process.env.ORB_OUT || '/tmp/orbcap/aud';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
  await context.addInitScript(() => {
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
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.mouse.click(640, 360);
  await page.waitForFunction(() => { const h = document.querySelector('h2'); return h && /nhale/i.test(h.textContent || ''); }, { timeout: 8000 });
  await page.evaluate(() => window.__startRec());
  console.log('audio capture started (first inhale); recording', D, 's...');
  await page.waitForTimeout(D * 1000);
  const b64 = await page.evaluate(() => window.__stopRec());
  if (b64) fs.writeFileSync(`${OUT}/site_audio.webm`, Buffer.from(b64, 'base64'));
  await browser.close();
  console.log('AUDIO DONE bytes:', b64 ? Buffer.from(b64, 'base64').length : 0);
})();
