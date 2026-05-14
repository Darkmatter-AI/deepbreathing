// Fetches Inter Regular (400) and Bold (700) from Google Fonts for use with
// @vercel/og's ImageResponse. Without explicit fonts, satori silently fails
// mid-stream on the edge runtime — the response gets HTTP 200 + image/png +
// 0-byte body, which is the bug we're fixing here.

type InterDescriptor = {
  name: "Inter";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

type JpDescriptor = {
  name: "Noto Sans JP";
  data: ArrayBuffer;
  weight: 700;
  style: "normal";
};

export type OgFont = InterDescriptor | JpDescriptor;

// Google Fonts returns TTF when the UA looks like an old desktop browser;
// modern UAs get WOFF2, which satori can't read.
const FONT_UA = "Mozilla/5.0 (X11; Linux x86_64)";

async function fetchFontFromCss(cssUrl: string): Promise<ArrayBuffer> {
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": FONT_UA } });
  if (!cssRes.ok) {
    throw new Error(`Font CSS fetch failed: ${cssUrl} ${cssRes.status}`);
  }
  const css = await cssRes.text();
  // Google Fonts serves TTF binaries from a `.ttf` URL for full-font requests
  // and from a `/l/font?kit=…` URL (no extension) for subsetted requests via
  // `text=`. Match the binary URL regardless of extension, anchored on the
  // adjacent `format('truetype')` so we never grab a WOFF2 src by mistake.
  const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('truetype'\)/)?.[1];
  if (!url) {
    throw new Error(`No TTF URL found in CSS: ${cssUrl}`);
  }
  const ttfRes = await fetch(url);
  if (!ttfRes.ok) {
    throw new Error(`TTF fetch failed: ${url} ${ttfRes.status}`);
  }
  return ttfRes.arrayBuffer();
}

async function fetchInterTtf(weight: 400 | 700): Promise<ArrayBuffer> {
  return fetchFontFromCss(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`);
}

// Noto Sans JP via the `text=` param returns a glyph subset — for our use we
// only need the single word "BREATHE" translated to ja (e.g. 呼吸), so we ship
// a tiny ~2KB font instead of the full multi-megabyte Japanese set.
async function fetchNotoSansJpSubset(text: string): Promise<ArrayBuffer> {
  const params = new URLSearchParams();
  params.set("family", "Noto Sans JP:wght@700");
  params.set("text", text);
  return fetchFontFromCss(`https://fonts.googleapis.com/css2?${params.toString()}`);
}

export async function loadOgFonts(options?: { jpSubset?: string }): Promise<OgFont[]> {
  const tasks: Array<Promise<OgFont>> = [
    fetchInterTtf(400).then((data) => ({ name: "Inter", data, weight: 400, style: "normal" } as const)),
    fetchInterTtf(700).then((data) => ({ name: "Inter", data, weight: 700, style: "normal" } as const)),
  ];
  if (options?.jpSubset) {
    tasks.push(
      fetchNotoSansJpSubset(options.jpSubset).then(
        (data) => ({ name: "Noto Sans JP", data, weight: 700, style: "normal" } as const),
      ),
    );
  }
  return Promise.all(tasks);
}

// Back-compat alias for any caller still importing loadInterFonts.
export const loadInterFonts = () => loadOgFonts();
