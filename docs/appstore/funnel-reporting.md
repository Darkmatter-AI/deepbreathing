# App acquisition funnel reporting

`scripts/appstore/funnel-report.mjs` is a local, read-only report for the
website App Store promotion funnel and the App Store download handoff. Its
Apple boundary and segment parser live in
`scripts/appstore/apple-reports.mjs`.

It combines:

- GA4 website visitors and per-query quality metadata, including row truncation.
- GA4 Data API event users and event counts for `app_store_promotion_view` and
  `app_store_click`.
- GA4 campaign dimensions (`sessionSource`, `sessionMedium`, and
  `sessionCampaignName`).
- GA4 App Store placement and `pagePath` breakdowns, kept separate because
  users can appear in more than one event or dimension row.
- App Store Connect Analytics Reports request/report discovery for app
  `6786431781` when an ASC API key is available.

The script does not create an Apple report request, modify App Store Connect,
deploy anything, or print credential values.

## Run it

The three-day review uses the existing DBE EAS submission credential in memory:

```bash
node scripts/appstore/with-eas-credentials.mjs --start 2026-08-28 --end 2026-09-03 --format json
```

This wrapper verifies the EAS account, app binding, Apple key ID, and issuer. It uses the installed EAS CLI 20.3.0 client and the existing signed-in session. It does not create a key or save a private-key file. If EAS changes its internal client or the session expires, report authentication as blocked and use the direct GA4 CLI plus signed-in Apple browser. Do not print EAS responses or private credentials.

One-time setup is complete. `--enable-reports` is a separate, explicit setup mode and must never be passed by recurring reviews. It checks for an existing ONGOING request before creating one, and reads it back afterwards. The verified active request is `270d7af7-7b5f-4c80-9074-0a408163c9ee`, created on Sep 5 at 10:46 UTC. A repeat call reused that request. Apple report discovery works; no daily instances existed at the verification time.

```bash
# Show the CLI contract
node scripts/appstore/funnel-report.mjs --help

# Machine-readable report from GA4 and the optional Apple discovery pass
node scripts/appstore/funnel-report.mjs \
  --start 2026-08-25 --end 2026-09-03 \
  --format json

# Human-readable report
node scripts/appstore/funnel-report.mjs \
  --source ga4 --format markdown
```

The default window is 28 inclusive days ending two days before the current
date. The two-day clamp follows the GA4 maturity guidance in the project data
runbook. Supply both `--start` and `--end` when comparing fixed windows.

## Credentials

GA4 uses the existing service-account JSON. The script checks these names in
order, then the project’s usual local key path:

```text
GA4_SA_KEY_FILE
GSC_SA_KEY_FILE
GOOGLE_APPLICATION_CREDENTIALS
~/.config/dbe-ga-visibility-sa.json
```

The default property is `527524722` (`G-53DLCBMRL3`). Override it with
`--property` only when intentionally reporting another property.

Apple uses an App Store Connect API key and ES256 JWT:

```text
ASC_KEY_ID
ASC_ISSUER_ID
ASC_PRIVATE_KEY_PATH
```

`ASC_PRIVATE_KEY` can be used instead of the path for a process-local PEM
value. `ASC_APP_ID` is optional; the CLI defaults to `6786431781`. The
`APPSTORE_CONNECT_*` aliases shown by `--help` are also accepted.

If ASC credentials are absent, the report says `unavailable`. If credentials
are present, the Apple provider lists existing Analytics Report requests and
their reports, selecting existing App Downloads and App Store Discovery and
Engagement reports when available. It does not call the report-request
creation endpoint. Apple requires an Admin role for the initial request; an
existing report can then be read with the Sales and Reports or Finance role.
See Apple’s [Analytics Reports API overview](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api).

The one-time owner action, if no request exists, is Apple’s [Request
Reports](https://developer.apple.com/documentation/appstoreconnectapi/post-v1-analyticsreportrequests)
endpoint:

```json
{
  "data": {
    "type": "analyticsReportRequests",
    "attributes": { "accessType": "ONGOING" },
    "relationships": {
      "app": { "data": { "type": "apps", "id": "6786431781" } }
    }
  }
}
```

The local report only performs the read path:

Apple says the first report from an `ONGOING` request is available in roughly
24–48 hours. Until a DAILY instance exists, the CLI reports
`reports_discovered_waiting_for_first_daily_instance` and leaves counts
unavailable.

| Purpose | Endpoint |
| --- | --- |
| Existing requests for the app | [`Read Report Requests`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-apps-_id_-analyticsreportrequests) · `GET /v1/apps/{appId}/analyticsReportRequests` |
| Request state | [`Read Report Request Information`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-analyticsreportrequests-_id_) · `GET /v1/analyticsReportRequests/{requestId}` |
| Reports generated for a request | [`Read Reports for a Specific Request`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-analyticsreportrequests-_id_-reports) · `GET /v1/analyticsReportRequests/{requestId}/reports` |
| DAILY instances for a report | [`Read a List of Instances of a Report`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-analyticsreports-_id_-instances) · `GET /v1/analyticsReports/{reportId}/instances?filter[granularity]=DAILY` |
| All segments in an instance | [`Read the Segments for a Report`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-analyticsreportinstances-_id_-segments) · `GET /v1/analyticsReportInstances/{instanceId}/segments` |
| Segment details, when needed | [`Read the Details for a Report Segment`](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-analyticsreportsegments-_id_) · `GET /v1/analyticsReportSegments/{segmentId}` |

The API returns compressed, tab-delimited report files. The provider downloads
every segment, verifies `sizeInBytes` and Apple’s MD5 `checksum`, validates the
header, then parses the rows. Apple’s signed segment URLs are short-lived, so
the segment listing and downloads happen in one pass.

## Output contract

JSON is the normalized format. Important top-level fields are:

- `requestedDateRange` and `generatedAt`.
- `funnel.steps`, with GA4 promotion views/clicks and Apple first-time and
  redownload slots.
- `funnel.conversionRates.promotionViewToClickUsers`, the only conversion
  rate currently computed. It uses GA4 users from the same report and does not
  mix Apple downloads with website clicks.
- `sources.ga4.provenance`, including property, endpoint, date range,
  retrieval time, and the GA4 maturity note.
- `sources.apple.provenance`, including selected report metadata and retrieval
  time when Apple discovery succeeds.
- `sources.apple.discovery`, when the App Store Discovery and Engagement report
  exists. Its event counts are separate from website GA4 counts, and its
  row-level `uniqueCounts` are not summed across dimensions.
- `campaignAttribution.ga4` and `campaignAttribution.apple`, intentionally
  separate. GA4 session campaigns are not treated as Apple `ct` campaign
  tokens.

Every numeric metric carries a status:

| Status | Meaning |
| --- | --- |
| `observed` | A numeric source value was returned and is greater than zero. |
| `zero` | The source returned an explicit numeric zero. |
| `missing` | No row/value was returned for the requested metric. This is not a zero. |
| `partial` | The requested window, segments, or required counts are incomplete. Aggregate `value` is `null`; never use it for a numeric trend. |
| `unavailable` | The provider or verified data path is not configured. |
| `error` | The provider request failed; the report keeps the failure bounded and does not invent a count. |

GA4 custom event dimensions are optional. If `app_store_placement` is not
registered, its breakdown is `unavailable` while the core event report still
runs. `pagePath` is queried separately.

Apple ingestion is DAILY-only. App Downloads is complete within two days and
App Store Discovery and Engagement within three days. A processing-date
instance can contain more than one `Date`; when instances overlap, a newer
`processingDate` replaces the entire older row set for that `Date`. The
provider therefore replaces partitions by latest `processingDate` and never
adds overlapping instances together. All segments of the selected instance
are combined because Apple defines segments as physical partitions of that
instance. Missing rows, privacy-withheld rows, invalid segments, and dates
that are not yet complete are reported as `missing` or `partial`, never as
zeroes.

### Integrity, retries, and deterministic reads

Each instance is atomic. A failed segment, invalid row, or wrong app identifier
discards that instance's rows. Successful physical partitions cannot silently
replace a complete older date partition with a smaller partial partition. A
failure anywhere in the required report window makes its aggregate metrics
`partial` with `value: null`, including the normalized funnel, campaign totals,
and discovery event totals. A dataset-level error also yields null metrics.

The ingestion record includes `instances.allRequiredSegmentsVerified`, per-instance
verification, expected-but-missing processing dates, verified/advertised segment
counts, and typed issues. Segment verification includes compressed byte size,
MD5, gzip/schema/row validation, and app ID. Listing failures can leave the
advertised segment total unknown, so equality of the two segment counts alone
does not establish completeness. Use `allRequiredSegmentsVerified` and coverage.
`observedDates` records returned rows; it does not imply complete date coverage.

Missing daily processing instances also block complete aggregates, even when an
older instance happens to contain rows for the same date. Empty or withheld
counts stay unknown. An acquisition total requires both a first-time download
count and a redownload count: a missing redownload row cannot silently become
zero. Auto-updates, manual updates, and restores remain excluded. Individual
verified discovery rows remain inspectable, but a partial window has no numeric
event aggregate; row-level unique counts are never summed.

Read-only Apple fetches make at most three attempts, using 250 ms and 750 ms
backoffs. Only HTTP 429/5xx, timeouts, connection resets, and temporary DNS
failures retry. The 45-second per-attempt timeout covers headers and the full
response body. HTTP 401/403/404, invalid JSON, validation failures, and unknown
network failures do not retry. Errors use allowlisted reasons such as
`request_timeout`, `network_connection_reset`, `http_503`,
`segment_checksum_mismatch`, and `report_app_id_mismatch`. No upstream exception
text, response body, bearer token, or signed URL is included in errors.

Pagination fails closed on a cycle, a 100-page bound, duplicate resource IDs,
malformed collections, changing advertised totals, or a final count that differs
from the advertised total. Authenticated pagination retains the App Store Connect
origin guard. Equal-rank requests and reports use ID tie-breakers; segment order
is stable, and newer processing-date partitions replace whole older date sets.

`sources.apple.ingestion` exposes all selected report paths, including Detailed
reports. Top-level `warnings` and Markdown show incomplete windows, typed segment
failures, and GA4 row truncation. Truncated GA4 core metrics cannot produce a
numeric conversion rate. Apple all-source downloads remain separate from GA4
website conversions and do not prove native first launch or campaign attribution.

For repeated reads of the same source snapshot, compare normalized metric values
and statuses, selected report/instance IDs, and completeness. Retrieval and
generation timestamps intentionally differ. A real Apple source correction may
change a later read; failed ingestion must produce an explicit null/partial result,
never a plausible lower complete total.

### Local repair verification, September 21, 2026

The reporter's three scripts and this runbook were untracked in
`/Users/abi/Sites/deepbreathing` and absent from default-branch commit `483bf394`.
Only these four files were recovered into the managed worktree
`/Users/abi/.codex/worktrees/8c8d/deepbreathing`, on branch
`codex/fix-appstore-report-determinism`. Existing default-branch attribution tests
were extended in place. The EAS credential wrapper was recovered unchanged;
unrelated dirty-checkout changes, dependencies, and package scripts were not copied.

Focused checks:

```bash
node --test scripts/tests/app-store-attribution.test.mjs scripts/tests/landing-funnel-attribution.test.mjs
node --check scripts/appstore/apple-reports.mjs
node --check scripts/appstore/funnel-report.mjs
node --check scripts/appstore/with-eas-credentials.mjs
git diff --check
```

The existing test file exercises complete and reversed-order reads; transient
recovery and retry exhaustion; header/body timeouts; size, checksum, gzip, schema,
row, date, and app-ID validation; non-retried authorization failures; pagination
and truncation; withheld counts; missing daily instances; correction replacement;
explicit zero versus missing counts; and JSON/Markdown propagation. Mocked reads
use generated in-memory keys and never reach external services.

For live verification of the repaired code before it is integrated, run the
unchanged wrapper from the canonical working directory using its worktree path:

```bash
cd /Users/abi/Sites/deepbreathing
node /Users/abi/.codex/worktrees/8c8d/deepbreathing/scripts/appstore/with-eas-credentials.mjs \
  --start 2026-09-15 --end 2026-09-18 --format json
```

Run that exact window twice. Require identical acquisition metric values/statuses,
all required download segments verified, and no missing requested download dates.
Report Discovery/Detailed gaps independently. Never pass `--enable-reports`.
At the local-verification checkpoint, the canonical checkout still ran the older
reporter and no release actions had been performed. The subsequent authorized
release publishes this repair through a pull request to `main`, then installs
only the reporter scripts and this runbook into the canonical automation checkout.
The reporter runs locally, outside the website and native application. It requires
no EAS build, App Store submission, or Apple reporting configuration change.
Verify the active canonical command after installation; a Vercel deployment alone
does not update the automation checkout.

#### Saved verification results

Two live reads of September 15 through September 18, 2026, generated at
`2026-09-21T13:52:26.629Z` and `2026-09-21T13:54:06.764Z`, passed the determinism
comparison. Acquisition metric values and statuses, download ingestion,
discovery aggregates, campaign rows, and warnings matched. Generation timestamps
were excluded from the comparison.

Both reads reported **8 observed first-time downloads across all Apple sources**.
Redownloads remained `value: null`, `status: missing`; total downloads remained
`value: null`, `status: partial` because both component counts are required.
The missing redownload row does not establish zero redownloads and may reflect
privacy withholding.

Download ingestion was `ok`, with all 7 advertised segments verified and
`allRequiredSegmentsVerified: true`. Processing dates September 17, 18, 19, and
20 supplied 2, 2, 2, and 1 segments respectively. Requested download-date coverage
was complete. Discovery remained partial because its September 21 processing
instance was missing: 3 existing segments were verified, but
`allRequiredSegmentsVerified` remained false. Detailed download and discovery
reports had no daily instances, and campaign attribution remained missing.
Neither GA4 read was truncated.

The focused command above passed **38 of 38 tests**, with no failures. Script
syntax checks, scoped lint, and `git diff --check` also passed. No full app build
was run. These results describe the repaired worktree and saved September 21
reads; they do not establish deployment, website-attributed installs, native
first launch, or GA4 receipt of `apple_campaign`.

Saved evidence is retained under
`/Users/abi/.codex/visualizations/2026/09/21/01a0c433-74ee-7bd1-8d3f-1ee670dcb307/appstore-reporter/`:
`determinism.json`, `live-final-1.json`, `live-final-2.json`,
`live-final-2.md`, `final-tests.txt`, and `lint.txt`. Temporary local dependency
links used during verification are not part of the implementation; the live
command above requires the worktree's runtime dependencies to be available.

The [App Store Downloads report](https://developer.apple.com/documentation/analytics-reports/app-download)
contains `Date`, `App Name`, `App Apple Identifier`, `Download Type`, `App
Version`, `Device`, `Platform Version`, `Source Type`, `Page Type`,
`Pre-Order`, `Territory`, and `Counts` in both Standard and Detailed reports.
Detailed additionally contains `Source Info`, `Campaign`, and `Page Title`.
The [App Store Discovery and Engagement report](https://developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement)
contains `Date`, `App Name`, `App Apple Identifier`, `Event`, `Page Type`,
`Source Type`, `Engagement Type`, `Device`, `Platform Version`, `Territory`,
`Counts`, and `Unique Counts` in both levels. Detailed additionally contains
`Page Title`, `Source Info`, and `Campaign`.

For current source definitions and report freshness, also read
[`docs/runbooks/tools-and-data-sources.md`](../runbooks/tools-and-data-sources.md)
and the [Apple App Downloads report field definitions](https://developer.apple.com/documentation/analytics-reports/app-download).

## Sep 5 verification and release boundary

On local branch `feat/breathing-polish`, the CLI reproduced the live GA4 Aug 28–Sep 3 totals: 759 visitors, 158 promotion-view users / 229 events, and 7 click users / 7 events (4.43%). Placement and page breakdowns returned successfully; no rows were truncated. Missing Apple credentials and skipped GA4 sources returned unavailable metrics without crashing. Syntax and the three existing attribution checks passed.

App Store Connect was separately checked in signed-in Chrome for Deep Breathing: Calm & Sleep (`6786431781`): the same date labels, in UTC, showed 42 impressions, 16 product-page views, and 10 first-time downloads. This browser observation is not an API import and must not be presented as fresh on later runs.

The campaign `pt=129077591&ct=dbe_website&mt=8` is live through PR #76, `main@12ae2316`, Vercel deployment `dpl_A81xKhDQBpPKEnouAErbttzK7ucB`. Rendered production `/breathing-app` and `/breathe/box` links were verified. Web tests/build passed. The unchanged Expo Doctor dependency-patch failure also exists on base main; no mobile release was performed.

Apple API authentication, report discovery, and repeat-safe ONGOING setup passed using the existing key in memory. Direct in-memory checks covered gzip/schema parsing, correction replacement, missing counts, date maturity, and the authenticated-origin guard. Acquisition totals include only first-time downloads and redownloads, not auto-updates, manual updates, or restores.

Not verified: campaign-attributed downloads, native first launch, GA4 receipt of the new campaign field, or ingestion of a real Apple report segment. The first generated files remain pending. Keep partial/missing dates explicit and compare complete equal windows only. The existing three-day review is configured to use the wrapper; it must not rerun setup or alter credentials.
