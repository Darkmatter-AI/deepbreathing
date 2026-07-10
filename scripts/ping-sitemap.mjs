import { isCiEnvironment, runSitemapPingWorkflow } from "./ping-sitemap-lib.mjs";

await runSitemapPingWorkflow({
  ci: isCiEnvironment(process.env),
  sitemapUrl: process.env.SITEMAP_URL,
});
