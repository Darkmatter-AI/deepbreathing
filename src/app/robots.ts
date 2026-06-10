import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawlers off API routes (incl. the mass-translate companion
      // bundles served under /api/proxy/) and the Vercel Analytics beacon —
      // together they were ~40% of Googlebot requests with zero index value.
      disallow: ["/api/", "/_vercel/"],
    },
    sitemap: "https://deepbreathingexercises.com/sitemap.xml",
  };
}
