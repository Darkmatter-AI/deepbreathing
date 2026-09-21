import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { gunzipSync } from "node:zlib";
import { importPKCS8, SignJWT } from "jose";

const ASC_ENDPOINT = "https://api.appstoreconnect.apple.com/v1";
const REQUEST_TIMEOUT_MS = 45_000;
const RETRY_DELAYS_MS = [250, 750];
const MAX_COLLECTION_PAGES = 100;
const REPORT_SPECS = {
  downloads: {
    key: "downloads",
    pattern: /app\s+(?:store\s+)?downloads?/i,
    completenessDays: 2,
    required: ["Date", "App Name", "App Apple Identifier", "Download Type", "App Version", "Device", "Platform Version", "Source Type", "Page Type", "Pre-Order", "Territory", "Counts"],
    detailedOnly: ["Source Info", "Campaign", "Page Title"],
  },
  discovery: {
    key: "discovery",
    pattern: /app\s+store\s+discovery\s+and\s+engagement/i,
    completenessDays: 3,
    required: ["Date", "App Name", "App Apple Identifier", "Event", "Page Type", "Source Type", "Engagement Type", "Device", "Platform Version", "Territory", "Counts", "Unique Counts"],
    detailedOnly: ["Page Title", "Source Info", "Campaign"],
  },
};

function envValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolvePath(value) {
  return value ? value.replace(/^~/, homedir()) : value;
}

function nowIso() {
  return new Date().toISOString();
}

function unavailableSource(provider, reason, extra = {}) {
  return { provider, status: "unavailable", reason, ...extra };
}

function errorSource(provider, error, extra = {}) {
  return { provider, status: "error", reason: issueReason(error), ...extra };
}

class ReportError extends Error {
  constructor(reason, retryable = false) {
    super(reason);
    this.reason = reason;
    this.retryable = retryable;
  }
}

function safeFetchError(error, timedOut) {
  if (error instanceof ReportError) return error;
  const code = error?.cause?.code ?? error?.code;
  if (timedOut || ["AbortError", "TimeoutError"].includes(error?.name) || ["ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(code)) {
    return new ReportError("request_timeout", true);
  }
  if (["ECONNRESET", "EPIPE", "UND_ERR_SOCKET"].includes(code)) return new ReportError("network_connection_reset", true);
  if (code === "EAI_AGAIN") return new ReportError("network_dns_temporary", true);
  if (code === "ENOTFOUND") return new ReportError("network_dns_failed");
  if (error instanceof SyntaxError) return new ReportError("report_json_invalid");
  return new ReportError("network_fetch_failed");
}

async function fetchBody(url, options, readBody) {
  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new ReportError(`http_${response.status}`, response.status === 429 || response.status >= 500 && response.status <= 599);
      }
      // Keep the timeout active through the entire body, including signed downloads.
      return await readBody(response);
    } catch (error) {
      const safeError = safeFetchError(error, controller.signal.aborted);
      if (!safeError.retryable || attempt >= RETRY_DELAYS_MS.length) throw safeError;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
}

async function fetchJson(url, options = {}) {
  return fetchBody(url, { ...options, headers: { Accept: "application/json", ...(options.headers ?? {}) } }, (response) => response.json());
}

async function fetchBytes(url) {
  return fetchBody(url, {}, async (response) => Buffer.from(await response.arrayBuffer()));
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error(`Invalid date: ${value}`);
  return date;
}

function offsetDate(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function appleDateOffset(value, days) {
  return dateInTimeZone(offsetDate(parseDate(value), days), "UTC");
}

function dateList(startDate, endDate) {
  if (startDate > endDate) return [];
  const dates = [];
  for (let date = parseDate(startDate); date <= parseDate(endDate); date = offsetDate(date, 1)) dates.push(date.toISOString().slice(0, 10));
  return dates;
}

function processingWindow(args, spec) {
  const requestedMin = appleDateOffset(args.startDate, spec.completenessDays);
  const requestedMax = appleDateOffset(args.endDate, spec.completenessDays);
  const today = dateInTimeZone(new Date(), "UTC");
  const maxProcessingDate = requestedMax < today ? requestedMax : today;
  const completeThroughDate = appleDateOffset(maxProcessingDate, -spec.completenessDays);
  const completeEndDate = completeThroughDate < args.endDate ? completeThroughDate : args.endDate;
  return {
    requestedDateRange: { startDate: args.startDate, endDate: args.endDate },
    processingDateRange: { startDate: requestedMin, endDate: maxProcessingDate },
    completeDateRange: { startDate: args.startDate, endDate: completeEndDate },
    completenessDays: spec.completenessDays,
    pendingDates: completeEndDate >= args.endDate ? [] : dateList(completeEndDate < args.startDate ? args.startDate : appleDateOffset(completeEndDate, 1), args.endDate),
  };
}

function issueReason(error) {
  if (error instanceof ReportError) return error.reason;
  return "report_ingestion_failed";
}

function integer(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const numeric = Number(normalized);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
}

function metric(value, missingReason) {
  if (value === null || value === undefined) return { value: null, status: "missing", missingReason };
  return { value, status: value === 0 ? "zero" : "observed" };
}

function unavailableMetric(missingReason) {
  return { value: null, status: "unavailable", missingReason };
}

function parseSegment(bytes, spec, detailed) {
  let text;
  try {
    text = gunzipSync(bytes).toString("utf8");
  } catch {
    throw new ReportError("segment_gzip_invalid");
  }
  const lines = text.split(/\r?\n/).filter((line, index, all) => line.length > 0 || index < all.length - 1);
  const headerLine = lines.shift();
  if (!headerLine) throw new ReportError("report_header_missing");
  const headers = headerLine.replace(/^\uFEFF/, "").split("\t").map((header) => header.trim().replace(/\s+/g, " "));
  const missing = [...spec.required, ...(detailed ? spec.detailedOnly : [])].filter((field) => !headers.includes(field));
  if (missing.length) throw new ReportError(`schema_missing:${missing.join(",")}`);
  if (new Set(headers).size !== headers.length) throw new ReportError("schema_duplicate_header");
  const rows = [];
  const issues = [];
  for (const [index, line] of lines.entries()) {
    if (!line) continue;
    const values = line.split("\t");
    if (values.length !== headers.length) {
      issues.push(`row_column_count:${index + 2}`);
      continue;
    }
    const row = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex]]));
    try {
      parseDate(row.Date ?? "");
    } catch {
      issues.push(`row_date_invalid:${index + 2}`);
      continue;
    }
    row._count = integer(row.Counts);
    if (String(row.Counts ?? "").trim() && row._count === null) issues.push(`row_count_invalid:${index + 2}`);
    if (spec.key === "discovery") {
      row._uniqueCount = integer(row["Unique Counts"]);
      if (String(row["Unique Counts"] ?? "").trim() && row._uniqueCount === null) issues.push(`row_unique_count_invalid:${index + 2}`);
    }
    rows.push(row);
  }
  return { rows, issues };
}

async function downloadSegment(segment, spec, detailed) {
  const attributes = segment.attributes ?? {};
  const expectedSize = Number(attributes.sizeInBytes);
  if (!attributes.url || !/^[a-f0-9]{32}$/i.test(attributes.checksum ?? "") || !Number.isSafeInteger(expectedSize) || expectedSize <= 0) throw new ReportError("segment_metadata_missing");
  const bytes = await fetchBytes(attributes.url);
  if (bytes.byteLength !== expectedSize) throw new ReportError("segment_size_mismatch");
  if (createHash("md5").update(bytes).digest("hex").toLowerCase() !== String(attributes.checksum).toLowerCase()) throw new ReportError("segment_checksum_mismatch");
  return parseSegment(bytes, spec, detailed);
}

function withQuery(path, values = {}) {
  const url = new URL(`${ASC_ENDPOINT}${path}`);
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  return url.toString();
}

async function ascJson(pathOrUrl, token, query) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : withQuery(pathOrUrl, query);
  const target = new URL(url);
  if (target.origin !== "https://api.appstoreconnect.apple.com" || !target.pathname.startsWith("/v1/")) throw new ReportError("report_pagination_origin_invalid");
  return fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
}

async function ascCollection(path, token, query = {}) {
  const values = [];
  let url = withQuery(path, query);
  const seen = new Set();
  const ids = new Set();
  let expectedTotal = null;
  while (url) {
    if (seen.has(url)) throw new ReportError("report_pagination_cycle");
    if (seen.size >= MAX_COLLECTION_PAGES) throw new ReportError("report_pagination_limit");
    seen.add(url);
    const body = await ascJson(url, token);
    if (!Array.isArray(body?.data)) throw new ReportError("report_collection_schema_invalid");
    const total = body.meta?.paging?.total;
    if (total !== undefined) {
      if (!Number.isSafeInteger(total) || total < 0) throw new ReportError("report_collection_schema_invalid");
      if (expectedTotal !== null && expectedTotal !== total) throw new ReportError("report_collection_changed");
      expectedTotal = total;
    }
    for (const item of body.data) {
      if (typeof item?.id !== "string" || !item.id) throw new ReportError("report_collection_schema_invalid");
      if (ids.has(item.id)) throw new ReportError("report_collection_duplicate_id");
      ids.add(item.id);
      values.push(item);
    }
    url = body.links?.next ?? null;
    if (url !== null && (typeof url !== "string" || !url)) throw new ReportError("report_collection_schema_invalid");
  }
  if (expectedTotal !== null && values.length !== expectedTotal) throw new ReportError("report_collection_truncated");
  return values;
}

function credentials() {
  const keyId = envValue("ASC_KEY_ID", "APPSTORE_CONNECT_API_KEY_ID");
  const issuerId = envValue("ASC_ISSUER_ID", "APPSTORE_CONNECT_ISSUER_ID");
  const privateKeyPath = resolvePath(envValue("ASC_PRIVATE_KEY_PATH", "APPSTORE_CONNECT_PRIVATE_KEY_PATH"));
  const privateKeyEnv = envValue("ASC_PRIVATE_KEY", "APPSTORE_CONNECT_PRIVATE_KEY");
  let privateKey = privateKeyEnv;
  if (!privateKey && privateKeyPath) {
    try { privateKey = readFileSync(privateKeyPath, "utf8"); } catch { return { error: "private_key_unreadable" }; }
  }
  if (!keyId || !issuerId || !privateKey) return { missing: [!keyId && "ASC_KEY_ID", !issuerId && "ASC_ISSUER_ID", !privateKey && "ASC_PRIVATE_KEY_PATH or ASC_PRIVATE_KEY"].filter(Boolean) };
  return { keyId, issuerId, privateKey };
}

async function createToken(value) {
  const key = await importPKCS8(value.privateKey.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: value.keyId, typ: "JWT" }).setIssuer(value.issuerId).setAudience("appstoreconnect-v1").setIssuedAt().setExpirationTime("19m").sign(key);
}

function reportIsDetailed(name) {
  return /detailed/i.test(name ?? "");
}

function selectReport(reports, spec, requestedName, detailed) {
  const matches = reports.filter((report) => {
    const name = report.attributes?.name;
    return name && spec.pattern.test(name) && (!requestedName || name.toLowerCase().includes(requestedName.toLowerCase()));
  });
  const levelMatches = matches.filter((report) => reportIsDetailed(report.attributes?.name) === detailed);
  return [...(levelMatches.length ? levelMatches : matches)].sort((left, right) => (left.requestRank ?? 0) - (right.requestRank ?? 0) || String(left.attributes?.name).localeCompare(String(right.attributes?.name)) || left.id.localeCompare(right.id))[0] ?? null;
}

function replaceByLatestProcessingDate(instanceRows, window) {
  const byDate = new Map();
  const completeDates = new Set(dateList(window.completeDateRange.startDate, window.completeDateRange.endDate));
  for (const item of [...instanceRows].sort((left, right) => left.processingDate.localeCompare(right.processingDate))) {
    const rowsByDate = new Map();
    for (const row of item.rows) if (completeDates.has(row.Date)) rowsByDate.set(row.Date, [...(rowsByDate.get(row.Date) ?? []), row]);
    for (const [date, rows] of rowsByDate) {
      const previous = byDate.get(date);
      if (!previous || item.processingDate > previous.processingDate) byDate.set(date, { processingDate: item.processingDate, rows: [...rows] });
      else if (item.processingDate === previous.processingDate) previous.rows.push(...rows);
    }
  }
  const rows = [];
  const processingDates = {};
  for (const [date, value] of [...byDate.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    processingDates[date] = value.processingDate;
    rows.push(...value.rows.map((row) => ({ ...row, _processingDate: value.processingDate })));
  }
  return { rows, processingDates };
}

async function readInstance(instance, token, spec, detailed, appId) {
  const segments = await ascCollection(`/analyticsReportInstances/${instance.id}/segments`, token, { limit: 200, "fields[analyticsReportSegments]": "checksum,sizeInBytes,url" });
  const rows = [];
  const issues = [];
  let verifiedSegmentCount = 0;
  for (const segment of segments.sort((left, right) => left.id.localeCompare(right.id))) {
    try {
      const parsed = await downloadSegment(segment, spec, detailed);
      if (parsed.issues.length) throw new ReportError(parsed.issues[0]);
      if (parsed.rows.some((row) => String(row["App Apple Identifier"]).trim() !== appId)) throw new ReportError("report_app_id_mismatch");
      rows.push(...parsed.rows);
      issues.push(...parsed.issues);
      verifiedSegmentCount += 1;
    } catch (error) {
      issues.push(issueReason(error));
    }
  }
  if (!segments.length) issues.push("segments_missing");
  // Physical partitions are atomic: one invalid/missing segment invalidates the instance.
  return { rows: issues.length ? [] : rows, issues, segmentCount: segments.length, verifiedSegmentCount };
}

async function readReportData(report, token, args, spec) {
  const detailed = reportIsDetailed(report.attributes?.name);
  const window = processingWindow(args, spec);
  const base = { report: { id: report.id, name: report.attributes?.name ?? null, category: report.attributes?.category ?? null, detailed }, window };
  try {
    const instances = await ascCollection(`/analyticsReports/${report.id}/instances`, token, { limit: 200, "filter[granularity]": "DAILY" });
    const daily = instances.filter((instance) => instance.attributes?.granularity === "DAILY");
    const relevant = daily.filter((instance) => {
      const processingDate = instance.attributes?.processingDate;
      return processingDate && processingDate >= window.processingDateRange.startDate && processingDate <= window.processingDateRange.endDate;
    }).sort((left, right) => left.attributes.processingDate.localeCompare(right.attributes.processingDate));
    if (new Set(relevant.map((instance) => instance.attributes.processingDate)).size !== relevant.length) throw new ReportError("report_duplicate_processing_date");
    const expectedProcessingDates = dateList(window.processingDateRange.startDate, window.processingDateRange.endDate);
    const missingProcessingDates = expectedProcessingDates.filter((date) => !relevant.some((instance) => instance.attributes.processingDate === date));
    const instanceRows = [];
    const issues = [];
    const verification = [];
    let segmentCount = 0;
    let verifiedSegmentCount = 0;
    for (const instance of relevant) {
      const processingDate = instance.attributes.processingDate;
      try {
        const result = await readInstance(instance, token, spec, detailed, args.appleAppId);
        instanceRows.push({ processingDate, rows: result.rows });
        issues.push(...result.issues.map((issue) => `${processingDate}:${issue}`));
        segmentCount += result.segmentCount;
        verifiedSegmentCount += result.verifiedSegmentCount;
        verification.push({ id: instance.id, processingDate, status: result.issues.length ? "partial" : "verified", segmentCount: result.segmentCount, verifiedSegmentCount: result.verifiedSegmentCount });
      } catch (error) {
        issues.push(`${processingDate}:${issueReason(error)}`);
        verification.push({ id: instance.id, processingDate, status: "error", reason: issueReason(error) });
      }
    }
    const replaced = replaceByLatestProcessingDate(instanceRows, window);
    const allRequiredSegmentsVerified = relevant.length > 0 && !missingProcessingDates.length && !window.pendingDates.length && verification.every((item) => item.status === "verified");
    const withheldDates = [...new Set(replaced.rows.filter((row) => row._count === null || spec.key === "discovery" && row._uniqueCount === null).map((row) => row.Date))].sort();
    const expectedDates = dateList(window.completeDateRange.startDate, window.completeDateRange.endDate);
    const completeDates = allRequiredSegmentsVerified ? Object.keys(replaced.processingDates).filter((date) => !withheldDates.includes(date)).sort() : [];
    const missingDates = expectedDates.filter((date) => !completeDates.includes(date));
    const pendingDates = [...new Set([...window.pendingDates, ...missingDates])].sort();
    const status = issues.length ? "partial" : !relevant.length || !replaced.rows.length ? "missing" : missingDates.length || window.pendingDates.length ? "partial" : "ok";
    return {
      ...base,
      status,
      reason: issues.length ? "required_segments_incomplete" : !relevant.length ? "no_daily_instances_for_requested_processing_window" : !replaced.rows.length ? "privacy_withheld_or_no_rows" : status === "partial" ? "partial_daily_data_or_withheld_counts" : undefined,
      rows: replaced.rows,
      instances: { listed: daily.length, selected: relevant.length, processingDates: relevant.map((instance) => instance.attributes.processingDate), missingProcessingDates, segmentCount, verifiedSegmentCount, allRequiredSegmentsVerified, verification },
      coverage: { completeDates, observedDates: Object.keys(replaced.processingDates).sort(), missingDates: pendingDates, withheldDates, processingDateByDate: replaced.processingDates },
      warnings: [...(issues.length ? ["required_segments_incomplete"] : []), ...(missingProcessingDates.length ? ["processing_dates_missing"] : []), ...(pendingDates.length ? ["requested_dates_incomplete"] : []), ...(withheldDates.length ? ["privacy_withheld_counts"] : [])],
      issues: [...new Set(issues)],
    };
  } catch (error) {
    return { ...base, status: "error", reason: issueReason(error), rows: [], instances: { listed: 0, selected: 0, processingDates: [], segmentCount: 0, verifiedSegmentCount: 0, allRequiredSegmentsVerified: false, verification: [] }, coverage: { completeDates: [], missingDates: dateList(args.startDate, args.endDate), processingDateByDate: {} }, warnings: ["required_segments_incomplete"], issues: [issueReason(error)] };
  }
}

function sumCounts(rows, predicate, missingReason) {
  const selected = rows.filter(predicate);
  const numeric = selected.map((row) => row._count).filter((value) => value !== null && value !== undefined);
  if (numeric.length && numeric.length !== selected.length) return { value: null, status: "partial", missingReason: "Apple withheld one or more required counts" };
  if (numeric.length && !Number.isSafeInteger(numeric.reduce((total, value) => total + value, 0))) return { value: null, status: "error", missingReason: "report_count_overflow" };
  return numeric.length ? metric(numeric.reduce((total, value) => total + value, 0)) : metric(null, missingReason);
}

function datasetMetric(dataset, predicate, missingReason, rows = dataset.rows) {
  if (dataset.status !== "ok") return { value: null, status: dataset.status, missingReason: dataset.reason ?? missingReason };
  return sumCounts(rows, predicate, missingReason);
}

function downloadTypeIs(row, value) {
  return String(row["Download Type"] ?? "").trim().toLowerCase() === value.toLowerCase();
}

function downloadMetrics(dataset, rows = dataset.rows) {
  const firstTimeDownloads = datasetMetric(dataset, (row) => downloadTypeIs(row, "First-time Download"), "No first-time download row was returned; Apple may withhold low-volume rows", rows);
  const redownloads = datasetMetric(dataset, (row) => downloadTypeIs(row, "Redownload"), "No redownload row was returned; Apple may withhold low-volume rows", rows);
  let totalDownloads = datasetMetric(dataset, (row) => downloadTypeIs(row, "First-time Download") || downloadTypeIs(row, "Redownload"), "No acquisition download row was returned; updates and restores are excluded", rows);
  if (totalDownloads.value !== null && (firstTimeDownloads.value === null || redownloads.value === null)) {
    totalDownloads = { value: null, status: "partial", missingReason: "Acquisition total requires both first-time download and redownload counts; missing rows are not zeroes" };
  }
  return { firstTimeDownloads, redownloads, totalDownloads };
}

function campaignAttribution(dataset) {
  if (!dataset?.report?.detailed) return { status: "unavailable", rows: [], missingReason: "Apple Campaign is only available in the App Downloads Detailed report" };
  const grouped = new Map();
  for (const row of dataset.rows) {
    const campaign = String(row.Campaign ?? "").trim();
    if (campaign) grouped.set(campaign, [...(grouped.get(campaign) ?? []), row]);
  }
  const rows = [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([campaign, campaignRows]) => ({
    campaign,
    ...downloadMetrics(dataset, campaignRows),
  }));
  return { status: dataset.status === "ok" ? rows.length ? "ok" : "missing" : dataset.status, rows, ingestion: ingestionSummary(dataset), missingReason: dataset.status !== "ok" ? dataset.reason : rows.length ? undefined : "No campaign-valued rows were returned; Apple may withhold low-volume rows" };
}

function discoveryData(dataset) {
  if (!dataset) return { status: "missing", rows: [], events: {}, missingReason: "No App Store Discovery and Engagement report was selected" };
  const rows = dataset.rows.map((row) => ({
    date: row.Date, event: row.Event, pageType: row["Page Type"] || null, pageTitle: row["Page Title"] || null, sourceType: row["Source Type"] || null,
    sourceInfo: row["Source Info"] || null, campaign: row.Campaign || null, engagementType: row["Engagement Type"] || null, device: row.Device || null,
    platformVersion: row["Platform Version"] || null, territory: row.Territory || null,
    counts: metric(row._count, "Apple Discovery row count was withheld or invalid"), uniqueCounts: metric(row._uniqueCount, "Apple Discovery unique count was withheld or invalid"),
  }));
  const events = Object.fromEntries(["Impression", "Page view", "Tap"].map((event) => [event, datasetMetric(dataset, (row) => String(row.Event ?? "").trim().toLowerCase() === event.toLowerCase(), `No ${event} discovery row was returned; Apple may withhold low-volume rows`)]));
  return { status: dataset.status, reason: dataset.reason, rows, events, rowCount: rows.length, coverage: dataset.coverage, instances: dataset.instances, issues: dataset.issues, warnings: dataset.warnings, missingReason: rows.length ? undefined : "No Discovery rows were returned; Apple may withhold low-volume rows" };
}

function reportMetadata(report) {
  return report ? { id: report.id, requestId: report.requestId ?? null, name: report.attributes?.name ?? null, category: report.attributes?.category ?? null } : null;
}

function ingestionSummary(dataset) {
  if (!dataset) return null;
  const { rows, ...summary } = dataset;
  return { ...summary, rowCount: rows.length };
}

export async function readApple(args) {
  const value = credentials();
  if (value.error) return unavailableSource("apple", value.error);
  if (value.missing) return unavailableSource("apple", "credentials_missing", { credentials: "app_store_connect_api_key", env: value.missing, appId: args.appleAppId });
  try {
    const token = await createToken(value);
    let requestData;
    if (args.appleRequestId) {
      const request = await ascJson(`/analyticsReportRequests/${args.appleRequestId}`, token, { "fields[analyticsReportRequests]": "accessType,stoppedDueToInactivity" });
      requestData = request.data ? [request.data] : [];
    } else {
      requestData = await ascCollection(`/apps/${args.appleAppId}/analyticsReportRequests`, token, { limit: 200, "fields[analyticsReportRequests]": "accessType,stoppedDueToInactivity" });
    }
    const requests = requestData.map((request) => ({ id: request.id, accessType: request.attributes?.accessType ?? null, stoppedDueToInactivity: request.attributes?.stoppedDueToInactivity ?? null })).sort((left, right) => {
      const rank = (request) => request.accessType === "ONGOING" && !request.stoppedDueToInactivity ? 0 : request.accessType === "ONGOING" ? 1 : 2;
      return rank(left) - rank(right) || left.id.localeCompare(right.id);
    });
    const reports = [];
    for (const [requestRank, request] of requests.entries()) {
      const requestReports = await ascCollection(`/analyticsReportRequests/${request.id}/reports`, token, { limit: 200, "fields[analyticsReports]": "name,category" });
      reports.push(...requestReports.map((report) => ({ ...report, requestId: request.id, requestRank })));
    }
    const downloadSpec = REPORT_SPECS.downloads;
    const discoverySpec = REPORT_SPECS.discovery;
    const downloadStandard = selectReport(reports, downloadSpec, args.appleReportName, false);
    const downloadDetailed = selectReport(reports, downloadSpec, args.appleReportName, true);
    const discoveryStandard = selectReport(reports, discoverySpec, args.appleReportName, false);
    const discoveryDetailed = selectReport(reports, discoverySpec, args.appleReportName, true);
    const downloadPrimary = downloadStandard ?? downloadDetailed;
    const discoveryPrimary = discoveryStandard ?? discoveryDetailed;
    const datasets = {
      downloads: downloadPrimary ? await readReportData(downloadPrimary, token, args, downloadSpec) : null,
      downloadsDetailed: downloadDetailed && downloadDetailed.id !== downloadPrimary?.id ? await readReportData(downloadDetailed, token, args, downloadSpec) : null,
      discovery: discoveryPrimary ? await readReportData(discoveryPrimary, token, args, discoverySpec) : null,
      discoveryDetailed: discoveryDetailed && discoveryDetailed.id !== discoveryPrimary?.id ? await readReportData(discoveryDetailed, token, args, discoverySpec) : null,
    };
    const downloadsDetailedData = datasets.downloadsDetailed ?? (datasets.downloads?.report?.detailed ? datasets.downloads : null);
    const selectedReport = reportMetadata(downloadPrimary);
    const detailedReport = reportMetadata(downloadDetailed);
    const discoveryReport = reportMetadata(discoveryPrimary);
    const reportStatuses = [datasets.downloads, datasets.discovery, ...[datasets.downloadsDetailed, datasets.discoveryDetailed].filter(Boolean)].map((dataset) => dataset?.status ?? "missing");
    const status = reportStatuses.every((value) => value === "error") ? "error" : reportStatuses.every((value) => value === "missing") ? "missing" : reportStatuses.every((value) => value === "ok") ? "ok" : "partial";
    const provenance = {
      provider: "app-store-connect-analytics-reports",
      appId: args.appleAppId,
      requestedDateRange: { startDate: args.startDate, endDate: args.endDate },
      retrievedAt: nowIso(),
      reportRequestIds: requests.map((request) => request.id),
      selectedReport,
      detailedReport,
      discoveryReport,
      dataCompletenessNote: "Apple daily App Downloads data is complete within two days; Discovery and Engagement data is complete within three days. Newer processing-date instances replace older records for the same Date; missing or privacy-withheld rows are not zeroes.",
    };
    return {
      provider: "apple", status, dataStatus: status, reason: status === "missing"
        ? (downloadPrimary || discoveryPrimary ? "reports_discovered_waiting_for_first_daily_instance" : "no_apple_reports_for_requested_window")
        : undefined, appId: args.appleAppId, requests,
      availableReports: [...new Set(reports.map((report) => report.attributes?.name).filter(Boolean))].sort(), selectedReport,
      downloads: {
        status: datasets.downloads?.status ?? "missing",
        metrics: datasets.downloads ? downloadMetrics(datasets.downloads) : { firstTimeDownloads: unavailableMetric("No App Downloads report was selected"), redownloads: unavailableMetric("No App Downloads report was selected"), totalDownloads: unavailableMetric("No App Downloads report was selected") },
        report: selectedReport, detailedReport, ingestion: ingestionSummary(datasets.downloads), provenance,
      },
      discovery: discoveryData(datasets.discovery),
      ingestion: Object.fromEntries(Object.entries(datasets).map(([name, dataset]) => [name, ingestionSummary(dataset)])),
      campaignAttribution: { ...campaignAttribution(downloadsDetailedData), provenance },
      provenance,
    };
  } catch (error) {
    return errorSource("apple", error, { appId: args.appleAppId, provenance: { provider: "app-store-connect-analytics-reports", retrievedAt: nowIso() } });
  }
}
