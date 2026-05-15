#!/usr/bin/env node
// Build src/data/og-translations.json by scraping the live site.
//
// For every canonical (EN) URL in the sitemap:
//   1. Fetch the EN page → extract its og:image URL to determine the lookup key
//      (either a `title=...` query param value, or a `/og/<slug>` path slug).
//   2. For each non-EN locale, fetch /<locale><path> and capture its og:title.
//      mass-translate has already translated og:title at the proxy layer, so
//      whatever we read there is the authoritative localized headline.
//
// Result schema: `src/data/og-translations.json`
//   {
//     "byTitle": { "Free Online Box Breathing Timer": { "es": "…", "pt": "…", … } },
//     "bySlug":  { "4-7-8": { "es": "…", "pt": "…", … } }
//   }
//
// Run manually when translations drift:
//   node scripts/build-og-translations.mjs
//
// Commit the generated JSON to git. The /og and /og/[slug] route handlers
// import it and fall back to EN when a key/locale is missing — so a stale or
// partial JSON degrades gracefully to the EN-text image.

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "..");

const BASE = process.env.OG_BASE_URL ?? "https://deepbreathingexercises.com";
const LOCALES = ["es", "pt", "fr", "de", "ja"];
const CONCURRENCY = 4;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "og-translations-build/1.0" },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function findMeta(html, prop) {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const r1 = new RegExp(
    `<meta\\s+property=["']${escaped}["']\\s+content=["']([^"']+)["']`,
    "i",
  );
  const r2 = new RegExp(
    `<meta\\s+name=["']${escaped}["']\\s+content=["']([^"']+)["']`,
    "i",
  );
  return html.match(r1)?.[1] ?? html.match(r2)?.[1] ?? null;
}

const ENTITY_MAP = {
  "&amp;": "&",
  "&#x27;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};
function decodeEntities(s) {
  return s.replace(/&(amp|#x27|#39|quot|#34|lt|gt|nbsp);/gi, (m) => ENTITY_MAP[m.toLowerCase()] ?? m);
}

async function getOgImageKey(enPath) {
  const html = await fetchText(`${BASE}${enPath}`);
  const ogImage = findMeta(html, "og:image");
  if (!ogImage) return null;
  let parsed;
  try {
    parsed = new URL(ogImage, BASE);
  } catch {
    return null;
  }
  if (parsed.pathname === "/og") {
    const title = parsed.searchParams.get("title");
    return title ? { kind: "title", key: title } : null;
  }
  const slugMatch = parsed.pathname.match(/^\/og\/([^/?#]+)$/);
  if (slugMatch) return { kind: "slug", key: decodeURIComponent(slugMatch[1]) };
  return null;
}

async function getTranslatedOgTitle(locale, enPath) {
  const html = await fetchText(`${BASE}/${locale}${enPath}`);
  const t = findMeta(html, "og:title");
  return t ? decodeEntities(t) : null;
}

async function runParallel(items, worker) {
  const queue = [...items];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (next === undefined) break;
      await worker(next);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log(`Fetching sitemap from ${BASE}/sitemap.xml`);
  const sitemap = await fetchText(`${BASE}/sitemap.xml`);
  const allUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  // Distinct EN paths only (those without /es/, /pt/, /fr/, /de/, /ja/ prefix).
  const enPaths = [
    ...new Set(
      allUrls
        .map((u) => new URL(u).pathname)
        .filter(
          (p) =>
            !LOCALES.some((l) => p === `/${l}` || p.startsWith(`/${l}/`)),
        )
        .map((p) => (p === "/" ? "" : p)),
    ),
  ];
  console.log(`Found ${enPaths.length} canonical EN paths`);

  const byTitle = {};
  const bySlug = {};
  let processed = 0;
  let skipped = 0;

  await runParallel(enPaths, async (enPath) => {
    let info;
    try {
      info = await getOgImageKey(enPath);
    } catch (e) {
      console.warn(`  skip ${enPath || "/"}: ${e.message}`);
      skipped++;
      return;
    }
    if (!info) {
      skipped++;
      return;
    }

    const target = info.kind === "title" ? byTitle : bySlug;
    target[info.key] = target[info.key] ?? {};

    await Promise.all(
      LOCALES.map(async (locale) => {
        try {
          const translated = await getTranslatedOgTitle(locale, enPath);
          if (translated) target[info.key][locale] = translated;
        } catch (e) {
          // Translated page missing or errored — leave the locale out so the
          // /og route falls back to EN. Logged but not fatal.
          console.warn(`  ${enPath || "/"} [${locale}]: ${e.message}`);
        }
      }),
    );

    processed++;
    if (processed % 10 === 0) console.log(`  processed ${processed}/${enPaths.length}`);
  });

  // Sort keys deterministically so diffs stay clean.
  const sortRecord = (rec) =>
    Object.fromEntries(
      Object.keys(rec)
        .sort()
        .map((k) => [
          k,
          Object.fromEntries(Object.entries(rec[k]).sort(([a], [b]) => a.localeCompare(b))),
        ]),
    );

  const out = {
    generatedAt: new Date().toISOString(),
    source: BASE,
    byTitle: sortRecord(byTitle),
    bySlug: sortRecord(bySlug),
  };

  const outPath = resolve(repoRoot, "src/data/og-translations.json");
  if (!existsSync(dirname(outPath))) await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n");

  console.log(
    `\nDone. processed=${processed} skipped=${skipped}` +
      ` byTitle=${Object.keys(byTitle).length} bySlug=${Object.keys(bySlug).length}` +
      `\nWrote ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
