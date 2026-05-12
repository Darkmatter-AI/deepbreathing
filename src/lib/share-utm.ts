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
