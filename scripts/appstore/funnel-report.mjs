#!/usr/bin/env node
/**
 * Read-only app acquisition funnel report.
 *
 * Sources:
 *   - GA4 Data API (service-account JWT)
 *   - App Store Connect Analytics Reports API (ASC JWT, if configured)
 *
 * This script never creates an Apple Analytics report request. Apple must
 * already have generated the requested Analytics Reports before the script
 * can read them. Missing or privacy-withheld rows are represented as missing,
 * never as fabricated zeroes.
 *
 * Examples:
 *   node scripts/appstore/funnel-report.mjs --help
 *   node scripts/appstore/funnel-report.mjs --source ga4 --format json
 *   node scripts/appstore/funnel-report.mjs --start 2026-08-01 --end 2026-08-31 \
 *     --source all --format markdown
 */

import { createSign } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { readApple } from "./apple-reports.mjs";

const DEFAULT_GA4_PROPERTY_ID = "527524722";
const DEFAULT_APP_ID = "6786431781";
const DEFAULT_TIME_ZONE = "Europe/Lisbon";
const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta/properties";
const REQUEST_TIMEOUT_MS = 45_000;
const APP_ACQUISITION_EVENTS = [
  "app_store_promotion_view",
  "app_store_click",
];

const HELP = `Read-only app acquisition funnel report for Deep Breathing.

Usage:
  node scripts/appstore/funnel-report.mjs [options]

Options:
  --start YYYY-MM-DD             Inclusive report start (default: 28 days before --end)
  --end YYYY-MM-DD               Inclusive report end (default: today - 2 days)
  --source all|ga4|apple         Providers to query (default: all)
  --format json|markdown         Output format (default: json)
  --output PATH                  Write the report to PATH instead of stdout
  --ga4-key PATH                 GA4 service-account JSON (otherwise env/default lookup)
  --property ID                  GA4 property ID (default: ${DEFAULT_GA4_PROPERTY_ID})
  --apple-app-id ID              App Store app ID (default: ${DEFAULT_APP_ID})
  --apple-request-id ID          Existing Analytics Report request to read
  --apple-report-name NAME       Report name or substring to select
  --help                         Show this help

Credential lookup (values are never printed):
  GA4_SA_KEY_FILE, GSC_SA_KEY_FILE, GOOGLE_APPLICATION_CREDENTIALS,
  or ~/.config/dbe-ga-visibility-sa.json

  ASC_KEY_ID + ASC_ISSUER_ID + ASC_PRIVATE_KEY_PATH
  (or ASC_PRIVATE_KEY containing the PEM text). ASC_APP_ID is optional.
  APPSTORE_CONNECT_* aliases are also accepted.

The Apple provider is read-only. It lists existing requests/reports, reads
DAILY instances, verifies and downloads all segments, and replaces older
processing-date partitions with newer ones. It does not request or create
reports.
`;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = {
    source: "all",
    format: "json",
    output: null,
    ga4Key: null,
    propertyId: DEFAULT_GA4_PROPERTY_ID,
    appleAppId: DEFAULT_APP_ID,
    appleRequestId: null,
    appleReportName: null,
    startDate: null,
    endDate: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (!arg.startsWith("--")) fail(`Unknown argument: ${arg}`);
    const name = arg.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      fail(`Missing value for --${name}`);
    }
    index += 1;

    if (name === "source") args.source = value;
    else if (name === "format") args.format = value;
    else if (name === "output") args.output = value;
    else if (name === "ga4-key") args.ga4Key = value;
    else if (name === "property") args.propertyId = value;
    else if (name === "apple-app-id") args.appleAppId = value;
    else if (name === "apple-request-id") args.appleRequestId = value;
    else if (name === "apple-report-name") args.appleReportName = value;
    else if (name === "start") args.startDate = value;
    else if (name === "end") args.endDate = value;
    else fail(`Unknown option: --${name}`);
  }

  if (!new Set(["all", "ga4", "apple"]).has(args.source)) {
    fail(`--source must be all, ga4, or apple; got ${args.source}`);
  }
  if (!new Set(["json", "markdown"]).has(args.format)) {
    fail(`--format must be json or markdown; got ${args.format}`);
  }
  if (!/^\d+$/.test(args.propertyId)) fail("--property must be numeric");
  if (!/^\d+$/.test(args.appleAppId)) fail("--apple-app-id must be numeric");

  const endDate = args.endDate ?? dateInTimeZone(offsetDate(new Date(), -2), DEFAULT_TIME_ZONE);
  const startDate = args.startDate ?? dateInTimeZone(offsetDate(parseDate(endDate), -27), DEFAULT_TIME_ZONE);
  assertDate(startDate, "--start");
  assertDate(endDate, "--end");
  if (startDate > endDate) fail("--start must be on or before --end");
  args.startDate = startDate;
  args.endDate = endDate;
  return args;
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`Invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    fail(`Invalid date: ${value}`);
  }
  return date;
}

function assertDate(value, label) {
  try {
    parseDate(value);
  } catch (error) {
    fail(error instanceof Error ? error.message.replace("Invalid date", `${label} invalid date`) : `${label} invalid date`);
  }
}

function offsetDate(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function nowIso() {
  return new Date().toISOString();
}

function resolvePath(value) {
  if (!value) return value;
  return value.replace(/^~/, homedir());
}

function envValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function unavailableSource(provider, reason, extra = {}) {
  return {
    provider,
    status: "unavailable",
    reason,
    ...extra,
  };
}

function errorSource(provider, error, extra = {}) {
  const safeError = error instanceof SafeHttpError ? `http_${error.status}` : "request_failed";
  return {
    provider,
    status: "error",
    reason: safeError,
    ...extra,
  };
}

class SafeHttpError extends Error {
  constructor(status, endpoint) {
    super(`HTTP ${status} from ${endpoint}`);
    this.name = "SafeHttpError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function fetchResponse(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchResponse(url, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers ?? {}) },
  });
  if (!response.ok) throw new SafeHttpError(response.status, new URL(url).pathname);
  return response.json();
}

function metric(value, { missingReason = "No row was returned by the source" } = {}) {
  if (value === null || value === undefined) {
    return { value: null, status: "missing", missingReason };
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { value: null, status: "missing", missingReason: "Source value was not numeric" };
  }
  return { value: numeric, status: numeric === 0 ? "zero" : "observed" };
}

function unavailableMetric(reason) {
  return { value: null, status: "unavailable", missingReason: reason };
}

function errorMetric(reason) {
  return { value: null, status: "error", missingReason: reason };
}

function rowDimension(row, index) {
  return row.dimensionValues?.[index]?.value ?? "";
}

function rowMetric(row, index) {
  return row.metricValues?.[index]?.value ?? null;
}

function inListFilter(fieldName, values) {
  return {
    filter: {
      fieldName,
      inListFilter: { values },
    },
  };
}

async function exchangeGoogleToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: GA4_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify(claim)).toString("base64url")}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const response = await fetchResponse("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new SafeHttpError(response.status, "/token");
  const body = await response.json();
  if (!body.access_token) fail("Google token response did not include an access token");
  return body.access_token;
}

function findGa4KeyPath(explicitPath) {
  const configured = explicitPath ?? envValue("GA4_SA_KEY_FILE", "GSC_SA_KEY_FILE", "GOOGLE_APPLICATION_CREDENTIALS");
  if (configured) return resolvePath(configured);
  const fallback = `${homedir()}/.config/dbe-ga-visibility-sa.json`;
  return existsSync(fallback) ? fallback : null;
}

async function readGa4(args, reportMeta) {
  const keyPath = findGa4KeyPath(args.ga4Key);
  if (!keyPath) {
    return unavailableSource("ga4", "credentials_missing", {
      credentials: "service_account_json",
      env: ["GA4_SA_KEY_FILE", "GSC_SA_KEY_FILE", "GOOGLE_APPLICATION_CREDENTIALS"],
    });
  }

  let key;
  try {
    key = JSON.parse(readFileSync(keyPath, "utf8"));
    if (!key.client_email || !key.private_key) fail("service account JSON missing required fields");
  } catch {
    return unavailableSource("ga4", "credentials_invalid", { credentials: "service_account_json" });
  }

  const retrievedAt = nowIso();
  const provenance = {
    provider: "ga4-data-api",
    propertyId: args.propertyId,
    endpoint: `${GA4_ENDPOINT}/${args.propertyId}:runReport`,
    requestedDateRange: { startDate: args.startDate, endDate: args.endDate },
    retrievedAt,
    timeZone: DEFAULT_TIME_ZONE,
    maturityNote: "The default end date is today minus two days because GA4 engagement metrics can mature over approximately 48 hours.",
  };

  try {
    const token = await exchangeGoogleToken(key);
    const report = async ({ dimensions, dimensionFilter } = {}) => {
      const body = {
        dateRanges: [{ startDate: args.startDate, endDate: args.endDate }],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: [{ name: "totalUsers" }, { name: "eventCount" }],
        ...(dimensionFilter ? { dimensionFilter } : {}),
        limit: 1000,
      };
      return fetchJson(`${GA4_ENDPOINT}/${args.propertyId}:runReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    const eventFilter = inListFilter("eventName", APP_ACQUISITION_EVENTS);
    const [totals, platforms, campaigns, website] = await Promise.all([
      report({ dimensions: ["eventName"], dimensionFilter: eventFilter }),
      report({ dimensions: ["eventName", "platform"], dimensionFilter: eventFilter }),
      report({
        dimensions: ["eventName", "sessionSource", "sessionMedium", "sessionCampaignName"],
        dimensionFilter: eventFilter,
      }),
      report({ dimensions: [] }),
    ]);
    let placement = null;
    let pagePaths = null;
    try {
      placement = await report({
        dimensions: ["eventName", "customEvent:app_store_placement"],
        dimensionFilter: eventFilter,
      });
    } catch {
      // app_store_placement is only available after a GA4 custom dimension is
      // registered. Keep the core event report usable when it is not.
    }
    try {
      pagePaths = await report({
        dimensions: ["eventName", "pagePath"],
        dimensionFilter: eventFilter,
      });
    } catch {
      // Keep the core event report usable if the property disallows pagePath.
    }

    const events = {};
    for (const eventName of APP_ACQUISITION_EVENTS) {
      const row = (totals.rows ?? []).find((candidate) => rowDimension(candidate, 0) === eventName);
      events[eventName] = {
        users: row ? metric(rowMetric(row, 0)) : metric(null),
        events: row ? metric(rowMetric(row, 1)) : metric(null),
      };
    }

    const platformRows = {};
    for (const row of platforms.rows ?? []) {
      const eventName = rowDimension(row, 0);
      const platform = rowDimension(row, 1) || "(not set)";
      platformRows[eventName] ??= {};
      platformRows[eventName][platform] = {
        users: metric(rowMetric(row, 0)),
        events: metric(rowMetric(row, 1)),
      };
    }

    const campaignRows = (campaigns.rows ?? []).map((row) => ({
      eventName: rowDimension(row, 0),
      source: rowDimension(row, 1) || "(not set)",
      medium: rowDimension(row, 2) || "(not set)",
      campaign: rowDimension(row, 3) || "(not set)",
      users: metric(rowMetric(row, 0)),
      events: metric(rowMetric(row, 1)),
    }));

    const placementRows = placement
      ? (placement.rows ?? []).map((row) => ({
          eventName: rowDimension(row, 0),
          placement: rowDimension(row, 1) || "(not set)",
          users: metric(rowMetric(row, 0)),
          events: metric(rowMetric(row, 1)),
        }))
      : [];
    const pagePathRows = pagePaths
      ? (pagePaths.rows ?? []).map((row) => ({
          eventName: rowDimension(row, 0),
          pagePath: rowDimension(row, 1) || "(not set)",
          users: metric(rowMetric(row, 0)),
          events: metric(rowMetric(row, 1)),
        }))
      : [];

    return {
      provider: "ga4",
      status: "ok",
      provenance,
      websiteUsers: metric(rowMetric(website.rows?.[0] ?? {}, 0)),
      dataQuality: Object.fromEntries(Object.entries({ totals, platforms, campaigns, website, placement, pagePaths }).map(([name, response]) => [name, response ? {
        ...(response.metadata ?? {}),
        returnedRows: response.rows?.length ?? 0,
        rowCount: response.rowCount ?? 0,
        truncated: (response.rowCount ?? 0) > (response.rows?.length ?? 0),
      } : { status: "unavailable" }])),
      events,
      platformBreakdown: platformRows,
      campaignAttribution: {
        status: campaignRows.length ? "ok" : "missing",
        rows: campaignRows,
        missingReason: campaignRows.length ? undefined : "No campaign-dimension rows were returned for the selected App Store events",
      },
      placementBreakdown: {
        status: placement ? (placementRows.length ? "ok" : "missing") : "unavailable",
        rows: placementRows,
        missingReason: placement
          ? placementRows.length
            ? undefined
            : "No placement rows were returned for the selected App Store events"
          : "GA4 custom dimension app_store_placement is not registered or is unavailable",
      },
      pageBreakdown: {
        status: pagePaths ? (pagePathRows.length ? "ok" : "missing") : "unavailable",
        rows: pagePathRows,
        missingReason: pagePaths
          ? pagePathRows.length
            ? undefined
            : "No pagePath rows were returned for the selected App Store events"
          : "GA4 pagePath dimension is unavailable for this report",
      },
      query: {
        eventNames: APP_ACQUISITION_EVENTS,
        metrics: ["totalUsers", "eventCount"],
        campaignDimensions: ["sessionSource", "sessionMedium", "sessionCampaignName"],
        placementDimensions: ["customEvent:app_store_placement"],
        pageDimensions: ["pagePath"],
      },
      reportMeta,
    };
  } catch (error) {
    return errorSource("ga4", error, { provenance });
  }
}

function ratio(numerator, denominator, label) {
  if (![numerator, denominator].every((value) => value && ["observed", "zero"].includes(value.status))) {
    return { value: null, status: "missing", missingReason: `${label} requires both source metrics` };
  }
  if (numerator.value === null || denominator.value === null) {
    return { value: null, status: "missing", missingReason: `${label} requires both source metrics` };
  }
  if (denominator.value === 0) {
    return { value: null, status: "missing", missingReason: `${label} denominator is zero` };
  }
  const value = numerator.value / denominator.value;
  return { value, status: value === 0 ? "zero" : "observed" };
}

function unavailableEvents() {
  return Object.fromEntries(APP_ACQUISITION_EVENTS.map((eventName) => [
    eventName,
    { users: unavailableMetric("GA4 source unavailable"), events: unavailableMetric("GA4 source unavailable") },
  ]));
}

export function buildNormalizedReport(args, ga4, apple) {
  const ga4Events = ga4?.status === "ok" ? ga4.events : unavailableEvents();
  const appleMetrics = apple?.downloads
    ? apple.downloads.metrics
    : {
        firstTimeDownloads: apple?.status === "error" ? errorMetric(apple.reason) : unavailableMetric("Apple Analytics Reports source unavailable"),
        redownloads: apple?.status === "error" ? errorMetric(apple.reason) : unavailableMetric("Apple Analytics Reports source unavailable"),
        totalDownloads: apple?.status === "error" ? errorMetric(apple.reason) : unavailableMetric("Apple Analytics Reports source unavailable"),
      };
  const ga4Metric = (value, query) => ga4?.dataQuality?.[query]?.truncated ? { value: null, status: "partial", missingReason: "ga4_rows_truncated" } : value;
  const appStoreViews = ga4Metric(ga4Events.app_store_promotion_view?.users ?? unavailableMetric("GA4 source unavailable"), "totals");
  const appStoreClicks = ga4Metric(ga4Events.app_store_click?.users ?? unavailableMetric("GA4 source unavailable"), "totals");
  const warnings = [];
  for (const [query, quality] of Object.entries(ga4?.dataQuality ?? {})) {
    if (quality.truncated) warnings.push({ source: "ga4", query, reason: "ga4_rows_truncated", returnedRows: quality.returnedRows, rowCount: quality.rowCount });
  }
  for (const [name, dataset] of Object.entries(apple?.ingestion ?? {})) {
    if (dataset && dataset.status !== "ok") warnings.push({ source: "apple", report: name, status: dataset.status, reason: dataset.reason, issues: dataset.issues, warnings: dataset.warnings, missingDates: dataset.coverage?.missingDates, verifiedSegmentCount: dataset.instances?.verifiedSegmentCount, segmentCount: dataset.instances?.segmentCount, allRequiredSegmentsVerified: dataset.instances?.allRequiredSegmentsVerified });
  }
  if (apple?.status === "error") warnings.push({ source: "apple", reason: apple.reason });

  return {
    schemaVersion: 1,
    generatedAt: nowIso(),
    requestedDateRange: { startDate: args.startDate, endDate: args.endDate, timeZone: DEFAULT_TIME_ZONE },
    warnings,
    funnel: {
      steps: [
        { id: "web_visitors", label: "Website visitors", source: "ga4", users: ga4Metric(ga4?.websiteUsers ?? unavailableMetric("GA4 source unavailable"), "website") },
        { id: "web_promotion_view", label: "Website App Store promotion viewed", source: "ga4", users: appStoreViews, events: ga4Metric(ga4Events.app_store_promotion_view?.events ?? unavailableMetric("GA4 source unavailable"), "totals") },
        { id: "web_app_store_click", label: "Website App Store link clicked", source: "ga4", users: appStoreClicks, events: ga4Metric(ga4Events.app_store_click?.events ?? unavailableMetric("GA4 source unavailable"), "totals") },
        { id: "apple_first_time_download", label: "App Store first-time download (all sources)", source: "apple", count: appleMetrics.firstTimeDownloads },
        { id: "apple_redownload", label: "App Store redownload (all sources)", source: "apple", count: appleMetrics.redownloads },
      ],
      conversionRates: {
        promotionViewToClickUsers: ratio(appStoreClicks, appStoreViews, "Promotion view to click"),
      },
      interpretationNote: "GA4 website users/events and Apple all-source downloads are separate measurements. Downloads do not prove website attribution or native first launch. Missing, privacy-withheld, or incomplete Apple counts remain unknown and must not be used for numeric trends.",
    },
    sources: { ga4, apple },
    campaignAttribution: {
      ga4: ga4?.status === "ok" ? ga4.campaignAttribution : { status: ga4?.status ?? "unavailable", rows: [], missingReason: "GA4 source unavailable" },
      apple: apple?.campaignAttribution ?? { status: apple?.status ?? "unavailable", rows: [], missingReason: "Apple Analytics Reports source unavailable" },
    },
    provenance: {
      generatedAt: nowIso(),
      sources: [ga4?.provenance, apple?.provenance].filter(Boolean),
    },
  };
}

function formatMetric(value, suffix = "") {
  if (!value || !["observed", "zero"].includes(value.status) || !Number.isFinite(value.value)) return `n/a (${value?.status ?? "missing"})`;
  const rendered = suffix === "%" ? `${(value.value * 100).toFixed(2)}%` : `${value.value}${suffix}`;
  return rendered;
}

export function renderMarkdown(report) {
  const lines = [
    "# App acquisition funnel report",
    "",
    `Window: ${report.requestedDateRange.startDate} to ${report.requestedDateRange.endDate} (${report.requestedDateRange.timeZone})`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Funnel",
    "",
    "| Step | Source | Value |",
    "| --- | --- | ---: |",
  ];
  for (const step of report.funnel.steps) {
    const value = step.count ?? step.users;
    lines.push(`| ${step.label} | ${step.source} | ${formatMetric(value)} |`);
  }
  lines.push(
    "",
    "## Conversion rates",
    "",
    "| Rate | Value |",
    "| --- | ---: |",
    `| Promotion view → click | ${formatMetric(report.funnel.conversionRates.promotionViewToClickUsers, "%")} |`,
    "",
    report.funnel.interpretationNote,
    "",
    "## Campaign attribution",
    "",
    `GA4: ${report.campaignAttribution.ga4.status}; Apple: ${report.campaignAttribution.apple.status}`,
    "",
    "| Provider | Campaign/source | Users/downloads |",
    "| --- | --- | ---: |",
  );
  for (const row of report.campaignAttribution.ga4.rows ?? []) {
    lines.push(`| GA4 | ${row.source} / ${row.medium} / ${row.campaign} (${row.eventName}) | ${formatMetric(row.users)} |`);
  }
  for (const row of report.campaignAttribution.apple.rows ?? []) {
    lines.push(`| Apple | ${row.campaign} | ${formatMetric(row.totalDownloads)} |`);
  }
  lines.push(
    "",
    "## Source status",
    "",
    `- GA4: ${report.sources.ga4.status}`,
    `- Apple: ${report.sources.apple.status}`,
    "",
    "Counts marked missing are not zeroes. Apple privacy withholding and absent report rows remain missing.",
  );
  if (report.warnings?.length) {
    lines.push("", "## Completeness and truncation warnings", "");
    for (const warning of report.warnings) {
      const details = [warning.reason, ...(warning.issues ?? []), ...(warning.warnings ?? [])].filter(Boolean);
      if (warning.segmentCount !== undefined) details.push(`verified segments: ${warning.verifiedSegmentCount}/${warning.segmentCount}; all required verified: ${warning.allRequiredSegmentsVerified}`);
      if (warning.missingDates?.length) details.push(`incomplete dates: ${warning.missingDates.join(", ")}`);
      if (warning.returnedRows !== undefined) details.push(`returned rows: ${warning.returnedRows}/${warning.rowCount}`);
      lines.push(`- ${warning.source} ${warning.report ?? warning.query ?? ""}: ${details.join("; ")}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }

  const reportMeta = {
    requestedDateRange: { startDate: args.startDate, endDate: args.endDate },
    propertyId: args.propertyId,
    appId: args.appleAppId,
  };
  const ga4 = args.source === "apple" ? unavailableSource("ga4", "not_requested") : await readGa4(args, reportMeta);
  const apple = args.source === "ga4" ? unavailableSource("apple", "not_requested") : await readApple(args);
  const report = buildNormalizedReport(args, ga4, apple);
  const output = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) writeFileSync(args.output, output);
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  process.stderr.write(`funnel-report: ${error instanceof Error ? error.message : "unexpected error"}\n`);
  process.exitCode = 1;
});
