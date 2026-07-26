import {
  deriveChangedCanonicalUrls,
  getChangedFilesForDeployment,
  isIndexNowSubmissionEnvironment,
  runSitemapPingWorkflow,
} from "./ping-sitemap-lib.mjs";
import path from "node:path";

import {
  buildSitemapEntries,
  EDGE_PROXY_LOCALE_PREFIXES,
} from "../src/lib/seo/sitemap-routes.mjs";

const ci = isIndexNowSubmissionEnvironment(process.env);
let changedUrls = null;

if (ci) {
  const changedFiles = getChangedFilesForDeployment({
    previousSha: process.env.VERCEL_GIT_PREVIOUS_SHA,
    currentSha: process.env.VERCEL_GIT_COMMIT_SHA,
  });

  if (changedFiles) {
    const canonicalUrls = buildSitemapEntries({
      appDir: path.join(process.cwd(), "src", "app"),
      siteUrl: "https://deepbreathingexercises.com",
      localePrefixes: EDGE_PROXY_LOCALE_PREFIXES,
    }).map((entry) => entry.url);

    changedUrls = deriveChangedCanonicalUrls({ changedFiles, canonicalUrls });
  }
}

await runSitemapPingWorkflow({
  ci,
  changedUrls,
});
