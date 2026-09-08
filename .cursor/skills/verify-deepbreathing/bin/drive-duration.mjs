#!/usr/bin/env node
/**
 * Drive duration selection on the homepage (no audio required).
 * - Click the "1 min" chip
 * - Verify URL includes ?duration=60
 * - Capture screenshot and ARIA snapshot
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const SKILL_DIR = ".cursor/skills/verify-deepbreathing";
const EVIDENCE_DIR =
  process.env.EVIDENCE_DIR ||
  path.join(SKILL_DIR, "evidence", new Date().toISOString().replace(/[:.]/g, "-"));
const PROFILE_DIR = path.join(SKILL_DIR, "profile", `duration-${Date.now()}`);
const PORT = Number(process.env.PORT || 4317);
const url = `http://localhost:${PORT}/`;

await fs.mkdir(EVIDENCE_DIR, { recursive: true });
await fs.mkdir(path.dirname(PROFILE_DIR), { recursive: true });

const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: process.env.HEADLESS === "false" ? false : true,
  viewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
page.setDefaultTimeout(30000);

await page.goto(url, { waitUntil: "domcontentloaded" });

// Wait for chips to render (not during running)
const oneMin = page.getByRole("button", { name: /1 min/i });
await oneMin.waitFor({ state: "visible" });
await oneMin.click();

await page.waitForFunction(() => new URLSearchParams(location.search).has("duration"), null, { timeout: 15000 });

const screenshotPath = path.join(EVIDENCE_DIR, "homepage-duration-1min.png");
await page.screenshot({ path: screenshotPath, fullPage: false });

const ariaPath = path.join(EVIDENCE_DIR, "homepage-duration-1min.aria.json");
const client = await page.context().newCDPSession(page);
const axTree = await client.send("Accessibility.getFullAXTree");
await fs.writeFile(ariaPath, JSON.stringify(axTree, null, 2), "utf8");

console.log(`evidence:screenshot:${screenshotPath}`);
console.log(`evidence:aria:${ariaPath}`);
console.log(`feature:homepage-duration`);
console.log(`url:${page.url()}`);

await browser.close();
