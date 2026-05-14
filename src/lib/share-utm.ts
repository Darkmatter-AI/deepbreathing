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

// Strip " | Brand" or " — Brand" suffix from a page title so the result
// reads naturally as a share message.
function stripSiteSuffix(title: string): string {
  const stripped = title.split(/ [|—–] /)[0]?.trim();
  return stripped || title;
}

// Read the current page's title at click time. document.title is translated
// by the mass-translate proxy on /pt/, /de/, /es/, /fr/, /ja/ — so this
// returns a localized title without any per-locale dictionary maintenance.
export function getLocalizedShareTitle(fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const t = document.title?.trim();
  return t ? stripSiteSuffix(t) : fallback;
}

// Get share text in the page's language. Mass-translate translates <title>
// and visible body content but NOT meta tags or JS-bundled strings, so on
// non-English locales the curated English prop and the meta description
// are both still English. Fall back to document.title (translated) so the
// share message is at least in the user's language — at the cost of a
// slightly more formal tone than the hand-written EN copy.
export function getLocalizedShareText(fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const lang = (document.documentElement.lang || "en").toLowerCase();
  if (lang.startsWith("en")) {
    // EN: meta description is the curated SEO copy. Prefer it over the prop
    // when present; both are English so tone-wise they're interchangeable.
    const desc = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
      ?.trim();
    return desc || fallback;
  }
  // Non-EN: meta description is still English (mass-translate skips it), so
  // use the translated document.title as the share message body.
  const t = document.title?.trim();
  return t ? stripSiteSuffix(t) : fallback;
}
