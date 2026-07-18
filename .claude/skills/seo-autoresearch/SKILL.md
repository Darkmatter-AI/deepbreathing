---
name: seo-autoresearch
description: Run one cycle of the SEO autoresearch loop for deepbreathingexercises.com — settle overdue experiment verdicts, harvest ranking/CTR/crawl signals, rank hypotheses against the experiment log, ship at most one small experiment, update the ledger. Use when Abi says "/seo-autoresearch", "run an SEO cycle", "iterate on SEO", or on a manual trigger to push SEO upward. Manual trigger only (mbp14) — not scheduled.
---

# SEO Autoresearch Cycle

One cycle of the research-and-ledger loop agreed 2026-07-18. SEO feedback is slow (2–8 weeks), so the loop does NOT modify-measure-keep in one sitting. Each cycle does instant-feedback work and ships at most ONE experiment; the ledger of measure-after dates carries the slow feedback across cycles.

## Autonomy contract (Abi, 2026-07-18)

- **Ship small autonomously:** titles, metas, content sections, FAQs on EXISTING pages. Deploy to prod with logging + verification.
- **Ask before big:** new pages, redirects, anything touching sitemap/robots/canonicals/hreflang (the 2026-04-01 sitemap touch caused ~41% de-indexing), and reverts of prior experiments.
- Max ONE new experiment per cycle. Parallel experiments across cycles are fine only if their measurement surfaces don't overlap (different pages AND different metrics); never two changes to the same page while one is unmeasured.

## Cycle procedure

1. **Read first (non-negotiable):** `docs/SEO-EXPERIMENTS.md` index + Key Learnings, `docs/FUNNEL-DASHBOARD.md`, `docs/runbooks/tools-and-data-sources.md`.
2. **Settle verdicts.** Find entries whose measure-after date has passed. Apply the pre-committed criteria — do not relitigate. Data sources: `mcp__gsc__search_analytics` (durable SA), GSC Pages report + Ahrefs Site Audit project 9300406 via /chrome (mbp14 only), Bing via the orangepi digest. Update entry body + index row + roll-up counts.
3. **Harvest.** `mcp__gsc__detect_quick_wins` (30d), WoW query deltas, Ahrefs Top Issues, latest orangepi digest. Optionally a trend scan for the next 9D-style breakout (Google Trends, TikTok-adjacent wellness terms with KD 0–5 on Ahrefs).
4. **Rank hypotheses** against the log's learned rules:
   - WORKS at DR ~0.2: low-KD trend-riding content bets (9D cluster = ~40% of Google clicks); "Free X Timer" tool-intent title patterns; intent-targeted sections; unserved-intent coverage on already-ranking pages.
   - FAILS: content additions for competitive queries; metadata rewrites on click-killed SERPs (Coherent, Wim Hof/Bing); FAQ/schema tricks without top-5 position; synonym stuffing; any URL submission path to Google (all dead — see 2026-07-09 entry).
   - Discard anything the log already failed.
5. **Ship ≤1 experiment.** Branch from fresh `origin/main` in a worktree. Log the entry (hypothesis, baseline, pre-committed criteria, measure-after date) BEFORE deploying. Typecheck, PR, merge, deploy, cache-bust (`?cb=$(date +%s%N)`), verify SSR meta with a Googlebot UA (locale SEO tags only render for bot UAs).
6. **Report:** verdicts settled, what shipped, next measure-after dates, candidate hypotheses left on the table.

## Gotchas

- GSC drilldown deep-links 400 — navigate to the Pages report and click rows instead.
- Ahrefs + GSC UI need Abi's Chrome (mbp14). The gsc MCP (ga-visibility SA) works headless and never expires.
- URL Inspection `coverageState` drifts between reads; don't treat one read as fact.
- After any prod deploy, hit `/api/warm-cache` behavior is covered by the 2h cron, but verify locale pages respond warm before any crawl-sensitive measurement.
