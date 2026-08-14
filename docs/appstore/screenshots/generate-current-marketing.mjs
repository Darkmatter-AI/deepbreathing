#!/usr/bin/env node

/**
 * Rebuild three provisional marketing compositions from checked-in captures.
 *
 * The source images are the committed, real simulator captures in raw/. This
 * script only scales them and places them in a deterministic composition; it never redraws
 * or edits the UI copy inside a capture. As of the Build 18 correction pass, these outputs
 * are fidelity references, not final App Store assets. Do not upload them until the physical-
 * device gate in ../submission-checklist.md passes and a fresh capture is approved.
 *
 * Usage (from the repository root):
 *   node docs/appstore/screenshots/generate-current-marketing.mjs
 *
 * Only marketing/asc-upload/02, 04, and 05 are written. The raw inputs are never overwritten,
 * so a fresh checkout can reproduce the provisional compositions. This command intentionally
 * does not generate the final Build 18 screenshot set.
 */

import { chromium } from "playwright";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(__dirname);
const rawRoot = path.join(outputRoot, "raw");
const uploadRoot = path.join(outputRoot, "marketing", "asc-upload");

const WIDTH = 1284;
const HEIGHT = 2778;
const CREAM = "#fdf8f2";
const INK = "#26150f";
const MUTED = "#77655d";
const RED = "#ed1d49";

const shots = [
  {
    id: "02-mode-library-sheet",
    title: '<span class="accent">7</span> science-backed<br>techniques',
    subtitle: "Box, 4-7-8, Coherent, Physiological Sigh &amp; more",
    tilt: -1.4,
    screenTop: 535,
    screenWidth: 1040,
  },
  {
    id: "04-speed-settings",
    title: 'Tune it to <span class="accent">your pace</span>',
    subtitle: "Make each session feel like your own",
    tilt: 1.2,
    screenTop: 545,
    screenWidth: 1020,
  },
  {
    id: "05-completion-summary",
    title: 'A small pause. <span class="accent">A real reset.</span>',
    subtitle: "Finish a session, then carry the calm with you",
    tilt: -0.8,
    screenTop: 555,
    screenWidth: 1020,
  },
];

function asDataUri(buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function escapeCss(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function marketingMarkup(shot, dataUri) {
  const screenHeight = Math.round(shot.screenWidth * HEIGHT / WIDTH);
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; margin: 0; overflow: hidden; background: ${CREAM}; }
  body {
    color: ${INK};
    font-family: "Avenir Next", "Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .art {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 820px 1050px at 50% 60%, rgba(239, 29, 73, .15) 0%, rgba(239, 29, 73, .075) 30%, rgba(253, 248, 242, 0) 74%),
      ${CREAM};
  }
  .art::before {
    content: "";
    position: absolute;
    width: 940px;
    height: 540px;
    left: 172px;
    top: 1635px;
    border-radius: 50%;
    background: rgba(237, 29, 73, .09);
    filter: blur(95px);
    pointer-events: none;
  }
  header {
    position: absolute;
    z-index: 2;
    top: 112px;
    left: 64px;
    right: 64px;
    text-align: center;
  }
  h1 {
    margin: 0;
    color: ${INK};
    font-size: 86px;
    font-weight: 800;
    letter-spacing: -3.7px;
    line-height: .98;
  }
  h1 .accent { color: ${RED}; }
  .subtitle {
    margin: 30px auto 0;
    color: ${MUTED};
    font-size: 31px;
    font-weight: 650;
    letter-spacing: -.45px;
    line-height: 1.2;
  }
  .device {
    position: absolute;
    z-index: 1;
    top: ${shot.screenTop}px;
    left: 50%;
    width: ${shot.screenWidth + 56}px;
    height: ${screenHeight + 56}px;
    transform: translateX(-50%) rotate(${escapeCss(shot.tilt)}deg);
    padding: 28px;
    border-radius: 116px;
    background: linear-gradient(135deg, #090807 0%, #25211e 47%, #080706 100%);
    box-shadow:
      0 40px 65px rgba(57, 31, 22, .20),
      0 18px 25px rgba(57, 31, 22, .15),
      inset 0 0 0 2px rgba(255, 255, 255, .21);
  }
  .device::before {
    content: "";
    position: absolute;
    top: 34px;
    bottom: 34px;
    left: 10px;
    width: 4px;
    border-radius: 4px;
    background: linear-gradient(#75706b, #252321 30%, #75706b 52%, #2b2927 82%, #6e6964);
    opacity: .8;
  }
  .device::after {
    content: "";
    position: absolute;
    top: 34px;
    bottom: 34px;
    right: 10px;
    width: 3px;
    border-radius: 4px;
    background: linear-gradient(#57514e, #171513 46%, #5f5955);
    opacity: .7;
  }
  .screen {
    position: relative;
    width: ${shot.screenWidth}px;
    height: ${screenHeight}px;
    overflow: hidden;
    border-radius: 86px;
    background: ${CREAM};
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, .68);
  }
  .screen img {
    display: block;
    width: ${shot.screenWidth}px;
    height: ${screenHeight}px;
    object-fit: fill;
  }
  .ground-shadow {
    position: absolute;
    z-index: 0;
    top: 2630px;
    left: 218px;
    width: 850px;
    height: 82px;
    border-radius: 50%;
    background: rgba(61, 39, 30, .25);
    filter: blur(24px);
  }
</style></head><body>
  <main class="art">
    <header><h1>${shot.title}</h1><p class="subtitle">${shot.subtitle}</p></header>
    <div class="ground-shadow"></div>
    <div class="device"><div class="screen"><img src="${dataUri}" alt="Authentic Deep Breathing app capture"></div></div>
  </main>
</body></html>`;
}

async function render(page, markup, outputPath) {
  await page.setContent(markup, { waitUntil: "load" });
  await page.screenshot({ path: outputPath, type: "png", animations: "disabled" });
}

async function main() {
  await mkdir(uploadRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

  try {
    for (const shot of shots) {
      const sourcePath = path.join(rawRoot, `${shot.id}.png`);
      const source = await readFile(sourcePath);
      const dataUri = asDataUri(source);
      const uploadPath = path.join(uploadRoot, `${shot.id}.png`);

      await render(page, marketingMarkup(shot, dataUri), uploadPath);

      const [rawStat, uploadStat] = await Promise.all([stat(sourcePath), stat(uploadPath)]);
      console.log(`${shot.id}: read raw ${rawStat.size} bytes; wrote asc-upload ${uploadStat.size} bytes`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
