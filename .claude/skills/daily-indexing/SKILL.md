---
name: daily-indexing
description: Refresh the index status of deepbreathingexercises.com pages from the GSC URL Inspection API and triage anything Google has not indexed. Use when asked about indexing status, "are the translated pages indexed", "submit pages for indexing", "refresh the indexing queue", or to investigate not-indexed URLs. Read this before attempting any URL submission — most submission paths for this site are dead.
---

# Indexing status + triage

Refreshes `docs/indexing-queue.md` from Google, then triages what's left.

## Read this first: URL submission is mostly not a thing anymore

This skill used to submit URLs to Google and Bing daily. Most of that was ineffective or redundant. Verified 2026-07-09:

| Channel | Status | Why |
|---|---|---|
| Google Indexing API (`request_indexing`) | **Removed** | Google restricts it to `JobPosting` and `BroadcastEvent` pages. Ours are neither. It returns HTTP 200 for ineligible URLs, so it always looked like it worked. |
| `google.com/ping?sitemap=` | **Removed** | Endpoint deleted by Google in 2023. Returned 404 on every build. |
| `bing.com/ping?sitemap=` | **Removed** | Returns 410 Gone. |
| Bing via `submit_urls_bing` (mass-translate MCP) | **Not needed** | `postbuild` already submits every sitemap URL to IndexNow on each production deploy. See `scripts/ping-sitemap-lib.mjs`. |
| IndexNow | **Active, automatic** | Runs on every Vercel build. Covers Bing and Yandex. Google does not participate in IndexNow. |

**Do not reintroduce URL submission to Google.** There is no supported API for it on general pages. Google discovers pages through the sitemap (auto-discovered via `robots.txt`) and the `/languages` crawl hub. What we control is discoverability and page quality, not submission.

This also means the `mass-translate-backend` OAuth is no longer needed for indexing. It expired roughly every two weeks and cost several sessions. Nothing here depends on it.

## Refresh index status

Durable service-account auth. Nothing expires.

```bash
GSC_SA_KEY_FILE=~/.config/dbe-ga-visibility-sa.json node scripts/gsc-index-status.mjs
```

Flags: `--dry-run` (report only, no writes), `--limit N` (inspect only the first N pending rows).

The script inspects every row whose `Indexed` column is empty, marks the newly-indexed ones `✓`, and writes the file back. Rows already marked `✓` are skipped, so it gets cheaper each run.

Requirements, both already satisfied:
- `ga-visibility@deepbreathingexercises.iam.gserviceaccount.com` is an **Owner** of `sc-domain:deepbreathingexercises.com`. Editor is not enough; URL Inspection returns 403.
- The key lives at `~/.config/dbe-ga-visibility-sa.json` on mbp14 and `~/automations/deepbreathing-visibility/task/ga-sa-key.json` on orangepi. It is the same service account the weekly visibility digest uses.

Cadence: weekly is plenty. Daily runs told us nothing that a week wouldn't.

## Triage what is left

The script prints a `coverageState` per unindexed URL. Each state means something different, and only some are actionable.

**`Crawled - currently not indexed`** — Google fetched the page and chose not to index it. This is a quality or duplication judgment. Submission cannot fix it and never could. Fix the page: thin content, near-duplicate of the English original, or a machine translation that reads poorly. Concentrated in `ja` and `pt`.

**`Discovered - currently not indexed`** — Google knows the URL but has not crawled it. Usually crawl-budget. It resolves on its own, or improves with internal links from the `/languages` hub.

**`URL is unknown to Google`** — never discovered. Check whether the URL is in the sitemap and returns 200. If it 3xx-redirects, it belongs out of the queue, not in it.

**`Page with redirect`** / **`Duplicate, Google chose different canonical`** — usually correct behavior, not a bug. Check `docs/SEO-EXPERIMENTS.md` before investigating; the recurring "Page with redirect" alert is already logged there as a known no-action finding.

Before filing any of these as a problem, read `docs/SEO-EXPERIMENTS.md`. Most have been diagnosed already.

## Queue hygiene

`docs/indexing-queue.md` accumulates rows for URLs that later became redirects. If a row 3xx-redirects and is absent from `sitemap.xml`, delete the row. It is not an indexing failure.

The `GSC` and `Bing` date columns are historical. They record submissions from the era when we still submitted. Do not write new dates into them.

## Commit

```bash
git add docs/indexing-queue.md
git commit -m "chore(indexing): refresh index status from URL Inspection API"
```

## Report back (≤5 lines)

- Newly indexed since last run, and the current indexed / total
- Count of each `coverageState` among the unindexed
- Anything actionable, meaning quality fixes, not submissions
- Anything that looks like a discoverability bug, meaning sitemap or redirect problems
