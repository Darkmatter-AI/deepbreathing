#!/usr/bin/env node
/**
 * Locale chunk-availability monitor.
 *
 * Why this exists
 * ---------------
 * deepbreathingexercises.com is translated by the MassTranslate reverse proxy,
 * which caches translated HTML. That HTML embeds versioned
 * `/_next/static/.../page-<hash>.js` chunk URLs. When the app redeploys, the
 * hashes change. Until the proxy re-fetches the origin, it keeps serving the
 * PREVIOUS build's HTML for `/ja/...` etc.; if the new deploy has dropped those
 * old chunks, they 404 and the page crashes (ChunkLoadError → React #423 →
 * "Application error"). That post-deploy "skew window" is the crash users hit.
 *
 * What it checks (and what it deliberately does NOT)
 * --------------------------------------------------
 * The FAIL gate is the actual crash condition: a chunk referenced by the
 * LOCALE page returns non-200. This needs no English baseline, so it does not
 * cry wolf on benign version drift while the origin is mid-rollout (the origin
 * serves mixed builds for a minute or two after deploy — comparing against it
 * would red-flag every deploy).
 *
 * To avoid paging on a transient rollout, a flagged route is RE-CHECKED after a
 * settle delay; it only fails if the chunk is still missing — i.e. the proxy
 * cache is actually stuck, not just briefly ahead of/behind the origin.
 *
 * Build drift vs the English origin is logged as INFO only.
 *
 * Note: this guards the crash/skew window, not the (RSC-layer) silent English
 * revert, which isn't chunk-detectable. Dependency-free; just `fetch`.
 *
 * Exit 0 = no stuck-stale chunks. Non-zero = a locale page references chunks
 * that 404 after settling.
 */

const BASE_URL = (process.env.BASE_URL || "https://deepbreathingexercises.com").replace(/\/$/, "");
const LOCALES = (process.env.LOCALES || "es,pt,fr,de,ja").split(",").map((s) => s.trim()).filter(Boolean);
const ROUTES = (process.env.ROUTES || "/,/breathe,/breathe/box,/breathe/coherent,/breathe/4-7-8").split(",");
const SETTLE_MS = Number(process.env.SETTLE_MS || 90_000);
const SETTLE_RETRIES = Number(process.env.SETTLE_RETRIES || 2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cacheBust = () => `cb=${Date.now()}-${Math.round(process.hrtime()[1])}`;
const localePath = (loc, route) => (route === "/" ? `/${loc}/` : `/${loc}${route}`);

async function getHtml(path) {
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}${cacheBust()}`;
  const res = await fetch(url, { redirect: "follow", headers: { "cache-control": "no-cache" } });
  return { status: res.status, html: res.status === 200 ? await res.text() : "" };
}

function extractChunks(html) {
  return [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"'\\\s]+\.js/g)].map((m) => m[0]))];
}

async function chunkStatus(chunkPath) {
  const res = await fetch(`${BASE_URL}${chunkPath}`, { method: "GET", redirect: "manual", cache: "no-store" });
  return res.status;
}

/** Returns the list of chunk URLs referenced by the page that currently 404. */
async function missingChunks(path) {
  const { status, html } = await getHtml(path);
  if (status !== 200) return { pageStatus: status, missing: [] };
  const chunks = extractChunks(html);
  const missing = [];
  for (const c of chunks) {
    if ((await chunkStatus(c)) !== 200) missing.push(c);
  }
  return { pageStatus: status, missing, chunks };
}

async function main() {
  const lines = [];
  const flagged = []; // { path, reason }
  let enByRoute = {};

  // Pass 1: detect. Also collect EN chunk sets for the INFO drift log.
  for (const route of ROUTES) {
    const en = await getHtml(route);
    enByRoute[route] = en.status === 200 ? new Set(extractChunks(en.html)) : null;

    for (const loc of LOCALES) {
      const path = localePath(loc, route);
      const { pageStatus, missing, chunks } = await missingChunks(path);

      if (pageStatus !== 200) {
        flagged.push({ path, reason: `HTTP ${pageStatus}` });
        lines.push(`flag  ${path}  page HTTP ${pageStatus}`);
        continue;
      }
      if (missing.length) {
        flagged.push({ path, reason: `${missing.length} chunk(s) 404`, missing });
        lines.push(`flag  ${path}  ${missing.length} chunk(s) 404 (e.g. ${missing[0]})`);
        continue;
      }
      // INFO only: build drift vs origin (expected briefly mid-rollout).
      const enSet = enByRoute[route];
      const drift = enSet ? chunks.filter((c) => !enSet.has(c)).length : 0;
      lines.push(`ok    ${path}${drift ? `  (info: ${drift} chunk(s) differ from EN origin — version drift)` : ""}`);
    }
  }

  console.log(`Locale chunk availability · ${BASE_URL}`);
  console.log(lines.join("\n"));

  if (!flagged.length) {
    console.log("\n✓ Every locale page's chunks resolve.");
    return;
  }

  // Pass 2: settle. Transient rollout jitter heals; a stuck proxy cache does not.
  console.log(`\n${flagged.length} route(s) flagged. Re-checking after settle to rule out a live rollout...`);
  let pending = flagged;
  for (let attempt = 1; attempt <= SETTLE_RETRIES && pending.length; attempt++) {
    await sleep(SETTLE_MS);
    const next = [];
    for (const f of pending) {
      const { pageStatus, missing } = await missingChunks(f.path);
      if (pageStatus === 200 && missing.length === 0) {
        console.log(`  healed   ${f.path} (attempt ${attempt})`);
      } else {
        const reason = pageStatus !== 200 ? `HTTP ${pageStatus}` : `${missing.length} chunk(s) 404`;
        console.log(`  persists ${f.path} — ${reason} (attempt ${attempt})`);
        next.push({ ...f, reason });
      }
    }
    pending = next;
  }

  if (!pending.length) {
    console.log("\n✓ All flagged routes healed within the settle window (transient rollout, not a stuck cache).");
    return;
  }

  console.error(`\n✗ ${pending.length} route(s) serve stuck-stale chunks (proxy cache did not catch up):`);
  for (const p of pending) console.error(`  - ${p.path} — ${p.reason}`);
  console.error(
    "\nThe MassTranslate proxy is serving an old build's HTML whose chunks no longer exist on the origin. " +
      "Purge / re-run deploy_translations for these routes, and confirm Vercel Skew Protection retention " +
      "covers the proxy cache TTL so old chunks stay resolvable during the lag."
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("monitor error:", err);
  process.exit(2);
});
