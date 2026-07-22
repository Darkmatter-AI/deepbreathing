import {
  isIndexNowSubmissionEnvironment,
  runSitemapPingWorkflow,
} from "./ping-sitemap-lib.mjs";

await runSitemapPingWorkflow({
  ci: isIndexNowSubmissionEnvironment(process.env),
  sitemapUrl: process.env.SITEMAP_URL,
});
