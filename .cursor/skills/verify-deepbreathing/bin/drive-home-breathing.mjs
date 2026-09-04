#!/usr/bin/env node
/**
 * Drive one mapped feature: start a breathing session from the homepage.
 * - Uses Playwright (chromium) with a dedicated user-data-dir
 * - Navigates to http://localhost:PORT/
 * - Clicks the orb (role=button, name=/Start Session/i)
 * - Asserts run-state (role=button, name=/Pause Session/i and body[data-resonance-running])
 * - Captures:
 *     - Screenshot: <EVIDENCE_DIR>/homepage-start-session.png
 *     - ARIA tree:  <EVIDENCE_DIR>/homepage-start-session.aria.json
 *
 * Env (optional):
 *   PORT           Dev server port (default 4317)
 *   EVIDENCE_DIR   Directory to write artifacts (default .cursor/skills/verify-deepbreathing/evidence/<timestamp>/)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const SKILL_DIR = ".cursor/skills/verify-deepbreathing";
const defaultEvidence = path.join(
  SKILL_DIR,
  "evidence",
  new Date().toISOString().replace(/[:.]/g, "-"),
);

const PORT = Number(process.env.PORT || 4317);
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || defaultEvidence;
const PROFILE_DIR = path.join(SKILL_DIR, "profile", `home-${Date.now()}`);

await fs.mkdir(EVIDENCE_DIR, { recursive: true });
await fs.mkdir(path.dirname(PROFILE_DIR), { recursive: true });

const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: process.env.HEADLESS === "false" ? false : true,
  viewport: { width: 1280, height: 800 },
});

const page = await browser.newPage();
page.setDefaultTimeout(30000);

const url = `http://localhost:${PORT}/`;
await page.goto(url, { waitUntil: "domcontentloaded" });
// Wait for the client island to hydrate: look for the visualizer button
const startButton = page.getByRole("button", { name: /Start Session/i });
await startButton.waitFor({ state: "visible", timeout: 30000 });

// Click to start
await startButton.click();

// Assert running state
await page.getByRole("button", { name: /Pause Session/i }).waitFor({ state: "visible" });
await page.waitForFunction(() => document.body.dataset.resonanceRunning === "true");

// Evidence: screenshot + ARIA snapshot
const screenshotPath = path.join(EVIDENCE_DIR, "homepage-start-session.png");
await page.screenshot({ path: screenshotPath, fullPage: false });

const ariaPath = path.join(EVIDENCE_DIR, "homepage-start-session.aria.json");
const client = await page.context().newCDPSession(page);
const axTree = await client.send("Accessibility.getFullAXTree");
await fs.writeFile(ariaPath, JSON.stringify(axTree, null, 2), "utf8");

console.log(`evidence:screenshot:${screenshotPath}`);
console.log(`evidence:aria:${ariaPath}`);
console.log(`feature:homepage-start-session`);
console.log(`url:${url}`);

await browser.close();
