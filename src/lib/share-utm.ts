export type ShareMedium = "native" | "copy";

export function appendShareUtm(url: string, medium: ShareMedium = "copy"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "share");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", "user_share");
    return u.toString();
  } catch {
    return url;
  }
}

// Read the current page's title and meta description at click time so shares
// from mass-translated locales (/pt/, /de/, …) pick up the localized text
// instead of the hardcoded English props passed at server-render time.
export function getLocalizedShareText(fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const meta = document.querySelector('meta[name="description"]');
  const desc = meta?.getAttribute("content")?.trim();
  return desc || fallback;
}

export function getLocalizedShareTitle(fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return document.title?.trim() || fallback;
}
