export const APP_STORE_URL =
  "https://apps.apple.com/us/app/deep-breathing-calm-sleep/id6786431781";

export type AppStorePromotionVariant = "landing" | "strip";

const CAMPAIGN_PARAMETER_NAMES = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const AD_CLICK_ID_NAMES = ["gclid", "dclid", "gbraid", "wbraid"] as const;
const APPLE_CAMPAIGN_TOKEN = "dbe_website";

function shortHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function createAppleCampaignToken(pathname: string) {
  const readablePath =
    pathname === "/"
      ? "home"
      : pathname
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
  const readablePrefix = readablePath.slice(0, 18) || "page";

  return `web_${readablePrefix}_${shortHash(pathname)}`.slice(0, 30);
}

export function createAppStoreDestination({
  currentUrl,
  providerToken = "129077591",
}: {
  currentUrl: URL;
  providerToken?: string;
}) {
  const destination = new URL(APP_STORE_URL);
  const effectiveProviderToken = providerToken.trim() || "129077591";
  if (!/^\d+$/.test(effectiveProviderToken)) {
    return destination.toString();
  }

  destination.searchParams.set("pt", effectiveProviderToken);
  destination.searchParams.set("ct", APPLE_CAMPAIGN_TOKEN);
  destination.searchParams.set("mt", "8");
  return destination.toString();
}

export function createAppStoreAnalyticsParams({
  currentUrl,
  destination,
  variant,
}: {
  currentUrl: URL;
  destination: string;
  variant: AppStorePromotionVariant;
}) {
  const params: Record<string, string | boolean> = {
    app_store_placement: variant,
    origin_path: currentUrl.pathname,
    link_domain: "apps.apple.com",
    link_url: destination,
    outbound: true,
  };

  for (const name of CAMPAIGN_PARAMETER_NAMES) {
    const value = currentUrl.searchParams.get(name);
    if (value) params[name] = value.slice(0, 100);
  }

  for (const name of AD_CLICK_ID_NAMES) {
    if (currentUrl.searchParams.has(name)) params[`has_${name}`] = true;
  }

  try {
    const appleCampaign = new URL(destination).searchParams.get("ct");
    if (appleCampaign) params.apple_campaign = appleCampaign;
  } catch {
    // Keep analytics resilient if a caller supplies an invalid destination.
  }

  return params;
}
