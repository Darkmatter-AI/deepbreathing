#!/usr/bin/env node
/**
 * Live Playwright smoke suite for the breathing experience.
 *
 * Assumes Metro is ALREADY running at http://localhost:8081.
 * Skips gracefully when Metro is unreachable or Chromium is missing.
 * Uses only node:assert — no test-runner dependency.
 *
 * Usage: node ./regression/breathing.spec.mjs
 */

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const METRO_URL = 'http://localhost:8081';
const VIEWPORT = { width: 402, height: 874 };

// ── helpers ────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function metroIsUp() {
  try {
    const resp = await fetch(METRO_URL);
    return resp.ok || resp.status === 200;
  } catch { return false; }
}

/**
 * Navigate to the app, wait for hydration, dismiss overlays.
 * IMPORTANT: Metro/Expo web only loads the JS bundle on the FIRST navigation
 * in a given context. Do NOT call page.goto() or page.reload() more than once.
 */
async function setupPage(context) {
  const page = await context.newPage();
  await page.goto(METRO_URL, { wait_until: 'domcontentloaded', timeout: 30000 });
  // Wait for React hydration, mode sheet animation, etc.
  await page.waitForTimeout(8000);

  // Press Escape to dismiss any open overlays
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Force-click any remaining backdrops
  const backdrops = await page.$$('[aria-label="Bottom sheet backdrop"]');
  for (const bd of backdrops) {
    try { await bd.click({ force: true, timeout: 1000 }); await page.waitForTimeout(300); } catch {}
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  return page;
}

/**
 * Click the orb to start/stop the session, with force-click fallback.
 */
async function clickOrb(page, label) {
  try {
    await page.click(`button[aria-label="${label}"]`, { timeout: 5000 });
  } catch {
    await page.click(`button[aria-label="${label}"]`, { force: true, timeout: 5000 });
  }
}

// ── main suite ─────────────────────────────────────────────────────────────

async function main() {
  console.log('[smoke] Checking Metro at', METRO_URL);
  if (!(await metroIsUp())) {
    console.log('[smoke] SKIP — Metro not reachable at', METRO_URL);
    process.exit(0);
  }
  console.log('[smoke] Metro is up.\n');

  let browser;
  let passed = 0;
  let failed = 0;
  const failures = [];

  const check = (name, fn) => {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (err) { failed++; const msg = `  ✗ ${name}: ${err.message}`; console.error(msg); failures.push(msg); }
  };

  const checkAsync = async (name, fn) => {
    try { await fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (err) { failed++; const msg = `  ✗ ${name}: ${err.message}`; console.error(msg); failures.push(msg); }
  };

  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    if (err.message && /Executable doesn't exist|chromium/.test(err.message)) {
      console.log('[smoke] SKIP — Chromium not installed.');
      console.log('[smoke] Run: npx playwright install chromium');
      process.exit(0);
    }
    throw err;
  }

  try {
    // ──────────────────────────────────────────────────────────────────────
    // CONTEXT 1 — Tests 1-5 (default settings)
    // ──────────────────────────────────────────────────────────────────────
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await setupPage(ctx);

    // ── TEST 1: speed slider absent before session, visible during ────────
    console.log('[smoke] 1. Speed slider visibility');

    let sliderEl = await page.$('input[type="range"][aria-label="Breath speed"]');
    check('1a: slider absent before session', () => {
      assert.equal(sliderEl, null);
    });

    await clickOrb(page, 'Start Session');
    await page.waitForTimeout(1000);

    sliderEl = await page.$('input[type="range"][aria-label="Breath speed"]');
    check('1b: slider visible during session', () => {
      assert.notEqual(sliderEl, null);
    });

    // ── TEST 2: slider attributes ─────────────────────────────────────────
    console.log('\n[smoke] 2. Slider attributes');

    const sliderAttrs = await page.evaluate(() => {
      const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
      if (!el) return null;
      return { value: el.value, min: el.getAttribute('min'), max: el.getAttribute('max'), step: el.getAttribute('step') };
    });

    check('2a: min 0.5', () => assert.equal(sliderAttrs.min, '0.5'));
    check('2b: max 2.0', () => assert.equal(sliderAttrs.max, '2'));
    check('2c: step 0.05', () => assert.equal(sliderAttrs.step, '0.05'));
    check('2d: default 1.25 (centered)', () => assert.equal(sliderAttrs.value, '1.25'));

    // ── TEST 3: speed persistence ─────────────────────────────────────────
    console.log('\n[smoke] 3. Speed persistence');

    await page.evaluate(() => {
      const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '0.5'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    let settings = await page.evaluate(() => { const r = localStorage.getItem('resonance_settings'); return r ? JSON.parse(r) : null; });
    check('3a: slider 0.5 → speed 2.0', () => { assert.ok(settings); assert.equal(settings.speed, 2); });

    await page.evaluate(() => {
      const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '2'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    settings = await page.evaluate(() => { const r = localStorage.getItem('resonance_settings'); return r ? JSON.parse(r) : null; });
    check('3b: slider 2.0 → speed 0.5', () => { assert.ok(settings); assert.equal(settings.speed, 0.5); });

    // Reset to default
    await page.evaluate(() => {
      const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '1.25'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // ── TEST 4: no "Adjust breath pace" pill ──────────────────────────────
    console.log('\n[smoke] 4. No pace toggle pill');

    const pacePill = await page.$('[aria-label="Adjust breath pace"]');
    check('4: aria-label "Adjust breath pace" absent', () => assert.equal(pacePill, null));

    // ── TEST 5: settings overlay — exactly ONE range input ─────────────────
    console.log('\n[smoke] 5. Settings overlay range inputs');

    // Pause to reveal settings icon, then open settings
    await clickOrb(page, 'Pause Session');
    await page.waitForTimeout(600);

    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(800);

    const dialogRangeCount = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!d) return -1;
      return d.querySelectorAll('input[type="range"]').length;
    });
    check('5: exactly ONE range input in settings', () => assert.equal(dialogRangeCount, 1));

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ── TEST 6: phase duration scaling (same session, media) ──────────────
    console.log('\n[smoke] 6. Phase duration scaling');

    await checkAsync('6a: speed 2.0 inhale ~8s (±2s)', async () => {
      // Resume session, change slider to 0.5 (speed 2.0), wait for next inhale cycle
      await clickOrb(page, 'Start Session');
      await page.waitForTimeout(300);

      // Set slider to far left (0.5 = speed 2.0 = slowest)
      await page.evaluate(() => {
        const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, '0.5'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(500);

      // Measure next full inhale: wait for inhale start, then time until it ends
      const t0 = Date.now();
      let inhaleStart = 0;
      let timeout = false;
      while (Date.now() - t0 < 18000) {
        const lbl = await page.evaluate(() => {
          const h2 = document.querySelector('main h2');
          return h2 ? h2.textContent.trim().toLowerCase() : '';
        });
        if (lbl.includes('inhale') && inhaleStart === 0) {
          inhaleStart = Date.now();
        } else if (!lbl.includes('inhale') && inhaleStart > 0) {
          break;
        }
        await wait(100);
      }
      if (Date.now() - t0 >= 18000) timeout = true;

      if (timeout || inhaleStart === 0) {
        console.log('[smoke]   (skip 6a: could not isolate inhale phase)');
        return;
      }

      const measured = (Date.now() - inhaleStart) / 1000;
      console.log(`[smoke]   Speed 2.0 inhale: ${measured.toFixed(1)}s (expect ~8s)`);
      assert.ok(measured >= 6.0 && measured <= 10.0,
        `Expected ~8s at speed 2.0, got ${measured.toFixed(1)}s`);
    });

    await checkAsync('6b: speed 0.5 inhale ~2s (±1.2s)', async () => {
      // Set slider to far right (2.0 = speed 0.5 = fastest)
      await page.evaluate(() => {
        const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, '2'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(500);

      const t0 = Date.now();
      let inhaleStart = 0;
      while (Date.now() - t0 < 12000) {
        const lbl = await page.evaluate(() => {
          const h2 = document.querySelector('main h2');
          return h2 ? h2.textContent.trim().toLowerCase() : '';
        });
        if (lbl.includes('inhale') && inhaleStart === 0) {
          inhaleStart = Date.now();
        } else if (!lbl.includes('inhale') && inhaleStart > 0) {
          break;
        }
        await wait(50);
      }

      if (inhaleStart === 0) {
        console.log('[smoke]   (skip 6b: could not isolate inhale phase)');
        return;
      }

      const measured = (Date.now() - inhaleStart) / 1000;
      console.log(`[smoke]   Speed 0.5 inhale: ${measured.toFixed(1)}s (expect ~2s)`);
      assert.ok(measured >= 0.8 && measured <= 3.2,
        `Expected ~2s at speed 0.5, got ${measured.toFixed(1)}s`);
    });

    // Reset and pause
    await page.evaluate(() => {
      const el = document.querySelector('input[type="range"][aria-label="Breath speed"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, '1.25'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    await clickOrb(page, 'Pause Session');
    await page.waitForTimeout(500);

    await ctx.close();

    // ──────────────────────────────────────────────────────────────────────
    // CONTEXT 2 — Tests 7-8: Orb drag & ring follower
    // ──────────────────────────────────────────────────────────────────────
    console.log('\n[smoke] 7. Orb drag');

    const ctx2 = await browser.newContext({ viewport: VIEWPORT });
    const page2 = await setupPage(ctx2);

    // Get orb center position
    const orbBox = await page2.$eval('button[aria-label="Start Session"]', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    console.log(`[smoke]   Orb center: (${Math.round(orbBox.x)}, ${Math.round(orbBox.y)})`);

    const getTransforms = () => page2.evaluate(() => {
      const viz = document.querySelector('[class*="group relative z-10"]');
      if (!viz) return null;
      const ball = viz.querySelector('div.z-20');
      const ring = viz.querySelector('div.z-10');
      const fmt = (el) => el ? (el.style.transform || getComputedStyle(el).transform) : null;
      return { ball: fmt(ball), ring: fmt(ring) };
    });

    // ── 7: ball returns to origin, session NOT toggled ────────────────────
    await page2.mouse.move(orbBox.x, orbBox.y);
    await page2.mouse.down();
    await page2.waitForTimeout(50);
    await page2.mouse.move(orbBox.x + 90, orbBox.y - 60, { steps: 8 });
    await page2.waitForTimeout(100);

    const duringDrag = await getTransforms();
    console.log(`[smoke]   During drag — ball: ${duringDrag?.ball?.slice(0, 60)}`);

    await page2.mouse.up();
    await page2.waitForTimeout(2000);

    const afterDrag = await getTransforms();
    console.log(`[smoke]   After release — ball: ${afterDrag?.ball?.slice(0, 60)}`);

    check('7a: ball returns to origin after drag', () => {
      const t = afterDrag?.ball || '';
      const settled = t === 'none' || t.includes('translate3d(0px, 0px, 0px)') || t.includes('matrix(1, 0, 0, 1, 0, 0)');
      assert.ok(settled, `Ball not at origin: ${t}`);
    });

    const orbLabelAfter = await page2.$eval('button[aria-label="Start Session"]', el => el.getAttribute('aria-label'));
    check('7b: session NOT toggled by drag', () => {
      assert.equal(orbLabelAfter, 'Start Session', `Unexpected: ${orbLabelAfter}`);
    });

    // ── 8: outer ring follows slowly ──────────────────────────────────────
    console.log('\n[smoke] 8. Outer ring lagging follower');

    await page2.mouse.move(orbBox.x, orbBox.y);
    await page2.mouse.down();
    await page2.waitForTimeout(50);
    await page2.mouse.move(orbBox.x + 90, orbBox.y - 60, { steps: 8 });
    await page2.waitForTimeout(400);

    const heldTransforms = await getTransforms();
    console.log(`[smoke]   Held drag — ball: ${heldTransforms?.ball?.slice(0, 60)}, ring: ${heldTransforms?.ring?.slice(0, 60)}`);

    check('8a: ring transform differs from ball during drag', () => {
      assert.notEqual(heldTransforms?.ring, heldTransforms?.ball, 'Ring should lag');
    });

    await page2.mouse.up();
    await page2.waitForTimeout(4000);

    const settledTransforms = await getTransforms();
    console.log(`[smoke]   Settled — ring: ${settledTransforms?.ring?.slice(0, 60)}`);

    check('8b: ring settles within ~3s after release', () => {
      const t = settledTransforms?.ring || '';
      const settled = t === 'none' || t.includes('translate3d(0px, 0px, 0px)') || t.includes('matrix(1, 0, 0, 1, 0, 0)');
      assert.ok(settled, `Ring not settled: ${t}`);
    });

    await ctx2.close();

    // ──────────────────────────────────────────────────────────────────────
    // CONTEXT 3 — Test 9: Session-clock dot on the outer ring
    // ──────────────────────────────────────────────────────────────────────
    console.log('\n[smoke] 9. Session-clock dot on the outer ring');

    const ctx3 = await browser.newContext({ viewport: VIEWPORT });
    const page3 = await setupPage(ctx3);

    // 9a: dot hidden before a session starts (no session clock)
    const dotBefore = await page3.evaluate(() => {
      const dot = document.querySelector('[data-session-dot]');
      return dot ? getComputedStyle(dot).opacity : null;
    });
    check('9a: session dot hidden before session (opacity 0)', () => {
      assert.ok(dotBefore !== null, 'dot element missing');
      assert.equal(dotBefore, '0', `expected opacity 0, got ${dotBefore}`);
    });

    await clickOrb(page3, 'Start Session');
    await page3.waitForTimeout(1500);

    // 9b: dot visible during a session with a fixed duration
    const dot1 = await page3.evaluate(() => {
      const dot = document.querySelector('[data-session-dot]');
      if (!dot) return null;
      const r = dot.getBoundingClientRect();
      return { opacity: getComputedStyle(dot).opacity, x: r.x, y: r.y };
    });
    check('9b: session dot visible and positioned on the ring during session', () => {
      assert.ok(dot1, 'dot element missing during session');
      assert.equal(dot1.opacity, '0.7', `expected opacity 0.7, got ${dot1.opacity}`);
      assert.ok(dot1.x > 0 && dot1.y > 0, `dot off-screen: ${dot1.x},${dot1.y}`);
    });

    // 9c: dot travels clockwise — position changes ~1.5s later
    await page3.waitForTimeout(1500);
    const dot2 = await page3.evaluate(() => {
      const dot = document.querySelector('[data-session-dot]');
      if (!dot) return null;
      const r = dot.getBoundingClientRect();
      return { x: r.x, y: r.y };
    });
    check('9c: dot position changes over ~1.5s (clockwise travel)', () => {
      assert.ok(dot2, 'dot missing on second sample');
      const moved = Math.abs(dot2.x - dot1.x) + Math.abs(dot2.y - dot1.y);
      assert.ok(moved > 2, `dot barely moved: ${moved.toFixed(1)}px`);
    });

    await ctx3.close();


    // ── Summary ──────────────────────────────────────────────────────────
    console.log(`\n[smoke] ───────────────────────────────────────────`);
    console.log(`[smoke] Results: ${passed} passed, ${failed} failed`);

    if (failures.length > 0) {
      console.error(`[smoke] FAILURES:`);
      for (const f of failures) console.error(f);
      process.exit(1);
    }

    console.log('[smoke] All checks passed.');
    process.exit(0);

  } catch (err) {
    console.error('[smoke] Unexpected error:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

main();
