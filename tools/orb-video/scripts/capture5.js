const { chromium } = require('playwright');
const fs = require('fs');

const URL = process.env.ORB_URL || 'https://deepbreathingexercises.com/breathe/box?duration=300';
const D = Number(process.env.ORB_D || 32);          // clean clip length (seconds)
const W = Number(process.env.ORB_W || 1920);
const H = Number(process.env.ORB_H || 1080);
const OUT = process.env.ORB_OUT || '/tmp/orbcap/out5';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
    colorScheme: 'dark',
  });

  // (1) keep page foregrounded (no visibility auto-pause)
  // (2) tap the WebAudio graph: anything connecting to ctx.destination is
  //     also routed into a stereo MediaStreamDestination -> MediaRecorder.
  await context.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });

    const ctxTap = new WeakMap();
    window.__tap = [];
    const Native = window.AudioContext || window.webkitAudioContext;
    function Patched(...a) {
      const c = new Native(...a);
      try {
        const tap = c.createMediaStreamDestination(); // defaults to 2 channels (stereo)
        const rec = new MediaRecorder(tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        ctxTap.set(c, tap);
        window.__tap.push({ c, tap, rec, chunks });
      } catch (e) { window.__tapErr = String(e); }
      return c;
    }
    Patched.prototype = Native.prototype;
    window.AudioContext = Patched;
    window.webkitAudioContext = Patched;

    const origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target, ...rest) {
      try {
        if (target && target.context && ctxTap.has(target.context) && target === target.context.destination) {
          origConnect.call(this, ctxTap.get(target.context)); // mirror master out into the tap
        }
      } catch (e) {}
      return origConnect.call(this, target, ...rest);
    };

    window.__startRec = () => window.__tap.forEach(t => { try { t.rec.start(); } catch (e) {} });
    window.__stopRec = () => new Promise((resolve) => {
      const t = window.__tap.find(x => x.rec.state !== 'inactive');
      if (!t) return resolve(null);
      t.rec.onstop = async () => {
        const buf = await new Blob(t.chunks, { type: 'audio/webm' }).arrayBuffer();
        const bytes = new Uint8Array(buf); let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        resolve(btoa(bin));
      };
      t.rec.stop();
    });
  });

  const page = await context.newPage();
  const tVideoStart = Date.now();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  // hide all chrome: header, hero title/share overlay, the "tap to pause" hint
  await page.addStyleTag({ content: `
    header[class*="z-30"] { display:none !important; }
    div[class*="bottom-0"][class*="z-30"] { display:none !important; }
    [class*="group-hover:opacity-95"] { display:none !important; }
  `});

  await page.mouse.click(W / 2, H / 2); // trusted gesture -> start session

  // wait until the first inhale phase is on screen, then start audio capture
  await page.waitForFunction(() => {
    const h = document.querySelector('h2');
    return h && /nhale/i.test(h.textContent || '');
  }, { timeout: 8000 });
  await page.evaluate(() => window.__startRec());
  const tFirstInhale = Date.now();
  const tapErr = await page.evaluate(() => window.__tapErr || null);
  console.log('tap error:', tapErr, '| tap count:', await page.evaluate(() => window.__tap.length));

  console.log(`recording ${D}s of audio+video...`);
  await page.waitForTimeout(D * 1000);

  const b64 = await page.evaluate(() => window.__stopRec());
  if (b64) fs.writeFileSync(`${OUT}/audio.webm`, Buffer.from(b64, 'base64'));
  await context.close(); // flush video webm
  await browser.close();

  const T0 = (tFirstInhale - tVideoStart) / 1000;
  console.log('audio bytes:', b64 ? Buffer.from(b64, 'base64').length : 0);
  console.log('video first-inhale offset T0 =', T0.toFixed(3), 's');
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify({ T0, D }));
})();
