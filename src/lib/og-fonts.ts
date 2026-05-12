// Fetches Inter Regular (400) and Bold (700) from Google Fonts for use with
// @vercel/og's ImageResponse. Without explicit fonts, satori silently fails
// mid-stream on the edge runtime — the response gets HTTP 200 + image/png +
// 0-byte body, which is the bug we're fixing here.

type FontDescriptor = {
  name: "Inter";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

async function fetchInterTtf(weight: 400 | 700): Promise<ArrayBuffer> {
  // Google Fonts returns TTF when the request looks like an old browser; modern
  // UAs get WOFF2 which satori doesn't handle.
  const cssRes = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
    { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" } },
  );
  if (!cssRes.ok) {
    throw new Error(`Inter ${weight} CSS fetch failed: ${cssRes.status}`);
  }
  const css = await cssRes.text();
  const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) {
    throw new Error(`Inter ${weight} TTF URL not found in Google Fonts CSS`);
  }
  const ttfRes = await fetch(url);
  if (!ttfRes.ok) {
    throw new Error(`Inter ${weight} TTF fetch failed: ${ttfRes.status}`);
  }
  return ttfRes.arrayBuffer();
}

export async function loadInterFonts(): Promise<FontDescriptor[]> {
  const [regular, bold] = await Promise.all([
    fetchInterTtf(400),
    fetchInterTtf(700),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
  ];
}
