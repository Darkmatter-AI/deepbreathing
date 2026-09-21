import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync } from "node:crypto";
import { gzipSync } from "node:zlib";

import { readApple } from "../appstore/apple-reports.mjs";
import { buildNormalizedReport, renderMarkdown } from "../appstore/funnel-report.mjs";

import {
  APP_STORE_URL,
  createAppleCampaignToken,
  createAppStoreAnalyticsParams,
  createAppStoreDestination,
} from "../../src/lib/app-store-attribution.ts";

test("captures allowlisted campaign context without copying arbitrary values", () => {
  const currentUrl = new URL(
    "https://deepbreathingexercises.com/breathe/box?utm_source=newsletter&utm_campaign=launch&gclid=private-click-id&email=person%40example.com",
  );
  const params = createAppStoreAnalyticsParams({
    currentUrl,
    destination: APP_STORE_URL,
    variant: "strip",
  });

  assert.equal(params.origin_path, "/breathe/box");
  assert.equal(params.app_store_placement, "strip");
  assert.equal(params.utm_source, "newsletter");
  assert.equal(params.utm_campaign, "launch");
  assert.equal(params.has_gclid, true);
  assert.equal("apple_campaign" in params, false);
  assert.equal("gclid" in params, false);
  assert.equal("email" in params, false);
});

test("uses the verified provider by default and rejects invalid overrides", () => {
  const currentUrl = new URL("https://deepbreathingexercises.com/");

  const destination = new URL(createAppStoreDestination({ currentUrl }));
  assert.equal(destination.searchParams.get("pt"), "129077591");
  assert.equal(destination.searchParams.get("ct"), "dbe_website");
  assert.equal(
    createAppStoreDestination({ currentUrl, providerToken: "not-a-token" }),
    APP_STORE_URL,
  );
});

test("builds a stable website Apple campaign link with a provider token", () => {
  const currentUrl = new URL(
    "https://deepbreathingexercises.com/box-breathing-before-presentation",
  );
  const destination = new URL(
    createAppStoreDestination({ currentUrl, providerToken: "123456" }),
  );
  const campaignToken = destination.searchParams.get("ct");

  assert.equal(destination.searchParams.get("pt"), "123456");
  assert.equal(destination.searchParams.get("mt"), "8");
  assert.equal(campaignToken, "dbe_website");
  assert.ok(campaignToken);
  assert.ok(campaignToken.length <= 30);
  assert.notEqual(campaignToken, createAppleCampaignToken(currentUrl.pathname));

  const params = createAppStoreAnalyticsParams({
    currentUrl,
    destination: destination.toString(),
    variant: "landing",
  });
  assert.equal(params.apple_campaign, "dbe_website");
});

test("Apple acquisition requires complete verified segments", async (t) => {
  const args = { startDate: "2026-09-15", endDate: "2026-09-18", appleAppId: "6786431781" };
  const key = generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey.export({ type: "pkcs8", format: "pem" });
  const credentials = { ASC_KEY_ID: "test-key", ASC_ISSUER_ID: "test-issuer", ASC_PRIVATE_KEY: key };
  const savedEnv = Object.fromEntries(Object.keys(credentials).map((name) => [name, process.env[name]]));
  Object.assign(process.env, credentials);
  t.after(() => {
    for (const [name, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-21T12:00:00Z") });

  // Exercise the public reader with in-memory Apple responses and valid gzip/MD5 metadata.
  function source(context, options = {}) {
    const calls = new Map();
    const reports = [
      { id: "downloads", attributes: { name: "App Downloads Standard" } },
      { id: "detailed", attributes: { name: "App Downloads Detailed" } },
      { id: "discovery", attributes: { name: "App Store Discovery and Engagement Standard" } },
    ];
    const headers = ["Date", "App Name", "App Apple Identifier", "Download Type", "App Version", "Device", "Platform Version", "Source Type", "Page Type", "Pre-Order", "Territory", "Counts"];
    const json = (body) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
    function segment(report, day, part) {
      const date = `2026-09-${15 + day}`;
      const row = [date, "Test app", "6786431781", "First-time Download", "1.0", "iPhone", "26.0", "App Store Search", "Product Page", "false", "PT", "1"];
      const fields = [...headers];
      const rows = [row];
      if (options.zero) row[11] = "0";
      if (report === "detailed") {
        fields.push("Source Info", "Campaign", "Page Title");
        row.push("", "dbe_website", "");
      }
      if (report === "discovery") {
        fields[3] = "Event";
        fields[4] = "Engagement Type";
        fields[9] = "Unique Counts";
        row[3] = "Impression";
        row[4] = "";
        row[9] = "1";
      } else if (day === 0 && part === 0 && !options.noRedownloads) {
        for (const [type, count] of [["Redownload", "2"], ["Auto-update", "40"], ["Manual update", "30"], ["Restore", "20"]]) {
          const extra = [...row];
          extra[3] = type;
          extra[11] = count;
          rows.push(extra);
        }
      }
      if (options.correction && day === 1 && part === 0) {
        const corrected = [...row];
        corrected[0] = "2026-09-15";
        corrected[11] = "3";
        rows.push(corrected);
      }
      if (options.withheld && day === 0 && part === 1) row[11] = "";
      if (options.failure === "app_id" && day === 0 && part === 1) row[2] = "other-app";
      if (options.failure === "row" && day === 0 && part === 1) row[11] = "not-a-count";
      if (options.failure === "date" && day === 0 && part === 1) row[0] = "2026-09-99";
      if (options.failure === "schema" && day === 0 && part === 1) fields[0] = "Unexpected";
      let bytes = gzipSync([fields.join("\t"), ...rows.map((values) => values.join("\t")), ""].join("\n"));
      if (options.failure === "gzip" && day === 0 && part === 1) bytes = Buffer.from("invalid gzip");
      const attributes = { url: `https://segments.example/${report}/${day}/${part}?signed=DO_NOT_PRINT`, sizeInBytes: bytes.length, checksum: createHash("md5").update(bytes).digest("hex") };
      if (options.failure === "size" && day === 0 && part === 1) attributes.sizeInBytes += 1;
      if (options.failure === "checksum" && day === 0 && part === 1) attributes.checksum = "0".repeat(32);
      return { bytes, metadata: { id: `${report}-${day}-${part}`, attributes } };
    }
    context.mock.method(globalThis, "fetch", async (input, init = {}) => {
      const url = new URL(input);
      const attempt = (calls.get(url.pathname) ?? 0) + 1;
      calls.set(url.pathname, attempt);
      assert.equal(init.method ?? "GET", "GET", "the Apple reader must remain read-only");
      if (url.hostname === "segments.example") {
        assert.equal(init.headers?.Authorization, undefined, "signed downloads must not receive the ASC bearer token");
        const [, report, day, part] = url.pathname.split("/");
        const failing = day === String(options.failDay ?? 0) && part === "1";
        if (failing && options.http && attempt <= (options.failures ?? Infinity)) return new Response("untrusted DO_NOT_PRINT", { status: options.http });
        if (failing && options.timeout) {
          const pending = () => new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("DO_NOT_PRINT", "AbortError")), { once: true }));
          return options.timeout === "headers" ? pending() : { ok: true, arrayBuffer: pending };
        }
        if (failing && options.network && attempt <= (options.failures ?? Infinity)) {
          throw new TypeError("fetch failed DO_NOT_PRINT", { cause: Object.assign(new Error("signed URL DO_NOT_PRINT"), { code: "ECONNRESET" }) });
        }
        return new Response(segment(report, Number(day), Number(part)).bytes);
      }
      if (url.pathname.endsWith("/analyticsReportRequests")) return json({ data: [{ id: "request", attributes: { accessType: "ONGOING" } }] });
      if (url.pathname.endsWith("/reports")) return json({ data: reports });
      const instances = url.pathname.match(/\/analyticsReports\/([^/]+)\/instances$/);
      if (instances) {
        const report = instances[1];
        const data = Array.from({ length: 4 }, (_, day) => ({ id: `${report}-${day}`, attributes: { granularity: "DAILY", processingDate: `2026-09-${(report === "discovery" ? 18 : 17) + day}` } }));
        if (options.missingInstance) data.splice(1, 1);
        if (options.reversed) data.reverse();
        return json({ data });
      }
      const segments = url.pathname.match(/\/analyticsReportInstances\/(downloads|detailed|discovery)-(\d)\/segments$/);
      if (segments) {
        const [, report, day] = segments;
        if (options.collection === "schema") return json({ unexpected: [] });
        if (options.collection === "json") return new Response("{invalid DO_NOT_PRINT");
        const data = [0, 1].map((part) => segment(report, Number(day), part).metadata);
        if (options.collection === "pages") return json({ data: [data[url.searchParams.has("page") ? 1 : 0]], links: { next: url.searchParams.has("page") ? null : `${url.href}&page=2` }, meta: { paging: { total: 2 } } });
        if (options.collection === "duplicate") return json({ data: [data[0], data[0]] });
        if (options.collection === "cycle") return json({ data, links: { next: url.href } });
        if (options.collection === "truncated") return json({ data, meta: { paging: { total: 3 } } });
        if (options.collection === "origin") return json({ data, links: { next: "https://untrusted.example/v1/?signed=DO_NOT_PRINT" } });
        if (options.reversed) data.reverse();
        return json({ data, meta: { paging: { total: 2 } } });
      }
      assert.fail(`Unexpected mocked Apple path: ${url.pathname}`);
    });
    return calls;
  }

  await t.test("identical mature reads return eight first-time downloads and exclude updates/restores", async (context) => {
    source(context);
    const first = await readApple(args);
    source(context, { reversed: true });
    const second = await readApple(args);
    assert.deepEqual(first.downloads.metrics, second.downloads.metrics);
    assert.deepEqual(first.downloads.metrics.firstTimeDownloads, { value: 8, status: "observed" });
    assert.equal(first.downloads.metrics.totalDownloads.value, 10);
    assert.equal(first.downloads.ingestion.instances.verifiedSegmentCount, 8);
    assert.equal(first.downloads.ingestion.instances.allRequiredSegmentsVerified, true);
  });

  for (const options of [{ http: 429 }, { http: 503 }, { network: true }]) {
    await t.test(`recovers a transient ${options.http ?? "network reset"} within three attempts`, async (context) => {
      const calls = source(context, { ...options, failures: 2 });
      const report = await readApple(args);
      assert.equal(report.downloads.metrics.firstTimeDownloads.value, 8);
      assert.equal(report.downloads.ingestion.instances.allRequiredSegmentsVerified, true);
      assert.equal(calls.get("/downloads/0/1"), 3);
    });
  }

  await t.test("exhausted fetches produce deterministic null totals throughout the report", async (context) => {
    const calls = source(context, { network: true });
    const first = await readApple(args);
    const second = await readApple(args);
    assert.deepEqual(first.downloads.metrics, second.downloads.metrics);
    for (const value of Object.values(first.downloads.metrics)) assert.deepEqual({ value: value.value, status: value.status }, { value: null, status: "partial" });
    assert.equal(first.downloads.ingestion.instances.allRequiredSegmentsVerified, false);
    assert.equal(first.downloads.ingestion.instances.verifiedSegmentCount, 7);
    assert.equal(calls.get("/downloads/0/1"), 6);
    assert.equal(first.campaignAttribution.status, "partial");
    assert.equal(first.campaignAttribution.rows[0].totalDownloads.value, null);
    assert.equal(first.discovery.events.Impression.value, null);
    assert.match(JSON.stringify(first), /network_connection_reset/);
    assert.doesNotMatch(JSON.stringify(first), /DO_NOT_PRINT/);
    const normalized = buildNormalizedReport(args, { provider: "ga4", status: "unavailable" }, first);
    assert.equal(normalized.funnel.steps.find((step) => step.id === "apple_first_time_download").count.value, null);
    const markdown = renderMarkdown(normalized);
    assert.match(markdown, /App Store first-time download \(all sources\) \| apple \| n\/a \(partial\)/);
    assert.match(markdown, /network_connection_reset/);
    assert.match(markdown, /verified segments: 7\/8; all required verified: false/);
    assert.doesNotMatch(markdown, /DO_NOT_PRINT/);
  });

  for (const [failure, reason] of [["size", "segment_size_mismatch"], ["checksum", "segment_checksum_mismatch"], ["gzip", "segment_gzip_invalid"], ["schema", "schema_missing"], ["app_id", "report_app_id_mismatch"], ["row", "row_count_invalid"], ["date", "row_date_invalid"]]) {
    await t.test(`${failure} validation fails closed without retry`, async (context) => {
      const calls = source(context, { failure });
      const report = await readApple(args);
      assert.equal(report.downloads.metrics.firstTimeDownloads.value, null);
      assert.equal(report.downloads.metrics.firstTimeDownloads.status, "partial");
      assert.equal(report.downloads.ingestion.instances.verifiedSegmentCount, 7);
      assert.equal(calls.get("/downloads/0/1"), 1);
      assert.match(JSON.stringify(report.downloads.ingestion.issues), new RegExp(reason));
    });
  }

  for (const http of [401, 403, 404]) {
    await t.test(`HTTP ${http} is not retried and exposes no signed URL`, async (context) => {
      const calls = source(context, { http });
      const report = await readApple(args);
      assert.equal(calls.get("/downloads/0/1"), 1);
      assert.equal(report.downloads.metrics.totalDownloads.value, null);
      assert.match(JSON.stringify(report), new RegExp(`http_${http}`));
      assert.doesNotMatch(JSON.stringify(report), /DO_NOT_PRINT/);
    });
  }

  for (const collection of ["schema", "json", "cycle", "truncated", "origin", "duplicate"]) {
    await t.test(`a ${collection} collection cannot become a complete numeric report`, async (context) => {
      source(context, { collection });
      const report = await readApple(args);
      assert.equal(report.downloads.metrics.totalDownloads.value, null);
      assert.equal(report.downloads.ingestion.instances.allRequiredSegmentsVerified, false);
      assert.doesNotMatch(JSON.stringify(report), /DO_NOT_PRINT/);
    });
  }

  await t.test("mixed privacy-withheld counts never become a numeric lower total", async (context) => {
    source(context, { withheld: true });
    const report = await readApple(args);
    assert.equal(report.downloads.metrics.firstTimeDownloads.value, null);
    assert.equal(report.downloads.metrics.firstTimeDownloads.status, "partial");
    assert.equal(report.campaignAttribution.rows[0].totalDownloads.value, null);
  });

  await t.test("an absent daily instance leaves the requested window partial", async (context) => {
    source(context, { missingInstance: true });
    const report = await readApple(args);
    assert.equal(report.downloads.metrics.totalDownloads.value, null);
    assert.equal(report.downloads.status, "partial");
    assert.equal(report.downloads.ingestion.instances.allRequiredSegmentsVerified, false);
  });

  for (const timeout of ["headers", "body"]) {
    await t.test(`timeouts cover ${timeout} and stop after three attempts`, async (context) => {
      const originalTimeout = globalThis.setTimeout;
      context.mock.method(globalThis, "setTimeout", (callback, delay, ...values) => originalTimeout(callback, Math.min(delay, 5), ...values));
      const calls = source(context, { timeout });
      const report = await readApple(args);
      assert.equal(calls.get("/downloads/0/1"), 3);
      assert.equal(report.downloads.metrics.firstTimeDownloads.value, null);
      assert.match(JSON.stringify(report), /request_timeout/);
      assert.doesNotMatch(JSON.stringify(report), /DO_NOT_PRINT/);
    });
  }

  await t.test("all paginated physical segments are required and combined once", async (context) => {
    source(context, { collection: "pages" });
    const report = await readApple(args);
    assert.equal(report.downloads.metrics.firstTimeDownloads.value, 8);
    assert.equal(report.downloads.ingestion.instances.verifiedSegmentCount, 8);
    assert.equal(report.downloads.ingestion.instances.allRequiredSegmentsVerified, true);
  });

  await t.test("newer processing dates replace entire older row sets", async (context) => {
    source(context, { correction: true });
    const report = await readApple(args);
    assert.equal(report.downloads.metrics.firstTimeDownloads.value, 9);
    assert.equal(report.downloads.ingestion.coverage.processingDateByDate["2026-09-15"], "2026-09-18");
    assert.equal(report.downloads.metrics.redownloads.value, null);
    assert.equal(report.downloads.metrics.totalDownloads.value, null);
  });

  await t.test("a failed newer correction never exposes older rows as a complete total", async (context) => {
    source(context, { correction: true, failDay: 1, http: 403 });
    const report = await readApple(args);
    assert.equal(report.downloads.metrics.firstTimeDownloads.value, null);
    assert.equal(report.downloads.ingestion.instances.allRequiredSegmentsVerified, false);
    assert.deepEqual(report.downloads.ingestion.coverage.completeDates, []);
  });

  await t.test("explicit zero stays zero but absent redownloads cannot imply a combined total", async (context) => {
    source(context, { zero: true, noRedownloads: true });
    const report = await readApple(args);
    assert.deepEqual(report.downloads.metrics.firstTimeDownloads, { value: 0, status: "zero" });
    assert.equal(report.downloads.metrics.redownloads.status, "missing");
    assert.equal(report.downloads.metrics.totalDownloads.value, null);
    assert.equal(report.downloads.metrics.totalDownloads.status, "partial");
  });
});

test("normalized output surfaces truncation and never computes ratios from partial metrics", () => {
  const observed = (value) => ({ value, status: "observed" });
  const ga4 = {
    status: "ok",
    websiteUsers: observed(100),
    events: { app_store_promotion_view: { users: observed(50), events: observed(60) }, app_store_click: { users: observed(5), events: observed(8) } },
    dataQuality: { totals: { truncated: true, returnedRows: 1, rowCount: 2 }, website: { truncated: true, returnedRows: 1, rowCount: 2 } },
    campaignAttribution: { status: "missing", rows: [] },
  };
  const report = buildNormalizedReport({ startDate: "2026-09-15", endDate: "2026-09-18" }, ga4, { status: "unavailable" });
  assert.equal(report.funnel.steps[0].users.value, null);
  assert.equal(report.funnel.steps[1].users.value, null);
  assert.equal(report.funnel.conversionRates.promotionViewToClickUsers.value, null);
  const markdown = renderMarkdown(report);
  assert.match(markdown, /ga4_rows_truncated/);
  assert.match(markdown, /returned rows: 1\/2/);
  assert.match(markdown, /n\/a \(partial\)/);
});
