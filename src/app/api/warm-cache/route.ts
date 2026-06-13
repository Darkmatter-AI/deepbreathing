import { NextRequest, NextResponse } from "next/server";

import { isLocaleUrl as isLocaleUrlForSite } from "@/lib/seo/sitemap-routes";

// Keep this on Node and never statically optimized — it must run on every hit.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE_URL = "https://deepbreathingexercises.com";
// Fetch the URL list from the `origin.` alias so it bypasses the mass-translate
// Worker (the one request-mutating layer); we only want the proxy in the loop
// when warming the page URLs themselves, which point at the apex. (gotcha #13)
const SITEMAP_URL = "https://origin.deepbreathingexercises.com/sitemap.xml";

// Googlebot UA so the mass-translate edge proxy serves the fully-translated
// server HTML path and stores it in KV (x-mt-cache) — the exact path real
// crawlers hit. A browser UA would only warm the Vercel edge and leave the
// proxy's translation cache cold, which is what tanked the Ahrefs crawl.
const CRAWLER_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

// Concurrency must stay well under the mass-translate proxy's anti-spoof limit:
// bulk bot-UA fetches trip persistent 503s at ~10 concurrent (tools-and-data-
// sources.md gotcha #16d). 6 is verified safe. Do NOT raise this. We also warm
// English canonicals first (cheap, Vercel-cached) so that by the time we hit
// locale URLs the origin is hot and each proxy fetch only pays the
// translation-assembly cost, not a cold transatlantic SSR.
const CONCURRENCY = 6;
// Cap per-fetch so a handful of pathologically cold pages can't push a fully
// cold first run (post-deploy) past the 300s function limit and drop the
// slow-tail locale URLs — the ones that most need warming. A partial warm is
// self-healing: the next cron run (every 2h) re-covers whatever was missed.
const FETCH_TIMEOUT_MS = 15_000;

type WarmResult = {
  url: string;
  status: number;
  mtCache: string | null;
  vercelCache: string | null;
  ms: number;
  error?: string;
};

function isLocaleUrl(url: string): boolean {
  return isLocaleUrlForSite(url, SITE_URL);
}

async function getSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": CRAWLER_UA },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`sitemap fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
  return Array.from(new Set(locs));
}

async function warmOne(url: string): Promise<WarmResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": CRAWLER_UA, Accept: "text/html" },
      signal: controller.signal,
      cache: "no-store",
    });
    // Drain the body so the origin fully renders and the proxy fully translates.
    await res.arrayBuffer();
    return {
      url,
      status: res.status,
      mtCache: res.headers.get("x-mt-cache"),
      vercelCache: res.headers.get("x-vercel-cache"),
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      mtCache: null,
      vercelCache: null,
      ms: Date.now() - started,
      error: (err as Error).name,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function warmAll(urls: string[]): Promise<WarmResult[]> {
  const results: WarmResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++;
      results.push(await warmOne(urls[index]));
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker())
  );
  return results;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when the env var is
  // set. We also accept `?token=` for manual runs. If no secret is configured
  // the endpoint stays open (harmless: it only fetches public URLs).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    const token = req.nextUrl.searchParams.get("token");
    if (authHeader !== `Bearer ${secret}` && token !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();

  let urls: string[];
  try {
    urls = await getSitemapUrls();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 }
    );
  }

  const english = urls.filter((u) => !isLocaleUrl(u));
  const locale = urls.filter(isLocaleUrl);

  // English first to warm the Vercel origin, then locale through the proxy.
  const englishResults = await warmAll(english);
  const localeResults = await warmAll(locale);
  const results = [...englishResults, ...localeResults];

  const succeeded = results.filter((r) => r.status >= 200 && r.status < 400);
  const failed = results.filter((r) => !(r.status >= 200 && r.status < 400));

  return NextResponse.json({
    ok: failed.length === 0,
    durationMs: Date.now() - started,
    total: results.length,
    english: english.length,
    locale: locale.length,
    succeeded: succeeded.length,
    failed: failed.length,
    proxyCache: {
      hit: results.filter((r) => r.mtCache === "HIT").length,
      miss: results.filter((r) => r.mtCache === "MISS").length,
    },
    failedUrls: failed.slice(0, 25).map((r) => ({
      url: r.url,
      status: r.status,
      error: r.error,
    })),
    slowest: [...results]
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10)
      .map((r) => ({ url: r.url, ms: r.ms, status: r.status, mtCache: r.mtCache })),
  });
}
