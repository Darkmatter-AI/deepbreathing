import { execFileSync } from "node:child_process";

const DEFAULT_HOST = "deepbreathingexercises.com";
const DEFAULT_SITE_URL = `https://${DEFAULT_HOST}`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_INDEXNOW_KEY = "a3713189855e4e2983f434ab249fcea1";
const DEEP_BREATHING_VERCEL_PROJECT_ID = "prj_zcWnwD9I2TinOJjvzFyamBJMLL8T";
export const INDEXNOW_BATCH_LIMIT = 10_000;

const FULL_SHA = /^[0-9a-f]{40}$/i;
const AMBIGUOUS_ROUTE_INPUTS = [
  "next.config.js",
  "src/components/",
  "src/data/",
  "src/lib/",
];

/**
 * IndexNow announces production URLs. Requiring Vercel's deployment and project
 * identifiers prevents copied production env values, previews, and generic CI
 * jobs from turning a local build into an external side effect.
 */
export function isIndexNowSubmissionEnvironment(env) {
  return (
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "production" &&
    env.VERCEL_PROJECT_ID === DEEP_BREATHING_VERCEL_PROJECT_ID &&
    /^dpl_[A-Za-z0-9]+$/.test(env.VERCEL_DEPLOYMENT_ID ?? "") &&
    env.VERCEL_GIT_PROVIDER === "github"
  );
}

/**
 * VERCEL_GIT_PREVIOUS_SHA is the last successful deployment for the branch.
 * If either endpoint is missing, invalid, equal, or unavailable in the checkout,
 * there is no trustworthy deployment diff and callers must submit nothing.
 */
export function getChangedFilesForDeployment({
  previousSha,
  currentSha,
  execFileSyncImpl = execFileSync,
} = {}) {
  if (
    !FULL_SHA.test(previousSha ?? "") ||
    !FULL_SHA.test(currentSha ?? "") ||
    previousSha === currentSha
  ) {
    return null;
  }

  try {
    const output = execFileSyncImpl(
      "git",
      [
        "diff",
        "--name-only",
        "--diff-filter=ACMRT",
        previousSha,
        currentSha,
        "--",
      ],
      { encoding: "utf8" },
    );

    return Array.from(
      new Set(
        output
          .split("\n")
          .map((file) => file.trim().replaceAll("\\", "/"))
          .filter(Boolean),
      ),
    );
  } catch {
    return null;
  }
}

function routeFromEnglishPageFile(file) {
  const prefix = "src/app/(site-en)/";
  if (!file.startsWith(prefix) || !file.endsWith("/page.tsx")) return null;

  const routeSegments = file
    .slice(prefix.length, -"/page.tsx".length)
    .split("/")
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));

  if (routeSegments.some((segment) => segment.includes("[") || segment.includes("]"))) {
    return null;
  }

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

function isAmbiguousRouteInput(file) {
  if (AMBIGUOUS_ROUTE_INPUTS.some((input) => file === input || file.startsWith(input))) {
    return true;
  }

  if (file.startsWith("src/app/(site-localized)/")) return true;
  if (file.startsWith("src/app/(site-en)/")) {
    return !file.endsWith("/page.tsx") || routeFromEnglishPageFile(file) === null;
  }

  return (
    file.startsWith("src/app/") &&
    !file.startsWith("src/app/api/") &&
    !file.startsWith("src/app/(site-en)/")
  );
}

/**
 * Derive only routes with an unambiguous one-to-one page entry change. Shared
 * components, data, layouts, localized catch-all code, and SEO routing inputs
 * can affect multiple or parameterized routes, so those diffs fail closed.
 */
export function deriveChangedCanonicalUrls({ changedFiles, canonicalUrls, host = DEFAULT_HOST }) {
  if (!Array.isArray(changedFiles) || !Array.isArray(canonicalUrls)) return null;
  if (changedFiles.some(isAmbiguousRouteInput)) return null;

  const changedRoutes = new Set();
  for (const file of changedFiles) {
    const route = routeFromEnglishPageFile(file);
    if (route) changedRoutes.add(route);
  }

  const urls = [];
  for (const value of canonicalUrls) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (
      url.protocol !== "https:" ||
      url.hostname !== host ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    if (changedRoutes.has(url.pathname)) urls.push(url.toString());
  }

  return Array.from(new Set(urls));
}

function selectCanonicalUrls(values, host) {
  const selected = [];

  for (const value of values) {
    if (typeof value !== "string") continue;

    try {
      const url = new URL(value);
      if (
        url.protocol !== "https:" ||
        url.hostname !== host ||
        url.port ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        continue;
      }
      selected.push(url.toString());
    } catch {
      // Invalid URLs are excluded rather than weakening the production guard.
    }
  }

  return Array.from(new Set(selected));
}

async function submitIndexNow(fetchImpl, { endpoint, host, key, keyLocation, urlList }) {
  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });

  if (res.status >= 400) {
    const text = await res.text().catch(() => "");
    throw new Error(`IndexNow submission failed: ${res.status} ${text}`);
  }

  return res.status;
}

export async function runSitemapPingWorkflow({
  ci = false,
  changedUrls = null,
  host = DEFAULT_HOST,
  siteUrl = DEFAULT_SITE_URL,
  indexNowKey = DEFAULT_INDEXNOW_KEY,
  indexNowEndpoint = INDEXNOW_ENDPOINT,
  fetchImpl = fetch,
  logger = console,
  batchLimit = INDEXNOW_BATCH_LIMIT,
} = {}) {
  if (!ci) {
    logger.log("Skipping IndexNow; production deployment not detected.");
    return { skipped: true, indexNowSubmitted: false, submittedCount: 0, statuses: [] };
  }

  if (!Array.isArray(changedUrls)) {
    logger.log("IndexNow: No trustworthy changed-route manifest; submitting nothing.");
    return { skipped: false, indexNowSubmitted: false, submittedCount: 0, statuses: [] };
  }

  const urls = selectCanonicalUrls(changedUrls, host);
  if (urls.length === 0) {
    logger.log("IndexNow: No changed canonical URLs; submitting nothing.");
    return { skipped: false, indexNowSubmitted: false, submittedCount: 0, statuses: [] };
  }

  if (!Number.isInteger(batchLimit) || batchLimit < 1 || batchLimit > INDEXNOW_BATCH_LIMIT) {
    logger.warn("IndexNow submission warning", new Error("Invalid IndexNow batch limit"));
    return { skipped: false, indexNowSubmitted: false, submittedCount: 0, statuses: [] };
  }

  let submittedCount = 0;
  const statuses = [];

  try {
    for (let start = 0; start < urls.length; start += batchLimit) {
      const batch = urls.slice(start, start + batchLimit);
      const status = await submitIndexNow(fetchImpl, {
        endpoint: indexNowEndpoint,
        host,
        key: indexNowKey,
        keyLocation: `${siteUrl}/${indexNowKey}.txt`,
        urlList: batch,
      });
      submittedCount += batch.length;
      statuses.push(status);
      logger.log(`IndexNow: Submitted ${batch.length} changed URLs (status ${status})`);
    }
  } catch (error) {
    logger.warn("IndexNow submission warning", error);
  }

  return {
    skipped: false,
    indexNowSubmitted: submittedCount === urls.length,
    submittedCount,
    statuses,
  };
}
