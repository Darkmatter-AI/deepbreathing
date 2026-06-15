import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawlers off API routes (incl. the mass-translate companion
      // bundles served under /api/proxy/) and the Vercel Analytics beacon —
      // together they were ~40% of Googlebot requests with zero index value.
      // /*?duration= + /*&duration= block zero-value timer deep-links: the
      // mass-translate proxy preserves ?duration= in the hreflang/canonical it
      // injects on locale pages (English strips it), which produced 50 Ahrefs
      // "hreflang to non-canonical" errors. 0 GSC/Bing impressions, not in sitemap.
      disallow: ["/api/", "/_vercel/", "/*?duration=", "/*&duration="],
    },
    sitemap: "https://deepbreathingexercises.com/sitemap.xml",
  };
}
