#!/usr/bin/env node
/**
 * Generic driver for any visualizer-bearing route.
 * Example:
 *   node .cursor/skills/verify-deepbreathing/bin/drive-visualizer.mjs --path / --evidence home
 *   node .cursor/skills/verify-deepbreathing/bin/drive-visualizer.mjs --path /breathe/box --evidence box
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const args = { path: "/", evidence: "drive" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--path") args.path = argv[++i] || "/";
    else if (a === "--evidence") args.evidence = argv[++i] || "drive";
  }
  return args;
}

const { path: routePath, evidence: stem } = parseArgs(process.argv);

const SKILL_DIR = ".cursor/skills/verify-deepbreathing";
const EVIDENCE_DIR =
  process.env.EVIDENCE_DIR ||
  path.join(SKILL_DIR, "evidence", new Date().toISOString().replace(/[:.]/g, "-"));
const PROFILE_DIR = path.join(SKILL_DIR, "profile", `${stem}-${Date.now()}`);

const PORT = Number(process.env.PORT || 4317);
const baseUrl = `http://localhost:${PORT}`;
const url = new URL(routePath, baseUrl).toString();

await fs.mkdir(EVIDENCE_DIR, { recursive: true });
await fs.mkdir(path.dirname(PROFILE_DIR), { recursive: true });

const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: process.env.HEADLESS === "false" ? false : true,
  viewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
page.setDefaultTimeout(30000);

await page.goto(url, { waitUntil: "domcontentloaded" });
const start = page.getByRole("button", { name: /Start Session/i });
await start.waitFor({ state: "visible", timeout: 30000 });
await start.click();
await page.getByRole("button", { name: /Pause Session/i }).waitFor({ state: "visible" });
await page.waitForFunction(() => document.body.dataset.resonanceRunning === "true");

const screenshotPath = path.join(EVIDENCE_DIR, `${stem}-start.png`);
await page.screenshot({ path: screenshotPath, fullPage: false });
const ariaPath = path.join(EVIDENCE_DIR, `${stem}-start.aria.json`);
const client = await page.context().newCDPSession(page);
const axTree = await client.send("Accessibility.getFullAXTree");
await fs.writeFile(ariaPath, JSON.stringify(axTree, null, 2), "utf8");

console.log(`evidence:screenshot:${screenshotPath}`);
console.log(`evidence:aria:${ariaPath}`);
console.log(`feature:${stem}`);
console.log(`url:${url}`);

await browser.close();
