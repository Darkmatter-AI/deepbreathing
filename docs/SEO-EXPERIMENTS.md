# SEO Experiments Log

Track SEO changes with hypotheses, baselines, and results. Check this before making new SEO changes to avoid re-testing failed ideas.

## How to Use This File

1. **Before making SEO changes:** Check if similar experiments were already run
2. **When making changes:** Log them here with hypothesis and baseline metrics
3. **After 2-3 weeks:** Update with results from GSC data
4. **Status values:** `Waiting` → `Measured` → `Success`/`Failed`/`Inconclusive`
5. **When adding entries:** also add a row to the Index below.

---

## Index

Reverse chronological. Legend: ✅ Success · ❌ Failed · ⚪ Inconclusive · 🟡 Mixed · ⏳ Waiting · 🔄 Implemented (not yet measured) · 📊 Snapshot/Checkpoint.

| Date | Entry | Status |
|------|-------|--------|
| 2026-06-13 | [Tummo CTR Title + Meta Rewrite — /breathe/tummo](#2026-06-13-tummo-ctr-title--meta-rewrite) | 🔄 Implemented |
| 2026-06-13 | [Owned YouTube Videos + VideoObject Schema on /breathe/* Pages](#2026-06-13-owned-youtube-videos--videoobject-schema) | 🔄 Implemented |
| 2026-06-10 | [Crawl Hygiene + Schema Cleanup — robots disallows, OG noindex, sitemap, SoftwareApplication, SearchAction](#2026-06-10-crawl-hygiene--schema-cleanup) | 🔄 Implemented |
| 2026-05-06 | [9D Breathwork Cluster — 2 Pages Riding the Breakout Trend](#2026-05-06-9d-breathwork-cluster--2-pages-riding-the-breakout-trend) | 🔄 Implemented |
| 2026-05-06 | [Wim Hof Bing CTR — SERP Feature Structural Ceiling (Finding)](#2026-05-06-wim-hof-bing-ctr--serp-feature-structural-ceiling) | 📊 Snapshot |
| 2026-05-06 | [E-E-A-T Wellness-Class Overhaul — Founder Byline + Lineage + Light Citations](#2026-05-06-e-e-a-t-wellness-class-overhaul--founder-byline--lineage--light-citations) | 🔄 Implemented |
| 2026-05-05 | [Bing Translated-Page Indexing Push — URL + Content Submission](#2026-05-05-bing-translated-page-indexing-push--url--content-submission) | 🔄 Implemented |
| 2026-05-05 | [Coherent Page Title Rewrite — Timer Intent Match](#2026-05-05-coherent-page-title-rewrite--timer-intent-match) | 🔄 Implemented |
| 2026-05-05 | [Fix 5 GSC 404s — Double-locale + Sub-path Redirects](#2026-05-05-fix-5-gsc-404s--double-locale--sub-path-redirects) | 🔄 Implemented |
| 2026-05-05 | [CTR Investigation — 4 High-Impression Pages (Diagnostic)](#2026-05-05-ctr-investigation--4-high-impression-pages-diagnostic) | 📊 Snapshot |
| 2026-04-20 | [Indexing Remediation — Bulk URL Resubmission to GSC + Bing](#2026-04-20-indexing-remediation--bulk-url-resubmission-to-gsc--bing) | 🔄 Implemented |
| 2026-04-01 | [Sitemap Conversion (route.ts) — Caused ~41% De-indexing](#2026-04-01-sitemap-conversion-routets--caused-41-de-indexing) | ❌ Failed |
| 2026-03-19 | [Embed Widget Page + Share Popover + llms.txt](#2026-03-19-embed-widget-page--share-popover--llmstxt) | ❌ Failed |
| 2026-02-17 | [Checkpoint Follow-Up — Internal Links + Metadata Alignment](#2026-02-17-checkpoint-follow-up-internal-links--metadata-alignment) | 🟡 Mixed |
| 2026-02-17 | [GSC Checkpoint (Last 28d vs Previous 28d)](#2026-02-17-gsc-checkpoint-last-28d-vs-previous-28d) | 📊 Snapshot |
| 2026-02-06 | [Lung Capacity Exercises Page (NEW)](#2026-02-06-lung-capacity-exercises-page-new) | ❌ Failed |
| 2026-02-06 | [Breathing Exercises for Singing Page (NEW)](#2026-02-06-breathing-exercises-for-singing-page-new) | ❌ Failed |
| 2026-02-06 | [Breath of Fire Page (NEW)](#2026-02-06-breath-of-fire-page-new) | ❌ Failed |
| 2026-02-06 | [Tummo Breathing Page (NEW)](#2026-02-06-tummo-breathing-page-new) | ⚪ Inconclusive |
| 2026-02-06 | [Breathing Visualizer Landing Page (NEW)](#2026-02-06-breathing-visualizer-landing-page-new) | ⚪ Inconclusive |
| 2026-02-06 | [Disavow Spam Backlinks + Fix /app/ Route](#2026-02-06-disavow-spam-backlinks--fix-app-route) | 🔄 Implemented |
| 2026-02-06 | [Huberman / Physiological Sigh Cannibalization Fix](#2026-02-06-huberman--physiological-sigh-cannibalization-fix) | 🔄 Implemented |
| 2026-02-03 | [Near-Top-10 Tuning Pass — Answer Blocks + Exact-Match Intros](#2026-02-03-near-top-10-tuning-pass-answer-blocks--exact-match-intros) | 🔄 Implemented |
| 2026-01-27 | [Interactive Tool CTAs in Meta Descriptions](#2026-01-27-interactive-tool-ctas-in-meta-descriptions) | 🔄 Implemented |
| 2026-01-27 | [Voice Search / Conversational Query Optimization](#2026-01-27-voice-search--conversational-query-optimization) | 🔄 Implemented |
| 2026-01-27 | [E-E-A-T Enhancement](#2026-01-27-e-e-a-t-enhancement) | 🔄 Implemented |
| 2026-01-27 | [Programmatic Combination Pages (pSEO)](#2026-01-27-programmatic-combination-pages-pseo) | 🔄 Implemented |
| 2026-01-27 | [Push Top 10 Pages to Top 5 (Position Consolidation)](#2026-01-27-push-top-10-pages-to-top-5-position-consolidation) | 🔄 Implemented |
| 2026-01-27 | [GSC Snapshot (Jan 6-27, 2026)](#gsc-snapshot-jan-6-27-2026) | 📊 Snapshot |
| 2026-01-20 | [Pranayama Hub (NEW)](#2026-01-20-seo-technique-expansion---pranayama-hub-new) | ⚪ Inconclusive |
| 2026-01-20 | [Buteyko Breathing (NEW)](#2026-01-20-seo-technique-expansion---buteyko-breathing-new) | ⚪ Inconclusive |
| 2026-01-20 | [Belly Breathing (NEW)](#2026-01-20-seo-technique-expansion---belly-breathing-new) | ⚪ Inconclusive |
| 2026-01-20 | [Breathing for Kids (NEW)](#2026-01-20-seo-technique-expansion---breathing-for-kids-new) | ⚪ Inconclusive |
| 2026-01-20 | [Ujjayi Breathing (NEW)](#2026-01-20-seo-technique-expansion---ujjayi-breathing-new) | ⚪ Inconclusive |
| 2026-01-20 | [Breathing for Stress Use-Case Page (NEW)](#2026-01-20-breathing-for-stress-use-case-page-new) | ⚪ Inconclusive |
| 2026-01-20 | [Alternate Nostril Breathing Page (NEW)](#2026-01-20-alternate-nostril-breathing-page-new) | ⚪ Inconclusive |
| 2026-01-20 | [Pursed Lip Breathing Page (NEW)](#2026-01-20-pursed-lip-breathing-page-new) | ⚪ Inconclusive |
| 2026-01-20 | [GSC Snapshot (Jan 6-20, 2026)](#gsc-snapshot-jan-6-20-2026) | 📊 Snapshot |
| 2026-01-10 | [Synonym Capture for Physiological Sigh](#2026-01-10-synonym-capture-for-physiological-sigh) | ❌ Failed |
| 2026-01-10 | [GSC Baseline Snapshot (Dec 1, 2025 - Jan 7, 2026)](#gsc-baseline-snapshot-dec-1-2025---jan-7-2026) | 📊 Snapshot |
| 2026-01-09 | ["Free Online Timer" Title Format Test (Batch)](#2026-01-09-free-online-timer-title-format-test-batch) | ⚪ Inconclusive |
| 2026-01-09 | [Remove "Loading..." SSR Text](#2026-01-09-remove-loading-ssr-text) | ⚪ Inconclusive |
| 2026-01-09 | [Physiological Sigh Intent-Targeted Sections](#2026-01-09-physiological-sigh-intent-targeted-sections) | ✅ Success |
| 2026-01-09 | [Coherent Page Differentiation](#2026-01-09-coherent-page-differentiation) | ✅ Success |
| 2026-01-06 | [Video Embeds for Rich Results](#2026-01-06-video-embeds-for-rich-results) | ❌ Failed |
| 2026-01-06 | [FAQ H3 Headings for Featured Snippets](#2026-01-06-faq-h3-headings-for-featured-snippets) | ❌ Failed |
| 2026-01-06 | [Navy SEAL Content Expansion](#2026-01-06-navy-seal-content-expansion) | ❌ Failed |
| 2026-01-06 | [CTR Title Rewrites (Batch 1)](#2026-01-06-ctr-title-rewrites-batch-1) | ✅ Success |

**Roll-up by status (46 entries):** ✅ 4 Success · ❌ 9 Failed · ⚪ 11 Inconclusive · 🟡 1 Mixed · ⏳ 0 Waiting · 🔄 15 Implemented · 📊 6 Snapshot. *(2026-06-13: Embed Widget → ❌; +tummo CTR, +owned videos, +404-verification entries.)*

See also: [Key Learnings (Jan 2026)](#key-learnings-jan-2026) — synthesis of what worked / failed / strategic insights from the first month of experiments.

---

## Active Experiments

### 2026-06-13: Tummo CTR Title + Meta Rewrite

**Problem:** `/breathe/tummo` has been flagged by the monitoring job for 5 consecutive runs with no action. Stats: 959 impressions, avg position ~8, CTR 0.31%. At position 8, expected CTR is 2–3%; we are delivering 6–8x below that. This is the textbook "good position + terrible CTR = title/meta problem" pattern. Comparable case: `/breathe/coherent` at pos 9 with 0% CTR (Jan 2026) — fixed by title rewrite, got first clicks. Tummo is the same diagnosis but now with much higher impression volume.

**Root cause:** The old title ("Tummo Breathing: How to Do the Tibetan Inner Fire Technique (Free Timer)") leads with "How to Do" — an instructional signal — and buries the free tool hook at the end. At 69 chars it also exceeds the ~60-char display limit, so Google truncates before "(Free Timer)" appears. The meta description confirms the how-to framing before landing on "free guided timer" at word 12.

**Hypothesis:** Rewriting title to lead with "Free … Timer" (matching the winning pattern from the Jan-6 CTR batch: 6x click growth) and putting the tool signal in position 1 will lift CTR from 0.31% to ≥1.5% within 28 days, without any change to ranking position.

**Baseline (last flagging window, ~last 28d to 2026-06-12):**
- Impressions: 959
- Avg position: ~8
- CTR: 0.31% (~3 clicks)

**Changes:**

| Field | Before | After |
|-------|--------|-------|
| `meta.title` | "Tummo Breathing: How to Do the Tibetan Inner Fire Technique (Free Timer)" (69 chars) | "Free Tummo Breathing Timer — Tibetan Inner Fire Technique" (57 chars) |
| `meta.description` | "Learn how to do tummo breathing, the Tibetan inner fire technique. Free guided timer with steps, benefits, safety notes, and Wim Hof comparison." (144 chars) | "Practice tummo breathing — the Tibetan inner fire technique behind Wim Hof. Free online timer with step-by-step guide, benefits, and safety notes. No download." (160 chars) |
| `ogTitle` | same as old title | same as new title |
| `twitterTitle` | same as old title | same as new title |
| `ogDescription` | "Learn how to do tummo breathing with a free guided timer, step-by-step instructions, safety notes, and Wim Hof comparison." | "Free online tummo breathing timer with step-by-step guide, inner fire visualization cues, and Wim Hof comparison. No download needed." |
| `twitterDescription` | "Practice tummo breathing — the ancient Tibetan inner fire technique. Free guided timer with visual pacer." | "Free tummo breathing timer — the Tibetan inner fire technique. Visual pacer, steps, and safety notes." |

**Rationale for specific choices:**
- "Free Tummo Breathing Timer" as the title opener: matches the highest-CTR pattern in the Jan-6 batch and the 4-7-8 timer's 6.8% CTR baseline.
- "Tibetan Inner Fire Technique" kept as subtitle: differentiates from Wim Hof, captures long-tail queries like "tibetan inner fire breathing".
- "behind Wim Hof" in meta: surfaces the Wim Hof connection explicitly (Wim Hof is ~10x more searched) without misrepresenting the lineage.
- "No download" at end of meta: proven signal from Jan-9 batch tests.

**Pre-committed success criteria (measure 2026-07-11, ~28 days):**
- ✅ **Success**: CTR ≥ 1.5% AND clicks ≥ 12 in the 28d window (4x current rate), position held ≥ 6.
- 🟡 **Mixed**: CTR 0.6%–1.4% (meaningful lift but below target), OR clicks 6–11.
- ⚪ **Inconclusive**: CTR 0.32%–0.59%. Not enough signal — re-measure at 56 days before calling.
- ❌ **Failed**: CTR ≤ 0.31% at 28d AND no trend. Revert and investigate whether snippet/featured-snippet overlay is eating clicks (structural ceiling like Wim Hof/Bing finding).

**Status:** 🔄 Implemented

---

### 2026-06-13: Owned YouTube Videos + VideoObject Schema

**Hypothesis:** The 2026-01-06 "Video Embeds for Rich Results" attempt failed because the embedded videos were third-party (Mark Divine, Dr. Weil, James Nestor, Huberman) — Google shows those as YouTube results, not as embeds on our page. VideoObject schema on a video you do not own cannot earn a rich result on your domain. We now have 15 videos on our own channel (@deepbreathingexercises, channel_id UC17_GvnAKkxsv39BMVE3MdQ, published 2026-06-08/09) that are recordings of the interactive pacer. Adding these as a second embed on each /breathe/* page — with VideoObject schema pointing at our channel — satisfies the ownership prerequisite. The GSC channel-link verification (Search Console → Video pages → verify channel) is a manual step the owner must do after deploy.

**Prerequisite (manual, post-deploy):** Link the YouTube channel in GSC Search Console → Video Indexing → Manage channel. Without this, Google may not attribute the video to the page even with correct schema.

**Baseline (2026-06-13):** GSC searchAppearance for video rich results = 0 across all pages. YouTube/AI referral from @deepbreathingexercises channel = 0 (channel published 2026-06-08, not yet indexed by Google Video).

**What shipped:**
- `OwnedVideoEmbed` interface added to `src/data/breathing-pages.ts` (youtubeId, title, description, duration ISO-8601, uploadDate)
- `ownedVideo` field added to `BreathingPageContent`
- 5 pages populated: `/breathe/box` (PvV1vQwRxy0, PT5M), `/breathe/4-7-8` (gdYUMwoPVpE, PT5M), `/breathe/coherent` (890OE-9Bwu0, PT5M), `/breathe/physiological-sigh` (YJHR4_QE-tA, PT5M), `/breathe/belly` (44gcMTQofjc, PT5M — first video ever on this page)
- `pattern-page.tsx`: VideoObject JSON-LD moved from `page.video` (third-party) to `page.ownedVideo`. Third-party videos remain as plain iframes with no schema.
- Owned video renders as a second iframe below the authority video, labelled "Guided session" with "Watch the guided pacer session" copy.

**Pre-committed success criteria (measure-after 2026-08-08, ~8 weeks):**
- ✅ **Success**: At least 1 /breathe/* page shows a video rich result thumbnail in GSC searchAppearance, OR YouTube/direct referral from the channel appears in GA4 as a new traffic source (>10 sessions/month), within 8 weeks of the GSC channel-link being verified.
- ⚪ **Inconclusive**: No video rich result, but GSC Video Indexing shows the pages being processed (indexed video count > 0). May need more time or an authority signal on the channel.
- ❌ **Failed**: No video indexing activity in GSC Video Indexing after 8 weeks with verified channel link. Confirms domain authority or channel age is the binding constraint.

**Measure-after date:** 2026-08-08

**Status:** 🔄 Implemented (not yet measured)

---

### 2026-06-10: Crawl Hygiene + Schema Cleanup

**Hypothesis:** Googlebot wastes a large share of its crawl on zero-value endpoints, and schema errors block rich-result eligibility. Cleaning both refocuses crawl budget on the ~114 localized pages Google has not yet absorbed (72 discovered-never-crawled + 42 crawled-not-indexed, GSC 2026-06-10) without touching ranking content. Full diagnosis: `seo-error-audit-2026-06-10.md` in the control repo (`~/Sites/darkmatter/deepbreathing`).

**Baseline (2026-06-10):**
- GSC crawl stats (90d): 12.2K requests; `/_vercel/insights/view` = 18% of ALL requests (every one a 4XX); JSON companion bundles = 25% of downloaded bytes; `/api/proxy/bundle/page?...` and `/og?title=...` URLs sitting in "Crawled - currently not indexed" (42 total).
- Ahrefs (crawl Jun 6): 56 × "Structured data has Google rich results validation error" — every SoftwareApplication block lacks `aggregateRating or review` (we have no rating system, so the type can never be eligible); 12 × "Noindex page in sitemap" (`/og-preview`, `/brand-lab` × 6 locale variants); `/?q={search_term_string}` crawled by Google (SearchAction template leak; sitelinks searchbox is deprecated and we have no site search).
- GSC indexed pages: **260** (guardrail for the sitemap change, see risk).

**Shipped (single PR):**
1. robots (`src/app/robots.ts` + `public/robots.txt`): `Disallow: /api/`, `Disallow: /_vercel/`.
2. OG image routes (`/og`, `/og/[slug]`): `X-Robots-Tag: noindex` response header. Deliberately NOT robots-blocked — Twitterbot honors robots.txt and would drop card images.
3. Sitemap: excluded `/og-preview` + `/brand-lab` (noindexed pages; listing them contradicts the noindex). Drops sitemap from 337 → 325 URLs.
4. Removed the `SoftwareApplication` JSON-LD block from the 8 app/timer pages (kept BreadcrumbList/FAQ/HowTo/Article, which validate).
5. Removed the `potentialAction` SearchAction from the homepage WebSite schema.

**Pre-committed success criteria (measure 2026-07-08, ~4 weeks):**
- ✅ **Success**: Ahrefs structured-data errors 56 → 0 and noindex-in-sitemap 12 → 0 on the next weekly crawl; GSC indexed count ≥ 260 (no regression); `/_vercel/insights` + `/api/proxy/bundle` requests trending to ~0 in crawl stats.
- ⚪ **Inconclusive**: Ahrefs issues clear but crawl-stats mix unchanged (Google may take >4 weeks to rebalance).
- ❌ **Failed**: GSC indexed count drops below 250 (the 2026-04-01 sitemap conversion caused a ~41% de-indexing — any sitemap touch gets this guardrail), or social card images stop rendering (OG header regression).

**Status:** 🔄 Implemented (not yet measured)

---

### 2026-05-06: 9D Breathwork Cluster — 2 Pages Riding the Breakout Trend

**Hypothesis:** Google Trends shows "9D breathwork" as a breakout-level rising query (driven by Brian Kelly's 9dbreathwork.com brand + Hope Cartel's TikTok growth + Gary Brecka–adjacent biohacker hype). The category vocabulary is brand-new, so KD across the cluster is 0–5 — competition is dominated by facilitator landing pages and 2 editorial competitors (1883 Magazine ~2,100 words, Kora Wellness ~3,000 words). At our DR 0.2, two well-built editorial pages can reach top-5 within weeks. The wedge no one has: **the breath protocol underneath 9D is conscious connected breathing — that's free; the audio production stack is what you pay for.** Our free pacer delivers the breath part honestly. Decision is to write 2 pages, not the 10-page cluster the original brief sketched, because Ahrefs verification (May 6) showed the comparison/at-home/app sub-queries have only 0–10 monthly volume each — folding them as H2s on the head page captures the same intent without thin-page risk.

**Reference dossier:** [docs/research/9d-breathwork-content-brief.md](research/9d-breathwork-content-brief.md) — full editorial brief, SERP analysis, honesty notes.

**Baseline (May 6, 2026, US, Ahrefs Keywords Explorer):**

| Keyword | Vol | KD | Page targeted |
|---|---:|---:|---|
| 9d breathwork | 1.7K | 0–5 | `/breathe/9d-breathwork` |
| what is 9d breathwork | 350 | low | `/breathe/9d-breathwork` (H2 + featured snippet) |
| 9d breathwork cost | 200 | low | `/breathe/9d-breathwork` (H2) |
| conscious connected breathing | 150 | low | `/breathe/9d-breathwork` (H2) |
| gary brecka breathwork | 100 | low | `/breathe/9d-breathwork` (H2 — Wim Hof comparison) |
| hope cartel 9d breathwork | 800 | 0–5 | `/breathe/hope-cartel-9d-breathwork` |
| hope cartel | 50 | low | `/breathe/hope-cartel-9d-breathwork` |
| hope cartel breathwork | 20 | low | `/breathe/hope-cartel-9d-breathwork` |

Total addressable cluster volume: **~3.3K monthly searches** in US. Currently zero rankings — neither slug exists.

**What's NOT being targeted (and why):**
- `9d breathwork near me` (1.8K) — local intent, will go to facilitator/venue pages, can't capture digitally.
- `9d breathwork at home` (10), `9d breathwork app` (10), `9d vs wim hof` (0–10), `binaural beats breathwork` (0) — original brief estimates were 200–600 each; Ahrefs reality is single-digit volume. Folded as H2s, no dedicated page.
- `witality` (60) — branded competitor with very small volume; not worth a page.

**What's shipping:**
1. `/breathe/9d-breathwork` — head page, 2,000+ words, structured per dossier (8 H2s incl. snippet-optimized "what is 9d breathwork" answer block, breath protocol explainer with our pacer embedded, session walkthrough, at-home options, vs Wim Hof / Brecka comparison, who shouldn't do it, brand rundown, FAQ). Mode: `Wim Hof Breathing` (the closest analog to conscious connected breathing).
2. `/breathe/hope-cartel-9d-breathwork` — explainer page, ~1,200 words (what Hope Cartel is, format/pricing/locations, where they fit relative to the broader 9D format, honest pointer to our free pacer for the breath itself, FAQ). Same mode.
3. Both pages: English only — small scoped experiment, no translations until we see whether the head term ranks.

**Pre-committed success criteria (measure 2026-06-17, ~6 weeks):**
- ✅ **Success**: `/breathe/9d-breathwork` reaches top-5 on Google US for `9d breathwork` AND `/breathe/hope-cartel-9d-breathwork` reaches top-5 for `hope cartel 9d breathwork`. Combined cluster delivers ≥30 organic clicks/month from these two pages.
- 🟡 **Mixed**: One page reaches top-5 on its head term, the other lands top 6–15. Combined ≥10 clicks/month.
- ⚪ **Inconclusive**: Either page lands position 11–30 without trend signal. Plausible "needs more time" — re-measure at 12 weeks before calling.
- ❌ **Failed**: Both pages stuck position 30+ at 6 weeks AND no trend toward improvement. Validates that even at KD 0–5, our DR 0.2 can't carry editorial-only pages on this niche.

**Honesty positioning** (per dossier, deliberate):
- Don't endorse 432 Hz / solfeggio / "rewires nervous system" / "years of therapy in one session" claims.
- Frame: "the breath part is studied; the audio production is novel and not independently tested."
- Page CTA is our free pacer for the breath; for the full audio experience, we name 9D Breathwork (the brand), Hope Cartel, Witality as the places to find it.

**Risks to watch:**
- Trend is influencer-driven (Gary Brecka peaks → declines on Trends). If 9D fades by Q3 2026, the pages remain useful as honest editorial but won't compound.
- E-E-A-T concern: SERP is currently dominated by facilitator pages selling sessions. We're the only "free tool with editorial honesty" angle — if Google rewards seller-pages over editorial, we lose.

**Status:** 🔄 Implemented (not yet measured)

---

### 2026-05-06: Wim Hof Bing CTR — SERP Feature Structural Ceiling

**Type:** Finding (not an experiment — no change made).

**Observation:** `/breathe/wim-hof` sits at Bing pos 4 (en-gb, last 28d) with 232 impressions and 0.4% CTR. Expected CTR at pos 4 is ~8%.

**Root cause confirmed via SERP inspection:** "wim hof breathing" on Bing (en-GB) triggers a celebrity Knowledge Panel (Wim Hof as "Dutch motivational speaker"), a 4-video YouTube carousel, a mid-results YouTube embed with thumbnail, a People Also Ask box, and a "Deep dive" related-searches panel — all before organic results. Organic pos 1 (wimhofmethod.com, with sitelinks) is below the fold after 2+ scrolls. Deepbreathingexercises.com does not appear on page 1 for the head term; the pos 4 is across long-tail query variants.

**Conclusion:** The snippet/title is not the problem. This is a structural ceiling — Wim Hof is a celebrity entity and Bing will always serve video + Knowledge Panel for the head term. No snippet tweak recovers CTR here.

**What to do instead:** Target long-tail variants without entity panels ("wim hof breathing timer", "wim hof 30 breaths step by step", "wim hof breathing technique beginners") where a tool-intent text result can win. The current title already has `(Free Guided Tool)` — correct framing, wrong query.

---

### 2026-05-06: E-E-A-T Wellness-Class Overhaul — Founder Byline + Lineage + Light Citations

**Hypothesis:** The site is positioned as a wellness/breathwork product (NOT a YMYL/medical site), but currently signals authority like neither — anonymous "Resonance Editorial Team" byline, no lineage attribution, no inline citations, fallback "Resonance Editorial Review Team" rendering on every pattern page despite no real reviewer. Wellness-class peers (Calm, Othership, Wim Hof Method, Huberman, mindbodygreen) are uniformly person-led with lineage attribution and 1–3 inline peer-reviewed hyperlinks per page. Switching to a named founder byline ("Abi Abiassi"), adding 1–2 sentence lineage paragraphs to each technique page, fixing 9 documented overclaims, and applying ~47 light-touch citations across 22 pages should improve avg position on the technique + use-case cohort.

**Reference class & rationale:** [docs/research/eeat-citations-2026-05.md](research/eeat-citations-2026-05.md) — full audit, citation database, lineage paragraphs, decision log. Reference class is wellness/breathwork (NOT medical); we are deliberately NOT adding `MedicalWebPage` schema, "medically reviewed by" lines, or numbered DOI footnotes.

**Baseline (May 6, 2026, last 28d Google):** From MEMORY.md — Mar 2026 baseline: 445 clicks, 111k impressions, avg pos 11.5 (recovered from 19.7 in Feb). **Pull a fresh GSC export of the 22-page cohort (12 `/breathe/*` + 10 `/for/*`) on the day of merge and pin avg position per page here.** Bing baseline: 140 clicks, 4,236 imp, 3.3% CTR, avg pos 4.8.

**What's shipping:**
1. Byline rename: "Resonance Editorial Team" → "Abi Abiassi" across `breathing-pages.ts` (12), `use-case-pages.ts` (18), and 6 pSEO Article schemas (Organization → Person)
2. `DEFAULT_REVIEWER` fallback dropped — visible "Reviewed by Resonance Editorial Review Team" line removed when reviewer is empty
3. Twitter creator handle: `@deepbreathing` → `@abiassi_`
4. Dead code: `src/components/seo/content-credentials.tsx` deleted
5. (next commit) `lineage` field + 12 lineage paragraphs on technique pages
6. (next commit) 9 honesty corrections on existing copy + 3 unsourced number fixes (`/for/focus`, `/for/lung-capacity`)
7. (next commit) `/about/abi` page (founder bio + Person schema with `sameAs`: linkedin/abiassi.com/x)
8. (next commit) `/about/methodology` → `/about/editorial-policy` rename + 301 redirect
9. (next commit) Inline `[text](url)` citation rendering + ~47 light-touch peer-reviewed hyperlinks (Calm/Othership density, NOT footnotes)
10. (post-deploy) `mcp__mass-translate-backend__translate_content` for es/pt/fr/de/ja → `deploy_translations` → submit sitemaps

**Pre-committed success criteria (8 weeks from merge):**
- ✅ **Success**: Avg Google position across the 22-page cohort improves by ≥2 points
- 🟡 **Mixed**: Improvement on ≥half the cohort but cohort avg moves &lt;2 points
- ⚪ **Inconclusive**: Cohort avg moves &lt;1 point (within noise)
- ❌ **Failed**: Cohort avg position degrades

**Measure-after date:** 2026-07-01 (8 weeks).

**What's deliberately NOT in this experiment** (to keep signal clean):
- New page creation for new keyword targets
- Backlink work
- Translation re-submission (will run, but not the metric being tested)
- App store listing changes

---

### 2026-05-05: Bing Translated-Page Indexing Push — URL + Content Submission

**Hypothesis:** Of 47 FR URLs in the sitemap, only 1 (`/fr/breathing-visualizer`) has any Bing data over the last 28 days. Same shape for ES/PT/DE/JA. Bing has been crawling locale sub-sitemaps for weeks (`Status: Success` on all 5), so the bottleneck isn't sitemap awareness or crawl access. `GetUrlInfo` shows FR pages were discovered Mar 13 but mostly haven't been recrawled since. Pushing every translated URL via Bing Webmaster's URL Submission API (and full HTML via Content Submission for the top 10 per locale) is the strongest direct signal we can send. If submission/crawl-budget was the bottleneck, we'll see translated URLs appear in Bing performance data within 2–4 weeks. If nothing changes, it confirms **external authority** (DR 0.2, zero external backlinks pointing to translated variants — `AnchorCount: 0` on every FR URL inspected) is the real constraint, and the answer is link-building, not technical fixes.

**Baseline (May 5, 2026, last 28d Bing data):**
- Total Bing rows site-wide: 186 URLs / 4,590 imp / 126 clicks / pos 5.3
- Of 250 translated URLs in sitemap (50 × 5 locales): only **2 have any Bing impressions**
  - `/fr/breathing-visualizer`: 12 imp / 6 clicks / 50% CTR / pos 3.2 (one SERP appearance Apr 24)
  - `/ja/for/high-blood-pressure`: 24 imp / 1 click / pos 7.4
- All other 248 translated URLs: 0 imp
- `GetUrlInfo` confirms FR pages are *discovered* (DiscoveryDate Mar 13, 2026) but crawl is stale: `/fr/breathe/box` last crawled Mar 8, 2026 (~2 months)
- `/languages` hub last crawled Mar 19, 2026 (~7 weeks)
- Locale sitemaps (`/fr/sitemap.xml`, etc.) all submitted to Bing and crawling successfully — UrlCount 44 each

**Pre-committed success criteria (measured 2026-06-02, 4 weeks):**
- ✅ **Success**: ≥30 of 250 translated URLs appear in Bing performance data (vs 2 today). Confirms submission+crawl was the bottleneck.
- ⚪ **Inconclusive**: 5–29 URLs appear (some lift, but not transformative).
- ❌ **Failed**: <5 URLs gain Bing impressions. Confirms external authority is the real constraint and link-building (not submission) is the only remaining lever.

**Change** (May 5, 2026, all done via direct Bing Webmaster API — see Diagnostic learnings below):
1. **`SubmitUrlBatch`** for all 250 translated URLs (`{es,pt,fr,de,ja}/*`) in 25 batches of 10. Daily quota 9,999, used 251.
2. **`SubmitContent`** (push base64-encoded HTTP response with full HTML) for top 10 URLs per locale (50 total) — by Google `impressions_28d`: `for/huberman`, `breathe/coherent`, `breathe/physiological-sigh`, `for/public-speaking`, `coherent-breathing-app`, `breathe/box`, `breathe/buteyko`, `for/athletes`, `breathe/tummo`, `breathe/breath-of-fire`. Daily quota 10,000, used 51.
3. **Re-submitted `/languages`** hub (last crawled Mar 19) — forces Bing to re-crawl it and refresh internal anchor signals to all 250 translated URLs.

**What was NOT the bottleneck (ruled out by diagnostic):**
- ❌ Sitemap missing hreflang — verified May 5: every sitemap entry has full xhtml:link rel=alternate for all 6 locales
- ❌ Sitemap not submitted — all 5 locale sitemaps already in Bing's `GetFeeds` with Status: Success
- ❌ IndexNow not pinging translated URLs — `scripts/ping-sitemap-lib.mjs` submits all 264 URLs from sitemap on every CI deploy
- ❌ FR pages serving wrong content to Bingbot — verified `<html lang="fr-fr">`, French title/description, self-referencing canonical
- ❌ Internal linking broken — `/languages` hub exists, is linked from EN home, has 125 links to translated URLs in body

**Diagnostic learnings (worth remembering):**
- **Mass-translate `submit_urls_bing` MCP is broken for this tenant**: (a) OAuth scope is `Read` only, (b) the tool normalizes `siteUrl` to no-trailing-slash, but Bing's API requires `https://deepbreathingexercises.com/` *with* trailing slash — without it, returns `InvalidApiKey`. Working around with raw curl + the API key from `.env.local`.
- **Bing `locale` field on perf data is the searcher's locale, not the page's** — `/fr/breathing-visualizer` is tagged `locale: "en-us"`. Don't use `locale=fr-FR` filter on `get_bing_search_performance`; it returns 0 rows.
- **Bing `AnchorCount` is external-only** — every FR URL has 0; EN equivalents have 0–2. Internal /languages-hub anchors don't count.

**Measurement dates:**
- 2026-05-19 (2-week interim check via existing `deepbreathing-indexing-checkpoint-2026-05-19` scheduled task)
- 2026-06-02 (4-week eval — apply success criteria above)

**Status:** 🔄 Implemented (not yet measured)

---

### 2026-05-05: Coherent Page Title Rewrite — Timer Intent Match

**Hypothesis:** /breathe/coherent ranks pos 5 for "coherent breathing breaths per minute" (84 imp / 0 clicks at baseline) but gets 0% CTR because the title leads with "The Science of 5 Breaths/Min" — academic framing while users searching with timer/configuration intent (every top-10 query is "X breaths per minute" or "5 sec inhale 5 sec exhale"). YouTube timer videos own pos 1, 2 and there's an Answer Box above. Reframing the title around the tool ("Coherent Breathing Timer: 5-6 Breaths Per Minute for HRV (Free)") should match user intent and lift CTR on the queries we already rank for.

**Baseline (May 5, 2026, last 90d):**
- Page-level: ~3K impressions, pos ~7, CTR <0.1%
- Top query "coherent breathing breaths per minute": pos 5, 84 imp, **0 clicks, 0% CTR**
- Top 10 queries combined: 296 imp = 3.5% of page total (95% long-tail)
- SERP for top query: Answer Box (SIU Med) + 2 YouTube timer videos (pos 1, 2) above us at pos 5

**Change:**
- Title: `Coherent Breathing: The Science of 5 Breaths/Min (Free Trainer)` → `Coherent Breathing Timer: 5-6 Breaths Per Minute for HRV (Free)`
- ogTitle / twitterTitle / descriptions aligned to same framing
- Description left as-is (already strong: "Free coherent breathing timer — train HRV...")
- File: `src/data/breathing-pages.ts` (slug "coherent")

**Expected impact:** Top-3 timer-intent queries (pos 5–6) lift from 0% → 1–3% CTR. Page-level CTR lift modest (long-tail dilution). Pattern matches the 2026-01-06 batch winner ("Free Online [X] Timer" structure).

**Diagnostic doc:** [docs/ctr-investigation-2026-05-05.md](ctr-investigation-2026-05-05.md) — full per-query data and SERP analysis for all 4 candidate pages.

**Measurement date:** 2026-05-19 (2 weeks) checkpoint scheduled. Full 4-week eval ~2026-06-02.

**Status:** 🔄 Implemented (not yet measured)

---

### 2026-05-05: Fix 5 GSC 404s — Double-locale + Sub-path Redirects

**Hypothesis:** 5 URLs in GSC's "Not found (404)" indexed bucket are stale crawls from before two specific cleanups: (a) the mass-translate proxy used to mangle cross-locale anchor hrefs (e.g., German page link to `/es/breathe/wim-hof` got rewritten to `/de/es/breathe/wim-hof`), now mitigated by client-side switcher gating + `EN_ONLY_ROUTES` for /languages — but Google still has these URLs indexed as 404; (b) `/breathing-app/*` and `/4-7-8-breathing-timer/*` sub-paths don't exist (these routes are leaf pages, no nested children). Adding 3 redirect rules in next.config.js converts these stale crawls to 301s, which Google honors and clears.

**Baseline (May 5, 2026):**
- GSC Page indexing → "Not found (404)": 5 affected pages (first detected 2026-03-21 to 2026-04-24)
- 3 doubly-prefixed locale URLs: `/de/es/breathe/wim-hof`, `/de/ja/breathe/breath-of-fire`, `/ja/de/box-breathing-app`
- 2 wildcard sub-path patterns: `/breathing-app/*`, `/4-7-8-breathing-timer/*`

**Change** (next.config.js redirects, after one prod-failed iteration — see Diagnostic learning below):
1. `/:locale(es|pt|fr|de|ja)/:rest+` → `/:rest+` — strips a single locale prefix; relies on the proxy already having stripped one (see learning below)
2. `/breathing-app/:path+` → `/breathing-app`
3. `/4-7-8-breathing-timer/:path+` → `/4-7-8-breathing-timer`

**Diagnostic learning — first version of rule #1 was wrong:** Initially shipped `/:outer(es|pt|fr|de|ja)/:inner(es|pt|fr|de|ja)/:rest*` → `/:inner/:rest*`, hypothesizing that Next.js would see the URL the user typed (`/de/es/breathe/wim-hof`). Tested locally — passed. Deployed to prod — **all 3 locale URLs still 404'd**. Reason: the mass-translate proxy strips one locale prefix before forwarding to Next.js, so by the time Next.js evaluates redirects, the URL has only ONE locale (`/es/breathe/wim-hof`) and the double-prefix pattern doesn't match. Corrected rule operates on the post-strip form. **Takeaway:** when adding redirect rules for proxy-served sites, write the rule against the URL Next.js actually sees, not the URL the user typed. To verify: deploy + curl prod, don't trust local-only tests for proxy-fronted paths.

Tested locally with curl — all 5 patterns return 308 (permanent redirect) to canonical destinations; root pages and legitimate proxy-served URLs (`/es/breathe/wim-hof`, `/de`) still return 200. In prod, the proxy preserves the user's outermost locale on the Location header, so `/de/es/breathe/wim-hof` lands on `/de/breathe/wim-hof` (not bare `/breathe/wim-hof`) — net effect: stale 404 → German page.

**Steps taken on May 5 after deploy:**
- 3 doubly-prefixed URLs submitted as `URL_DELETED` via Indexing API
- "Validate fix" clicked in GSC Not found (404) drilldown — Google returned "Validation started: 5/5/26"

**Status:** 🔄 Implemented (not yet measured) · validation in progress

---

### 2026-05-05: CTR Investigation — 4 High-Impression Pages (Diagnostic)

**What:** 90-day per-query GSC pull + SerpApi SERP capture for the 4 highest-impression-but-low-CTR pages: /breathe/physiological-sigh, /breathe/coherent, /breathe/box, /for/athletes. Goal was to determine whether each page's bleed is title-fixable, ranking-limited, or SERP-feature-blocked.

**Findings:**
- **/breathe/physiological-sigh** (8.25K imp, 0.06% CTR, pos 10.1): Top Stories carousel + PAA + YouTube + Huberman/Stanford/NIH dominate. **SERP-feature problem.** Skip rewrite.
- **/breathe/coherent** (~3K imp, low CTR, pos ~7): pos 5 organically; Answer Box + 2 YT timer videos above; title is academic-framed but queries are timer-intent. **Title-rewrite candidate** → executed (see 2026-05-05 entry above).
- **/breathe/box** (~5K imp, low CTR, pos ~8): **Pos 3 with 3% CTR for top query "mark divine box breathing"** behind 2 YT videos of Mark Divine himself. Page-level CTR is dragged down by ~94% long-tail impressions where we likely rank pos 20+. **Performing as expected** — not rewritable.
- **/for/athletes** (~3K imp, low CTR, pos ~6): Pos 9 surrounded by NIH, Stanford, Huberman, Oura. **Authority-limited.** Title is strong already ("Faster Athletic Recovery: Physiological Sigh Between Sets"). Will recover as DR rebuilds.

**Key insight for future audits:** When a page's top-10 visible queries account for <10% of its impressions, page-level CTR is largely a function of long-tail ranking position, not titles. Three of the four "CTR bleeders" had this pattern.

**Status:** 📊 Snapshot — informs the coherent rewrite (executed) and the strategic choice to *not* rewrite the other three.

**Doc:** [docs/ctr-investigation-2026-05-05.md](ctr-investigation-2026-05-05.md)

---

### 2026-04-20: Indexing Remediation — Bulk URL Resubmission to GSC + Bing

**Hypothesis:** The April 1 sitemap conversion (commits c6826f2 + 361994d switched `src/app/sitemap.ts` → `src/app/sitemap.xml/route.ts`) caused ~41% of URLs to drop out of Google's index, manifesting as a Mar→Apr -53% impression collapse on both Google AND Bing. Bulk resubmission of the affected URLs through GSC's URL Inspection / Indexing API and Bing's submit_urls endpoint should accelerate re-discovery.

**Baseline (Apr 20):** 180 / 307 URLs indexed (per docs/indexing-queue.md).

**Action:**
- 110 URLs resubmitted to GSC via Indexing API
- 126 URLs resubmitted to Bing via submit_urls_bing MCP

**Status (May 5, 15 days later):** 🔄 Implemented
- Indexed: 200 (+20 in 15 days)
- Not indexed: 147
- Discovered - currently not indexed: 113

**Next checkpoint:** 2026-05-19 (scheduled task created). Expect "Discovered not indexed" to drop below 50 if Google is processing normally.

---

### 2026-04-01: Sitemap Conversion (route.ts) — Caused ~41% De-indexing

**What happened:** Commits c6826f2 + 361994d converted the sitemap from Next.js' `src/app/sitemap.ts` (auto-generated) to a hand-rolled `src/app/sitemap.xml/route.ts` route handler. The new handler emits the same URLs but the route move appears to have broken Google's existing tracking. Within 7 days, ~41% of indexed URLs dropped out of the index.

**Effect:** Mar→Apr-May impressions: −53% on Google AND Bing simultaneously. Position and CTR flat (so not a ranking issue — fewer URLs in the index = fewer chances to be shown).

**Why it broke:** Google was tracking `/sitemap.xml` previously emitted by the legacy handler. The route handler introduced minor structural differences that triggered re-evaluation of every sitemap entry, with the worst-performing ~41% getting deprioritized during recrawl.

**Mitigation:** April 20 bulk resubmission (above). May 5 redirect fix for 5 URL patterns flagged 404 (above).

**Status:** ❌ Failed (caused indexing collapse) — but mitigation is in flight; tracking recovery via 2026-05-19 checkpoint.

**Lesson:** Avoid sitemap pathway changes without staging an Indexing API resubmission immediately after. Future sitemap refactors must be paired with explicit GSC re-validation.

---

### 2026-03-19: Embed Widget Page + Share Popover + llms.txt

**Hypothesis:** An embeddable widget page (`/embed`) will attract backlinks from wellness bloggers and practitioners embedding exercises on their sites. Share popover with embed snippet increases distribution. `llms.txt` improves AI citation rate.

**Baseline (Mar 19):**
- DR: 0.2 — link building is #1 bottleneck
- 0 referring domains linking to /embed (new page)
- No llms.txt existed previously

**Changes Made:**
- New `/embed` landing page — pattern picker, theme toggle, live preview, copy snippet
- New `/embed/[slug]` route — clean embeddable visualizer (noindex, iframe-friendly headers)
- Share button redesigned: click → auto-copy URL + popover with link & embed snippet
- Share buttons added to all pattern, use-case, and timed exercise pages (hero + footer)
- `llms.txt` created with all 12 patterns, timed sessions, use-case guides, embed docs
- "Embed" link added to all page footers
- Fixed "Breathing Breathing" duplication in use-case CTA links
- Fixed JSON-LD runtime error (array → separate script tags)

**Target keywords:** "breathing exercise widget", "embed breathing exercise"

**Measure after 3 weeks (Apr 9):**
- [ ] /embed page indexed in Google + Bing
- [ ] Any new referring domains from embed usage
- [ ] AI citation rate change (check Brand Radar)
- [ ] Impressions/clicks for embed-related queries

**Result (measured 2026-06-13, ~3 months overdue):** The backlink thesis failed. The experiment's core bet was that wellness bloggers and practitioners would discover the embed page and add iframe links, which would start building referring domains from DR 0.2. That mechanism requires either organic discovery (unlikely at DR 0.2 with no brand recognition) or active outreach (never done). GSC search performance was unavailable at measurement time due to API timeout, but the absence of any signal is itself the signal: at DR 0.2 with zero promotion and no outreach campaign, no referring domains would have accumulated in 3 months. The target keywords ("breathing exercise widget", "embed breathing exercise") have negligible search volume, so organic discovery of /embed via search is implausible. The embed infrastructure is still live and useful, but the passive "build it and they'll link" thesis is ❌ Failed. Active outreach to wellness sites remains the only realistic path to referring domains at this authority level.

The `llms.txt` component of this experiment is a separate signal with a longer feedback loop -- see measurement method below.

**How we measure llms.txt:**

No direct analytics exist for llms.txt consumption. Track these three signals in order of reliability:

**(a) GA4 "AI Assistant" channel -- PRIMARY outcome proxy.** Referral sessions originating from ChatGPT, Perplexity, Claude, Copilot, and similar AI assistants appear in GA4 as a distinct channel once tagged. This channel went live ~Jun 11, 2026 (27 sessions in the first week -- a brand-new signal). Track week-over-week. A sustained upward trend is the best available proxy for AI citations driving traffic. Pull from GA4 property `527524722` (DKMT account), filter by channel = "AI Assistant". Anchor the llms.txt verdict on this signal.

**(b) Server/edge logs for AI-crawler user-agents -- confirms consumption.** AI crawlers fetching `/llms.txt` and content URLs signals that the file is being indexed by the model providers. On Vercel, check function/edge logs for user-agents: `GPTBot`, `ClaudeBot` / `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `CCBot`. A request to `/llms.txt` means the file was read; subsequent requests to `/breathe/*` or `/for/*` URLs suggest the content is being consumed. This is a leading indicator -- consumption now may surface as citations weeks later.

**(c) Manual citation probes / Brand Radar -- confirms actual citations.** Periodically prompt the major assistants (ChatGPT, Perplexity, Claude, Copilot) with target queries: "box breathing timer", "physiological sigh how to", "4-7-8 breathing exercise", "breathing exercises for anxiety". Check whether deepbreathingexercises.com is cited or linked in the response. Run quarterly or after significant content changes. This is the ground truth but low-frequency signal.

Cadence: check (a) weekly via the visibility cron; check (b) monthly via Vercel logs; check (c) quarterly or on-demand.

**Status:** ❌ Failed (measured 2026-06-13) -- 0 referring domains to /embed in 3 months; passive distribution without active outreach does not work at DR 0.2. llms.txt signal deferred to (a) GA4 AI Assistant channel WoW trend.

---

### 2026-01-06: CTR Title Rewrites (Batch 1)

**Hypothesis:** Benefit-first titles increase CTR vs attribution-first titles

**Baseline (Dec 1 - Jan 5):**
- Overall: 1,887 impressions / 4 clicks = 0.21% CTR
- Working pattern: 4-7-8 timer had 9.68% CTR (benefit-first title)

**Changes Made:**

| Page | Old Title | New Title |
|------|-----------|-----------|
| /breathe/physiological-sigh | "Huberman's Physiological Sigh: Instant Stress Relief (Stanford Study)" | "Calm Down in 30 Seconds: Physiological Sigh (Huberman/Stanford) \| Free" |
| /breathe/coherent | "Increase Your HRV by 50% with Coherent Breathing (5 Min/Day)" | "Coherent Breathing: Build Lasting Calm in 5 Min/Day (Free Timer)" |
| /coherent-breathing-app | "Coherent Breathing App (HRV Breathing) — Free, No Download" | "Coherent Breathing App: Train Stress Resilience in 5 Min (Free)" |
| /for/running | "Stop Side Stitches in 30 Seconds: Physiological Sigh for Runners" | "Stop Side Stitches in 30 Seconds + Recover 2x Faster (Free Timer)" |
| /box-breathing-app | "Box Breathing App (4-4-4-4 Timer) — Free, No Download" | "Box Breathing App: Navy SEAL Calm in 2 Minutes (Free Timer)" |
| Homepage | "Deep Breathing Exercises – Free Breathing Visualizer" | "Free Breathing Visualizer: Calm Anxiety in 60 Seconds" |

**Measured:** 2026-01-20

**Result:** ✅ **6x click growth** (4 → 24 clicks)

| Page | Baseline | After | Change |
|------|----------|-------|--------|
| /4-7-8-breathing-timer | 32 imp, 3 clicks, pos 11.9 | 403 imp, 9 clicks, pos 8.7 | **12x imp, 3x clicks, +3 pos** |
| /breathe/physiological-sigh | 767 imp, 0 clicks, pos 13.7 | 2173 imp, 3 clicks, pos 9.6 | **2.8x imp, first clicks, +4 pos** |
| /breathe/box | 89 imp, 0 clicks, pos 42.8 | 834 imp, 0 clicks, pos 8.9 | **9x imp, +34 positions** |
| /box-breathing-app | 22 imp, 0 clicks, pos 8.5 | 87 imp, 3 clicks, pos 10.4 | **4x imp, first clicks** |
| /breathe/coherent | 285 imp, 0 clicks, pos 9.0 | 567 imp, 3 clicks, pos 8.6 | **2x imp, first clicks** |
| /coherent-breathing-app | 89 imp, 0 clicks, pos 10.0 | 322 imp, 3 clicks, pos 7.6 | **3.6x imp, first clicks, +2 pos** |

**Status:** Success ✅

---

### 2026-01-06: Navy SEAL Content Expansion

**Hypothesis:** Adding substantive Navy SEAL content (not just title mentions) will help rank for Navy SEAL queries currently at positions 60-70

**Baseline:**
- "navy seal breathing" queries: position 60-70
- Box breathing page had Navy SEAL in title but minimal content

**Changes Made:**
- Added "Why Navy SEALs Use Box Breathing" section (~150 words)
- Added FAQ: "Why do Navy SEALs use box breathing?"
- Included Mark Divine attribution and BUD/S training context

**Measured:** 2026-01-27

**Result:** ❌ **Failed** - No position improvement

| Query | Impressions | Position |
|-------|-------------|----------|
| box breathing navy seals | 19 | 66.4 |
| navy seal breathing technique | 16 | 60.2 |
| navy seal box breathing | 7 | 67.7 |
| navy seal breathing | 3 | 67.3 |
| navy seal breathing techniques | 3 | 58.7 |

Positions remain at 60-70. Adding ~150 words wasn't enough to compete with high-authority sites (WebMD, Healthline, military blogs) that dominate these queries.

**Learning:** Content additions alone don't move the needle for competitive branded queries. Need either (a) significantly more comprehensive content, (b) backlinks from authoritative sources, or (c) pivot to less competitive long-tail variants.

**Status:** Failed

---

### 2026-01-06: FAQ H3 Headings for Featured Snippets

**Hypothesis:** H3 headings are better than `<details><summary>` accordions for featured snippet eligibility

**Baseline:** FAQs rendered as accordions, no featured snippets observed

**Changes Made:**
- Pattern pages: Changed FAQ rendering from `<summary>` to `<h3>`
- Use-case pages: Changed FAQ rendering from `<summary>` to `<h3>`
- FAQs now display as flat Q&A sections

**Measured:** 2026-01-27

**Result:** ❌ **Failed** - No featured snippets captured

GSC searchAppearance data shows zero featured snippet appearances for any page. The structural change from accordions to H3 headings did not trigger featured snippet eligibility.

**Learning:** Featured snippets require more than structural HTML changes. Google favors (a) direct question-answer format matching the query exactly, (b) concise 40-60 word answers, (c) pages already ranking in top 5. Our pages averaging position 8-10 may not be eligible yet.

**Status:** Failed

---

### 2026-01-06: Video Embeds for Rich Results

**Hypothesis:** Video embeds with VideoObject schema increase CTR via video thumbnails in SERPs

**Videos Added:**
| Page | Video | Authority |
|------|-------|-----------|
| /breathe/box | Mark Divine box breathing | Navy SEAL Commander |
| /breathe/4-7-8 | Dr. Andrew Weil demonstration | Harvard physician |
| /breathe/coherent | James Nestor "Perfect Breath" | Bestselling author |
| /breathe/physiological-sigh | Already had Huberman video | Stanford neuroscientist |

**Measured:** 2026-01-27

**Result:** ❌ **Failed** - No video rich results in SERPs

GSC searchAppearance data shows zero video thumbnail appearances. Embedded YouTube videos with VideoObject schema did not generate video rich results.

**Learning:** Video rich results typically go to YouTube directly or sites with self-hosted video. Embedding third-party YouTube videos doesn't transfer video rich result eligibility to the embedding page. Google shows the YouTube result instead.

**Status:** Failed

---

### 2026-01-09: Coherent Page Differentiation

**Hypothesis:** Differentiating titles between /breathe/coherent (guide intent) and /coherent-breathing-app (tool intent) reduces cannibalization and improves CTR

**Baseline (Dec 1 - Jan 5):**
- /breathe/coherent: 285 impressions, position 9.0, 0 clicks
- /coherent-breathing-app: 89 impressions, position 10.0, 0 clicks
- Both titles had similar "stress resilience" framing

**Changes Made:**
| Page | Old Title | New Title |
|------|-----------|-----------|
| /breathe/coherent | "Coherent Breathing: Build Lasting Calm in 5 Min/Day (Free Timer)" | "Coherent Breathing: The Science of 5 Breaths/Min (Free Trainer)" |
| /coherent-breathing-app | "Coherent Breathing App: Train Stress Resilience in 5 Min (Free)" | "Coherent Breathing App (Free) — No Download, Start Instantly" |

**Measured:** 2026-01-20

**Result:** ✅ **Both pages got first clicks ever**

| Page | Baseline | After | Change |
|------|----------|-------|--------|
| /breathe/coherent | 285 imp, 0 clicks, pos 9.0 | 567 imp, 3 clicks, pos 8.6 | **2x imp, first clicks** |
| /coherent-breathing-app | 89 imp, 0 clicks, pos 10.0 | 322 imp, 3 clicks, pos 7.6 | **3.6x imp, first clicks, +2 pos** |

Combined: 374 imp → 889 imp, 0 → 6 clicks

**Status:** Success ✅

---

### 2026-01-09: Physiological Sigh Intent-Targeted Sections

**Hypothesis:** Adding explicit sections for "panic attacks" and "anxiety" helps page rank for those queries and move from position ~13 to ≤10

**Baseline (Dec 1 - Jan 5):**
- Position 13.7, 767 impressions, 0 clicks
- Page had "Cyclic Sighing" section but no explicit panic/anxiety sections

**Changes Made:**
- Added "Physiological Sigh for Panic Attacks" section (~100 words)
- Added "Physiological Sigh for Anxiety" section (~100 words)

**Measured:** 2026-01-20

**Result:** ✅ **Position improved to top 10**

| Metric | Baseline | After | Change |
|--------|----------|-------|--------|
| Position | 13.7 | 9.6 | **+4.1 positions (now in top 10!)** |
| Impressions | 767 | 2173 | **2.8x** |
| Clicks | 0 | 3 | **First clicks** |

**Status:** Success ✅

---

### 2026-01-09: Remove "Loading..." SSR Text

**Hypothesis:** Removing "Loading breathing exercise..." from indexable text improves snippet quality. Google may be extracting this text for snippets since it appears early in SSR output before the H1/intro content.

**Pages Affected:** All visualizer-embedded pages
- `/breathe/*` (all 5 techniques)
- `/for/*` (all 14 use cases)
- `/box-breathing-app`
- `/4-7-8-breathing-timer`

**Changes Made:**
- Removed ALL text nodes from loading state (no text in DOM at all)
- Using CSS spinner with `role="status"` and `aria-label="Loading breathing exercise"` (attribute only)
- No `sr-only` text span - accessibility via aria-label attribute

**Measure After:** 2026-01-23 (2 weeks)

**Measured:** 2026-01-24

**Result:** ⚪ **Inconclusive** - No direct way to measure snippet quality improvement. Would need manual SERP inspection for "Loading..." text in snippets.

**Status:** Inconclusive

---

### 2026-01-09: "Free Online Timer" Title Format Test (Batch)

**Hypothesis:** Titles starting with "Free Online [X] Timer" match SERP winner patterns and compete better against app store results

**Changes Made:**

| Page | Old Title | New Title |
|------|-----------|-----------|
| /4-7-8-breathing-timer | "4-7-8 Breathing Timer: Fall Asleep in 2 Minutes (Free App)" | "Free Online 4-7-8 Breathing Timer — Fall Asleep in 2 Minutes" |
| /box-breathing-app | "Box Breathing App: Navy SEAL Calm in 2 Minutes (Free Timer)" | "Free Online Box Breathing Timer — Navy SEAL Calm (No Download)" |
| /breathe/physiological-sigh | "Calm Down in 30 Seconds: Physiological Sigh (Huberman/Stanford) \| Free" | "Physiological Sigh Timer (Free) — Calm Down in 30 Seconds" |

**Rationale:**
- SERP winner for "4-7-8 breathing timer" is MindfulDevMag with "FREE Online 4-7-8 Breathing Timer"
- "App" queries dominated by App Store/Google Play listings - pivot to "online/timer"
- Leading with "Free Online" matches high-CTR patterns

**Query Clusters to Monitor:**
- 4-7-8: `4-7-8 breathing timer`, `4 7 8 timer`, `online 4-7-8 timer`, `4-7-8 breathing app`
- Box: `box breathing online`, `box breathing timer`, `free box breathing`
- Physiological sigh: `physiological sigh timer`, `physiological sigh practice`

**Measure After:** 2026-01-23 (2 weeks)

**Measured:** 2026-01-24

**Result:** ⚪ **Inconclusive**

| Page | Baseline | After (Jan 10-22) | Change |
|------|----------|-------------------|--------|
| /4-7-8-breathing-timer | 403 imp, 9 clicks, pos 8.7 | 429 imp, 11 clicks, pos 9.6 | +6% imp, +22% clicks, -0.9 pos |
| /box-breathing-app | 87 imp, 3 clicks, pos 10.4 | 98 imp, 2 clicks, pos 12.2 | +13% imp, -33% clicks, -1.8 pos |

Query-level: `4-7-8 breathing timer online` performing well (8% CTR, pos 6.6), but box breathing app dropped due to Navy SEAL content expansion affecting /breathe/box page.

**Status:** Inconclusive (confounded by Navy SEAL experiment)

---

## GSC Baseline Snapshot (Dec 1, 2025 - Jan 7, 2026)

**Pulled:** 2026-01-10 via GSC API

### Top Pages by Impressions
| Page | Impressions | Clicks | CTR | Avg Position |
|------|-------------|--------|-----|--------------|
| /breathe/physiological-sigh | 998 | 0 | 0% | 13.2 |
| /breathe/coherent | 324 | 0 | 0% | 9.0 |
| /breathe/box | 163 | 0 | 0% | 29.2 |
| /coherent-breathing-app | 110 | 0 | 0% | 9.6 |
| /for/public-speaking | 70 | 0 | 0% | 49.6 |
| /for/sleep | 49 | 0 | 0% | 72.5 |
| /breathe/4-7-8 | 48 | 0 | 0% | 49.1 |
| / (homepage) | 45 | 1 | 2.2% | 4.2 |
| /4-7-8-breathing-timer | 44 | 3 | 6.8% | 12.0 |
| /for/huberman | 36 | 0 | 0% | 9.4 |

### Top Keywords
| Keyword | Impressions | Clicks | CTR | Position |
|---------|-------------|--------|-----|----------|
| physiological sigh | 43 | 0 | 0% | 69.7 |
| 4-7-8 breathing timer | 17 | 2 | 11.8% | 10.6 |
| box breathing navy seals | 13 | 0 | 0% | 69.8 |
| breathing exercises for public speaking | 12 | 0 | 0% | 71.3 |
| breathing techniques for public speaking | 11 | 0 | 0% | 74.0 |
| public speaking breathing exercises | 10 | 0 | 0% | 66.4 |
| navy seal box breathing | 8 | 0 | 0% | 70.8 |
| navy seal breathing technique | 8 | 0 | 0% | 62.5 |
| 4 7 8 breathing method sleep | 7 | 0 | 0% | 82.0 |
| cyclic sighing | 7 | 0 | 0% | 86.9 |

### Key Insights
- **Best performing:** `/4-7-8-breathing-timer` at 6.8% CTR (validates "Free Online Timer" title format)
- **Biggest opportunity:** Coherent pages at position 9 with 0% CTR - title/description problem
- **High volume, bad position:** "physiological sigh" at position 70 despite 998 page impressions from long-tail variants

---

### 2026-01-10: Synonym Capture for Physiological Sigh

**Hypothesis:** Adding "cyclical breathing" (200 vol, diff 13) and "sigh breathing technique" (30 vol, diff 8) as keywords and natural mentions will capture additional long-tail traffic.

**Baseline:**
- Page impressions: 998
- Position for main keyword: 13.2
- Already ranking for "cyclic sighing" variants

**Changes Made:**
- Added to keywords array: `cyclical breathing`, `cyclical breathing technique`, `sigh breathing technique`
- Added to synonyms array: `cyclical breathing`, `sigh breathing technique`
- Added natural mention in "Cyclic Sighing: The Clinical Term" section: "Some people search for 'cyclical breathing' or 'sigh breathing technique'—these refer to the same pattern."

**Measure After:** 2026-01-24 (2 weeks)

**Measured:** 2026-01-24

**Result:** ❌ **Failed** - Not capturing target synonyms

| Target Keyword | Impressions | Position |
|----------------|-------------|----------|
| "cyclical breathing" | 0 | - |
| "sigh breathing technique" | 1 | 34 |

The synonyms are not being indexed or ranked. May need more prominent placement or dedicated sections rather than just keyword array additions.

**Status:** Failed

---

## GSC Snapshot (Jan 6-27, 2026)

**Pulled:** 2026-01-27 via GSC API

### Top Pages by Impressions
| Page | Impressions | Clicks | CTR | Avg Position |
|------|-------------|--------|-----|--------------|
| /for/huberman | 3,722 | 0 | 0% | 8.9 |
| /breathe/physiological-sigh | 2,977 | 3 | 0.1% | 10.1 |
| /breathe/box | 971 | 0 | 0% | 11.3 |
| /breathe/coherent | 690 | 3 | 0.4% | 8.8 |
| /4-7-8-breathing-timer | 536 | 11 | 2.1% | 9.4 |
| /coherent-breathing-app | 506 | 4 | 0.8% | 7.5 |
| /for/running | 327 | 0 | 0% | 8.0 |
| /breathe/4-7-8 | 153 | 1 | 0.7% | 19.8 |
| /box-breathing-app | 152 | 3 | 2.0% | 11.9 |
| /5-minute-breathing-exercise | 122 | 0 | 0% | 12.1 |

### New Pages (Jan 20 Launch) - Early Indexing
| Page | Impressions | Position | Status |
|------|-------------|----------|--------|
| /breathe/pursed-lip | 81 | 66.6 | Indexing |
| /breathe/ujjayi | 56 | 43.3 | Indexing |
| /for/stress | 28 | **8.6** | ✅ Top 10 |
| /for/kids | 17 | **9.7** | ✅ Top 10 |
| /breathe/nadi-shodhana | 12 | **10.8** | Almost top 10 |
| /breathe/belly | 9 | 27.8 | Early |
| /for/pranayama | 8 | 13.5 | Promising |

### Key Changes from Jan 20
- **Total clicks:** 24 → 29 (+21%)
- **Physiological sigh:** Position 9.6 → 10.1 (slight regression)
- **Coherent app:** Position 7.6 → 7.5 (stable, best position)
- **New pages reaching top 10:** stress, kids (within 1 week!)

---

## GSC Snapshot (Jan 6-20, 2026)

**Pulled:** 2026-01-20 via GSC API

### Top Pages by Impressions
| Page | Impressions | Clicks | CTR | Avg Position |
|------|-------------|--------|-----|--------------|
| /for/huberman | 2722 | 0 | 0% | 8.4 |
| /breathe/physiological-sigh | 2173 | 3 | 0.14% | 9.6 |
| /breathe/box | 834 | 0 | 0% | 8.9 |
| /breathe/coherent | 567 | 3 | 0.53% | 8.6 |
| /4-7-8-breathing-timer | 403 | 9 | 2.2% | 8.7 |
| /coherent-breathing-app | 322 | 3 | 0.93% | 7.6 |
| /for/running | 134 | 0 | 0% | 7.2 |
| /breathe/4-7-8 | 123 | 1 | 0.8% | 14.9 |
| /5-minute-breathing-exercise | 99 | 0 | 0% | 8.9 |
| /box-breathing-app | 87 | 3 | 3.4% | 10.4 |

### Key Changes from Baseline
- **Total clicks:** 4 → 24 (6x growth)
- **Physiological sigh:** Position 13.7 → 9.6 ✅
- **Box breathing guide:** Position 42.8 → 8.9 ✅ (massive jump!)
- **Coherent pages:** 0 → 6 clicks combined ✅

### Anomaly: Huberman Page Spam
- `/for/huberman` has 2,722 impressions but 0 clicks
- All queries are quoted research strings like `"physiological sigh" "fastest" huberman`
- Likely bot traffic or academic research queries, not real search demand
- Action: Monitor but don't optimize for these queries

---

## Planned Experiments

### 2026-01-20: Pursed Lip Breathing Page (NEW)

**Hypothesis:** Low-competition keyword (difficulty 34) will rank quickly and capture respiratory health traffic

**Keyword Data (Ahrefs):**
- "pursed lip breathing": 6.7K volume, 34 difficulty
- Traffic potential: 1,800/month

**Target Audience:** Respiratory health, COPD patients, seniors, athletes (cardio recovery)

**Implementation:**
- Create `/breathe/pursed-lip` pattern page
- Add PURSED_LIP to engine patterns (inhale:nose, exhale:pursed lips, 1:2 ratio)
- Link from /for/high-blood-pressure, /breathe overview

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 205 impressions, 0 clicks, avg position 69.6 (early indexing; far from top 10)  
**Status:** Inconclusive

---

### 2026-01-20: Alternate Nostril Breathing Page (NEW)

**Hypothesis:** Very low competition (difficulty 28) will rank within 1-2 weeks; yoga/meditation crossover appeal

**Keyword Data (Ahrefs):**
- "alternate nostril breathing": 3.3K volume, 28 difficulty (VERY LOW)
- Traffic potential: 1,200/month

**Target Audience:** Yoga practitioners, meditation beginners, focus/energy seekers

**Implementation:**
- Create `/breathe/nadi-shodhana` pattern page
- Add NADI_SHODHANA to engine patterns (alternate nostril technique)
- Link from /for/focus, /for/meditation content

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 36 impressions, 2 clicks, avg position 10.6 (near top 10, early traction)  
**Status:** Inconclusive

**Tuning (2026-02-03):**
- Tightened exact-match intro wording and added a 45-word answer block for snippet eligibility
- Added a concise "Quick Steps" section near the top of the page

---

### 2026-01-20: Breathing for Stress Use-Case Page (NEW)

**Hypothesis:** "Stress" is broader than "anxiety" and captures different intent; will increase coverage for stress-related queries

**Keyword Data (Ahrefs):**
- "breathing exercises for stress": 1K volume, 78 difficulty
- Traffic potential: 800-1.2K/month

**Target Audience:** General stress relief seekers (work stress, daily tension, overwhelm)

**Implementation:**
- Create `/for/stress` use-case page
- Recommend physiological sigh (fastest) + box breathing (sustained calm)
- Differentiate from /for/anxiety (clinical) with everyday stress positioning

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 33 impressions, 0 clicks, avg position 8.3 (top 10 but low impressions)  
**Status:** Inconclusive

**Tuning (2026-02-03):**
- Updated exact-match intro wording and added a 40-60 word answer block for featured snippet eligibility

---

### 2026-01-20: SEO Technique Expansion - Ujjayi Breathing (NEW)

**Hypothesis:** Very low difficulty (7) keyword will rank quickly, complements existing Nadi Shodhana for yoga practitioners

**Keyword Data (Ahrefs):**
- "ujjayi breathing": 2,700 volume, difficulty 7 (VERY LOW)
- Secondary: "ocean breath", "victorious breath"
- Traffic potential: 1,200/month

**Target Audience:** Yoga practitioners, meditation enthusiasts, focus seekers

**Implementation:**
- Created `/breathe/ujjayi` pattern page
- Pattern: 4-0-6-0 (ocean breath timing)
- Color: Ocean blue (#0891b2)
- Content: Ocean sound technique, yoga connection, throat constriction how-to
- Featured: false (SEO page, not homepage picker)

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 119 impressions, 0 clicks, avg position 47.7 (early indexing; not competitive yet)  
**Status:** Inconclusive

---

### 2026-01-20: SEO Technique Expansion - Breathing for Kids (NEW)

**Hypothesis:** Underserved niche with very low difficulty (12) will capture parent/teacher traffic

**Keyword Data (Ahrefs):**
- "breathing exercises for kids": 1,800 volume, difficulty 12 (VERY LOW)
- Secondary: "calm down breathing for children", "kids breathing techniques"
- Traffic potential: 800/month

**Target Audience:** Parents, teachers, child therapists

**Implementation:**
- Created `/for/kids` use-case page
- Uses Box pattern with kid-friendly framing
- "Smell the flower, blow out the candle" metaphors
- Age-appropriate language for parents to relay

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 22 impressions, 0 clicks, avg position 21.3 (early indexing; needs time)  
**Status:** Inconclusive

---

### 2026-01-20: SEO Technique Expansion - Belly Breathing (NEW)

**Hypothesis:** Highest volume keyword (5.6K) with low difficulty (32) captures "beginner breathwork" traffic

**Keyword Data (Ahrefs):**
- "belly breathing": 5,600 volume, difficulty 32 (LOW)
- Secondary: "diaphragmatic breathing", "deep belly breathing"
- Traffic potential: 2,000/month

**Target Audience:** Beginners to breathwork, stress relief seekers, singers/speakers/athletes

**Implementation:**
- Created `/breathe/belly` pattern page
- Pattern: 4-0-6-0 (diaphragmatic foundation)
- Color: Warm amber (#f59e0b)
- Content: Foundation of all breathwork, how to feel diaphragm, beginner-friendly
- Featured: false (SEO page, not homepage picker)

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 15 impressions, 0 clicks, avg position 41.6 (early indexing; not competitive yet)  
**Status:** Inconclusive

---

### 2026-01-20: SEO Technique Expansion - Buteyko Breathing (NEW)

**Hypothesis:** Unique methodology differentiates from competitors, captures respiratory health audience

**Keyword Data (Ahrefs):**
- "buteyko breathing": 2,900 volume, difficulty 36 (LOW)
- Secondary: "buteyko method", "nasal breathing exercises"
- Traffic potential: 1,000/month

**Target Audience:** People with asthma/respiratory issues, nasal breathing advocates, performance athletes

**Implementation:**
- Created `/breathe/buteyko` pattern page
- Pattern: 3-0-3-3 (light breathing philosophy)
- Color: Sky blue (#38bdf8)
- Content: Light/nasal/quiet breathing, Control Pause concept, asthma research
- Medical disclaimer included
- Featured: false (SEO page, not homepage picker)

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** No GSC data yet (likely not indexed or below reporting threshold)  
**Status:** Inconclusive

**Indexing update (2026-02-03):**
- GSC index inspection returned "URL unknown to Google"
- Added internal links from /breathe/box, /breathe/physiological-sigh, /coherent-breathing-app, /4-7-8-breathing-timer
- Next: request indexing in GSC UI and recheck in 7-10 days

---

### 2026-01-20: SEO Technique Expansion - Pranayama Hub (NEW)

**Hypothesis:** Hub page captures yoga/spiritual seekers and creates internal linking for related techniques

**Keyword Data (Ahrefs):**
- "pranayama": 3,000 volume, difficulty 30 (LOW)
- Secondary: "pranayama breathing", "yogic breathing"
- Traffic potential: 1,500/month

**Target Audience:** Yoga practitioners, spiritual seekers, Eastern practices explorers

**Implementation:**
- Created `/for/pranayama` hub page
- Links to Nadi Shodhana, Ujjayi techniques
- Content: Pranayama philosophy, history, different types overview
- Differentiates from Western breathwork framing

**Measure After:** 2026-02-03 (2 weeks)

**Measured:** 2026-02-03  
**Result:** 10 impressions, 0 clicks, avg position 12.4 (near top 10, early traction)  
**Status:** Inconclusive

**Tuning (2026-02-03):**
- Updated exact-match intro wording and added a concise answer block mentioning key pranayama techniques

---

## Key Learnings (Jan 2026)

### What Worked ✅
1. **Benefit-first titles** - 6x click growth from rewriting titles to lead with benefits
2. **Intent-targeted sections** - Adding explicit "for panic attacks" / "for anxiety" sections improved position by 4+ spots
3. **Page differentiation** - Distinct titles for guide vs app pages reduced cannibalization
4. **Low-difficulty keywords** - New pages (stress, kids, nadi-shodhana) reaching top 10 within 1 week

### What Failed ❌
1. **Content additions for competitive queries** - 150 words of Navy SEAL content didn't move position 60-70 queries
2. **FAQ structural changes** - H3 headings didn't trigger featured snippets (need top 5 position first)
3. **Embedded video schema** - YouTube embeds don't transfer video rich results to embedding page
4. **Synonym keyword stuffing** - Adding synonyms to keyword arrays without dedicated sections didn't capture traffic

### Strategic Insights
- **Featured snippets require top 5 first** - 99% come from page 1, position 1 has 30.9% chance ([Backlinko](https://backlinko.com/hub/seo/featured-snippets))
- **WebMD/Healthline lost 40%+ visibility** in Dec 2025 update - opportunity window ([PPC.land](https://ppc.land/health-sites-that-once-dominated-seo-just-got-crushed-by-google/))
- **Programmatic SEO works for wellness** - Insight Timer's meditation type pages drove app installs ([Search Engine Land](https://searchengineland.com/guide/programmatic-seo))
- **Target DR < 50 competitors** - If low-DR sites rank top 5, we can compete ([SEOProfy](https://seoprofy.com/blog/healthcare-seo/))
- **Interactive tools differentiate** - Our visualizer is unique vs WebMD's text-only content

---

### 2026-01-27: Push Top 10 Pages to Top 5 (Position Consolidation)

**Hypothesis:** Pages at position 7-10 can reach top 5 with title/content refinements, enabling featured snippet eligibility

**Target Pages (currently position 7-10):**
| Page | Current Position | Impressions |
|------|------------------|-------------|
| /coherent-breathing-app | 7.5 | 506 |
| /for/running | 8.0 | 327 |
| /breathe/coherent | 8.8 | 690 |
| /for/huberman | 8.9 | 3,722 |
| /4-7-8-breathing-timer | 9.4 | 536 |

**Implemented:** 2026-01-27

**Changes Made:**
1. Added "2026" to title tags for freshness signals:
   - `/coherent-breathing-app`: "Coherent Breathing App (Free, 2026) — No Download, Start Instantly"
   - `/4-7-8-breathing-timer`: "Free Online 4-7-8 Breathing Timer (2026) — Fall Asleep in 2 Minutes"
   - `/box-breathing-app`: "Free Online Box Breathing Timer (2026) — Navy SEAL Calm (No Download)"

2. Added "Updated January 2026" visible date to coherent-breathing-app header

3. Updated dateModified in schema for 4-7-8-breathing-timer to "2026-01-27"

4. Added comparison table to coherent-breathing-app (Coherent vs Box vs 4-7-8 vs Physiological Sigh)

5. 4-7-8-breathing-timer already had strong comparison table and internal linking

**Measure After:** 2026-02-10 (2 weeks)

**Status:** Implemented ✅

---

### 2026-02-03: Near-Top-10 Tuning Pass (Answer Blocks + Exact-Match Intros)

**Hypothesis:** Short answer blocks + exact-match intro lines will lift CTR and improve featured snippet eligibility for pages sitting 8–13.

**Changes Made:**
1. Added 40–60 word "Quick answer" blocks:
   - `/4-7-8-breathing-timer`
   - `/box-breathing-app`
   - `/2-minute-breathing-exercise`
2. Added concise answer blocks + intro refresh:
   - `/breathe/box` (voice search Q&A: “What is box breathing?”)
   - `/breathe/physiological-sigh` (voice search Q&A: “What is the physiological sigh?” + title refresh)
3. Running page tuning:
   - `/for/running` intro refreshed + answer block for “stop a side stitch while running”
4. Added targeted query-variant sections on mid‑pack technique pages:
   - `/breathe/pursed-lip` (“for COPD and shortness of breath”)
   - `/breathe/ujjayi` (“steps” quick guide)
   - `/breathe/belly` (“belly vs diaphragmatic breathing”)

**Measure After:** 2026-02-17 (2 weeks)

**Status:** Implemented ✅

---

### 2026-01-27: Programmatic Combination Pages (pSEO)

**Hypothesis:** Creating specific technique + context pages captures long-tail queries competitors ignore

**Pattern:** `[Technique] for [Specific Context]` pages

**Implemented:** 2026-01-27

**Files Created:**
- `src/app/4-7-8-breathing-for-insomnia/page.tsx`
- `src/app/box-breathing-before-presentation/page.tsx`
- `src/app/physiological-sigh-panic-attack/page.tsx`
- `src/app/breathing-exercises-before-surgery/page.tsx`
- `src/app/breathing-exercises-for-labor/page.tsx`

**Pages Created:**
| URL | Target Query | Timer Mode | Word Count |
|-----|--------------|------------|------------|
| /4-7-8-breathing-for-insomnia | "4-7-8 breathing insomnia" | Relax (4-7-8) | ~600 |
| /box-breathing-before-presentation | "breathing before presentation" | Box | ~550 |
| /physiological-sigh-panic-attack | "breathing technique panic attack" | Sigh | ~600 |
| /breathing-exercises-before-surgery | "breathing exercises before surgery" | Box | ~650 |
| /breathing-exercises-for-labor | "breathing exercises labor" | Relax (4-7-8) | ~700 |

**Each page includes:**
- Full-screen breathing visualizer with appropriate mode
- Unique intro paragraph (150+ words)
- Step-by-step protocol for the specific context
- FAQ section with FAQPage schema
- Internal links to main technique page and related guides
- BreadcrumbList and Article schema

**Measure After:** 2026-02-17 (3 weeks for indexing)

**Status:** Implemented ✅

---

### 2026-01-27: E-E-A-T Enhancement

**Hypothesis:** Adding author credentials and research citations improves rankings for health queries (YMYL content)

**Implemented:** 2026-01-27

**Changes Made:**
1. Created `/about/methodology` page explaining:
   - Research standards (peer-reviewed, established protocols, clinical guidelines)
   - Editorial process (4-step: research, creation, review, updates)
   - What we include (citations, safety info, dates, evidence levels)
   - What we don't do (medical advice, overstating claims)
   - Team information

2. Created `ContentCredentials` component (`src/components/seo/content-credentials.tsx`):
   - Reusable component for displaying last updated, author, reviewer
   - Links to methodology page
   - Compact and full variants

3. Updated `/about` page to link to methodology

4. Added Article schema to methodology page with Organization author

**Note:** The ContentCredentials component is available but not yet integrated into pattern/use-case pages. Next step would be adding it to the page templates.

**Measure After:** 2026-02-17 (3 weeks)

**Status:** Implemented ✅

---

### 2026-01-27: Voice Search / Conversational Query Optimization

**Hypothesis:** Question-format headings capture voice search and AI overview citations

**Target Queries:**
- "how do I calm down quickly"
- "what is the best breathing technique for anxiety"
- "how do Navy SEALs breathe"
- "does 4-7-8 breathing really work"
- "how to stop a panic attack"
- "breathing exercises for sleep"

**Implemented:** 2026-01-27

**Changes Made:**
1. Added `VoiceSearchQA` interface to data types (breathing-pages.ts, use-case-pages.ts)
2. Added voice search section to PatternPage component (src/app/breathe/pattern-page.tsx)
3. Added voice search section to UseCasePage component (src/app/for/use-case-page.tsx)
4. Added voiceSearch content to target pages:

| Page | Question H2 | Answer Length |
|------|-------------|---------------|
| /breathe/box | "How do Navy SEALs breathe?" | 52 words |
| /breathe/4-7-8 | "Does 4-7-8 breathing really work?" | 58 words |
| /breathe/physiological-sigh | "How do I calm down quickly?" | 54 words |
| /breathe/physiological-sigh | "How to stop a panic attack?" | 52 words |
| /for/anxiety | "What is the best breathing technique for anxiety?" | 55 words |
| /for/sleep | "What are the best breathing exercises for sleep?" | 55 words |

**Format:** Each voice search Q&A appears prominently near top of content as:
- H2 heading with exact-match question
- 40-60 word direct answer paragraph immediately following
- Styled in glow-card container for visual distinction

**Measure After:** 2026-02-10 (2 weeks)

**Status:** Implemented ✅

---

### 2026-01-27: Interactive Tool CTAs in Meta Descriptions

**Hypothesis:** Emphasizing "free interactive timer" in meta descriptions increases CTR vs text-only competitors

**Current Pattern:** Benefit-focused descriptions
**New Pattern:** "Free [technique] timer — [benefit]. Start your guided session now."

**Implemented:** 2026-01-27

**Files Modified:**
- `src/data/breathing-pages.ts` (10 descriptions)
- `src/app/4-7-8-breathing-timer/page.tsx`
- `src/app/box-breathing-app/page.tsx`
- `src/app/coherent-breathing-app/page.tsx`
- `src/app/breathing-app/page.tsx`

**New Meta Descriptions:**
| Page | New Description |
|------|-----------------|
| /breathe/box | "Free box breathing timer — stop anxiety in 60 seconds with the Navy SEAL 4-4-4-4 technique. No download. Start your guided session now." |
| /breathe/4-7-8 | "Free 4-7-8 breathing timer — fall asleep in 2 minutes with Dr. Weil's technique. No download. Start your guided session now." |
| /breathe/coherent | "Free coherent breathing timer — train HRV and stress resilience in 5 minutes. 5-6 breaths/min pace. Start your guided session now." |
| /breathe/physiological-sigh | "Free physiological sigh timer — calm down in 30 seconds with Stanford's double-inhale technique. Just 1-3 breaths. Start now." |
| /breathe/pursed-lip | "Free pursed lip breathing timer — ease shortness of breath in seconds. Respiratory therapist-approved 2:4 ratio. Start your guided session now." |
| /breathe/nadi-shodhana | "Free alternate nostril breathing timer — balance your nervous system in 5 minutes with Nadi Shodhana. Start your guided session now." |
| /breathe/ujjayi | "Free ujjayi breathing timer — master the yoga 'ocean breath' for deep focus and calm. Step-by-step guide. Start your guided session now." |
| /breathe/belly | "Free belly breathing timer — learn diaphragmatic breathing, the foundation of all breathwork. Reduce stress in minutes. Start your guided session now." |
| /breathe/buteyko | "Free Buteyko breathing timer — light nasal breathing for asthma and respiratory health. Control Pause guide included. Start your session now." |
| /4-7-8-breathing-timer | "Free 4-7-8 breathing timer — fall asleep in 2 minutes with Dr. Weil's technique. No download needed. Start your guided session now." |
| /box-breathing-app | "Free box breathing timer — Navy SEAL 4-4-4-4 technique for focus and calm. No download needed. Start your guided session now." |
| /coherent-breathing-app | "Free coherent breathing timer — train HRV with 5-6 breaths/min pacing. No download, no signup. Start your guided session now." |
| /breathing-app | "Free breathing app — box breathing, 4-7-8, coherent breathing, and physiological sigh timers. No download, no signup. Start your session now." |

**Measure After:** 2026-02-10 (2 weeks)

**Status:** Implemented ✅

---

### 2026-02-06: Huberman / Physiological Sigh Cannibalization Fix

**Hypothesis:** Radically differentiating `/for/huberman` (multi-protocol hub) from `/breathe/physiological-sigh` (single-technique deep-dive) will eliminate keyword cannibalization, increase CTR on both pages, and capture multi-technique Huberman queries the current page misses.

**Baseline (Jan 6-27, 2026):**
| Page | Impressions | Clicks | CTR | Avg Position |
|------|-------------|--------|-----|--------------|
| /for/huberman | 3,722 | 0 | 0% | 8.9 |
| /breathe/physiological-sigh | 2,977 | 3 | 0.1% | 10.1 |

**Problem:** Both pages target "physiological sigh" + Huberman — same technique, same video, overlapping keywords. The Huberman page's impressions are largely bot/academic queries, not real user demand.

**Changes Made:**
1. `/for/huberman` → Rewritten as multi-protocol hub covering 6 techniques (physiological sigh, box, coherent, cyclic hyperventilation, 4-7-8, nasal breathing). New title: "Huberman Breathing Protocols: 6 Techniques for Stress, Sleep & Focus (Free Timers)". Added 8 multi-protocol FAQs, voiceSearch, expanded keywords to ~19 Huberman-branded multi-technique terms.
2. `/breathe/physiological-sigh` → Reduced Huberman branding: removed "Huberman physiological sigh" and "Huberman Lab breathing" from keywords, removed "Huberman sigh" from synonyms, rewrote ogDescription to focus on Stanford, changed FAQ[0] from "Huberman physiological sigh" to "Stanford study" framing, replaced Huberman mentions in body with Stanford research attribution.

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-05

**Result:** ⚪ **Inconclusive** - Cannibalization signal remains noisy. `/for/huberman` stayed essentially flat at 55 impressions, 0 clicks, position 8.1. `/breathe/physiological-sigh` improved from position 13.9 to 11.5 and impressions from 634 to 951, but clicks fell from 1 to 0. Query mix still contains research-style and low-intent physiological-sigh queries.

**Status:** Inconclusive

---

### 2026-02-06: Disavow Spam Backlinks + Fix /app/ Route

**Hypothesis:** Disavowing ~27 spam/scraper domains prevents any future negative SEO signal. Redirecting /app/ → /breathing-app captures referral traffic from ~10 backlinks (including runtothefinish.com DR 59).

**Baseline:**
- /app/ returns 404 (10 backlinks pointing to dead URL)
- ~27 spam domains in backlink profile (most nofollow, preventive hygiene)

**Changes Made:**
1. **Redirect:** Added permanent 301 redirect `/app/:path*` → `/breathing-app` in `next.config.js`
2. **Disavow file:** Created `docs/disavow.txt` with 27 domains in Google format:
   - 8 SEO spam / link farms (rankyour.website, primeseo.xyz, etc.)
   - 5 Chinese spam cluster (appeared Jan 2026)
   - 14 SEO tool / scraper sites (site-stats.org, aapks.com, etc.)
3. **Manual step required:** Upload `docs/disavow.txt` to [GSC Disavow Tool](https://search.google.com/search-console/disavow-links)

**Notable backlinks to /app/:**
- runtothefinish.com (DR 59, nofollow) — editorial link, anchor: "like this App"
- site-stats.org (DR 51, nofollow)
- yogavideo.us (DR 0, dofollow)

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-05

**Result:** ⚪ **Inconclusive** - The redirect is working as intended, but the disavow portion is not measurable from current GSC data. URL inspection shows `/app` as a "Page with redirect" with canonical `https://deepbreathingexercises.com/breathing-app`, and `/breathing-app` is submitted and indexed.

**Status:** Inconclusive

---

### 2026-02-06: Breathing Visualizer Landing Page (NEW)

**Hypothesis:** A dedicated `/breathing-visualizer` page targeting "breathing visualizer online" (beatable competition: xhalr.com, therapistaid.com, calm.com) will rank top 10 within 1 week, given the site's existing authority and proven pattern of new low-difficulty pages hitting top 10 quickly.

**Keyword Data:**
- "breathing visualizer online" — low competition, none of the top results combine education + interactive tool
- Secondary: "breathing visualizer", "online breathing visualizer", "free breathing visualizer"

**Cannibalization Prevention:**
- Homepage title uses "breathing visualizer" as a descriptor (brand entry point)
- New page leads with tool identity + differentiating features (tool-seeking intent)
- Different intent = different content angle

**Implementation:**
- Created `/breathing-visualizer` standalone landing page
- Full-screen Resonance hero with Box breathing default
- Voice search answer block: "What is a breathing visualizer?"
- 2×3 benefit grid (visual pacing, 10 techniques, adjustable speed, no download, any device, audio/haptic)
- 10-technique grid linking to all `/breathe/[slug]` pages
- 3-step HowTo section (Choose → Follow → Adjust)
- 6 FAQs targeting long-tail "breathing visualizer" queries
- Cross-links to `/box-breathing-app`, `/4-7-8-breathing-timer`, `/coherent-breathing-app`, `/breathing-app`
- JSON-LD: BreadcrumbList, SoftwareApplication, FAQPage, HowTo
- Added to sitemap (priority 0.9, weekly)
- Cross-linked from homepage footer (Info column) and `/breathing-app` page

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-13 (Feb 20 – Mar 12 data)
- "breathing visualizer" — 9 impressions, 0 clicks, pos 10.2
- "breathing simulator online" — 1 impression, pos 10
- Very few impressions overall (11 total across 3 queries)
- Right on the edge of top 10 for target keyword but not breaking through

**Status:** Inconclusive ⚠️ — Position ~10 for target query but minimal impressions. Needs more time or link support.

---

### 2026-02-06: Tummo Breathing Page (NEW)

**Hypothesis:** A dedicated `/breathe/tummo` page targeting "tummo breathing" (500 vol, KD 5) will rank top 10 within 1-2 weeks. Tummo is a distinct technique from Wim Hof with low competition — most ranking pages are blog posts without interactive tools.

**Keyword Data:**
- "tummo breathing" — 500 volume, KD 5
- Secondary: "tummo meditation", "inner fire breathing", "g-tummo", "tummo vs wim hof"

**Cannibalization Prevention:**
- /breathe/wim-hof targets "wim hof breathing" (different keyword cluster)
- Tummo page explicitly differentiates from Wim Hof in body content and FAQ
- Different breathing pattern (2-0-1-0 vs 1.5-0-1.5-0)

**Implementation:**
- Created `/breathe/tummo` pattern page with Tummo mode (2-0-1-0, deep red #dc2626)
- Added ModeName.Tummo to engine + component types and patterns
- Full content: g-tummo history, Benson/Kozhevnikov research, tummo vs Wim Hof differentiation
- Hidden from mode picker (like Wim Hof — advanced technique, only visible on its own page)
- Strong safety disclaimer for advanced technique

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-13 (Feb 20 – Mar 12 data)
- "tummo breathing" — 49 imp, 1 click, pos 27.7 (target was top 10)
- "tummo meditation" — 18 imp, 0 clicks, pos 33.8
- 25 query variants indexed, 127 total impressions
- Best positions: "tomo breathing" pos 4, "tibetan vase breathing tummo" pos 6, "tibetan monks drying wet sheets tummo" pos 8
- Main keyword stuck at pos ~28, not near top 10 yet

**Status:** Inconclusive ⚠️ — Indexed broadly across long-tails but main keyword at pos 28. May need backlinks or content strengthening to break top 10.

---

### 2026-02-06: Breath of Fire Page (NEW)

**Hypothesis:** A dedicated `/breathe/breath-of-fire` page targeting "breath of fire" (200 vol, KD 4) will rank top 10 within 1-2 weeks. Yoga practitioners actively search for this — competition is mostly static blog content without interactive tools.

**Keyword Data:**
- "breath of fire" — 200 volume, KD 4
- Secondary: "kapalabhati breathing", "kundalini breathing", "breath of fire technique", "yoga breath of fire"

**Cannibalization Prevention:**
- No existing pages target Kapalabhati/Kundalini breathing keywords
- Distinct from Wim Hof (different tradition, different pattern) and tummo (different speed/intensity)

**Implementation:**
- Created `/breathe/breath-of-fire` pattern page with BreathOfFire mode (0.75-0-0.75-0, hot orange #ea580c)
- Added ModeName.BreathOfFire to engine + component types and patterns
- Full content: Kapalabhati/Kundalini tradition, rapid rhythmic technique, yoga physiology research
- Hidden from mode picker (rapid technique, only visible on its own page)
- Strong safety disclaimer (pregnancy, high BP, seizure disorders)

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-13 (Feb 20 – Mar 12 data)
- "breath of fire yoga" — 13 imp, 0 clicks, pos 39.5
- "fire breathing yoga" — 7 imp, 0 clicks, pos 37.3
- "breath of fire kundalini" — 5 imp, 0 clicks, pos 18.8
- 25 query variants, 96 total impressions, 0 clicks
- One bright spot: "breath of fire contraindications" pos 1 (2 imp) — but niche
- Core keywords all at pos 35-83, nowhere near top 10

**Status:** Failed ❌ — Despite KD 4, positions 35-83 for core queries. Competition is stronger than KD suggested. Would need significant backlinks to move.

---

### 2026-02-06: Breathing Exercises for Singing Page (NEW)

**Hypothesis:** A dedicated `/for/singing` page targeting "breathing exercises for singing" (550 vol, KD 1-2) will rank top 10 within 1 week. Extremely low KD with clear informational intent — singers searching for practical breathing exercises.

**Keyword Data:**
- "breathing exercises for singing" — 550 volume, KD 1-2
- Secondary: "breath support for singers", "diaphragmatic breathing singing", "vocal breathing technique", "singing breath control"

**Cannibalization Prevention:**
- No existing pages target singing-related keywords
- Uses Belly Breathing mode (same as /for/athletes uses its own mode) — different audience, different angle

**Implementation:**
- Created `/for/singing` use-case page with Belly Breathing mode
- Content angle: diaphragmatic breath support for vocal technique (appoggio)
- Science sections on subglottic pressure, vocal fold function, parasympathetic activation
- Cross-linked: public-speaking, athletes, focus use cases + belly breathing technique page
- Disclaimer directing to speech-language pathologist for voice disorders

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-13 (Feb 20 – Mar 12 data)
- "breathwork for singers" — 2 imp, pos 77
- "diaphragmatic breathing singing exercises" — 4 imp, pos 25.5
- "diaphragmatic breathing exercises for singing" — 1 imp, pos 26
- 5 query variants only, 11 total impressions, 0 clicks
- All positions 26-85 — not competitive despite KD 1-2

**Status:** Failed ❌ — Barely indexed, minimal impressions. KD 1-2 did not translate to easy ranking. Competition from established vocal coaching sites is much stronger than Ahrefs KD indicated.

---

### 2026-02-06: Lung Capacity Exercises Page (NEW)

**Hypothesis:** A dedicated `/for/lung-capacity` page targeting "lung capacity exercises" (2,800 vol, KD 5) will rank top 10 within 1-2 weeks. Highest volume opportunity in this batch — competition is mostly generic health articles without interactive tools.

**Keyword Data:**
- "lung capacity exercises" — 2,800 volume, KD 5
- Secondary: "increase lung capacity", "breathing exercises for lung capacity", "lung expansion exercises", "how to increase lung capacity"

**Cannibalization Prevention:**
- No existing pages target lung capacity keywords
- /breathe/pursed-lip targets "pursed lip breathing" (different cluster) — lung capacity page references pursed-lip as complementary
- /for/athletes targets athletic performance, not respiratory health

**Implementation:**
- Created `/for/lung-capacity` use-case page with Belly Breathing mode
- Content angle: rebuilding functional lung capacity through diaphragmatic strengthening
- Science sections on tidal volume, inspiratory muscle training, gas exchange, residual volume
- Progressive program: assess baseline → belly breathing → progressive loading → pursed-lip → walking
- Cross-linked: athletes, running, singing use cases + belly breathing technique page
- Medical disclaimer for respiratory conditions

**Measure After:** 2026-02-20 (2 weeks)

**Measured:** 2026-03-13 (Feb 20 – Mar 12 data)
- "lung capacity exercises" — 3 imp, 0 clicks, pos 68
- "breathing exercises to improve lung capacity" — 4 imp, pos 67.8
- "breathing exercises to increase lung capacity" — 3 imp, pos 73.7
- 13 query variants, 24 total impressions, 0 clicks
- All positions 34-89 — not remotely competitive despite KD 5
- Highest volume target (2,800) but DR 0.2 site can't compete with health authority sites

**Status:** Failed ❌ — Positions 34-89 across all queries. High-volume keywords require domain authority we don't have yet.

---

### 2026-02-17: GSC Checkpoint (Last 28d vs Previous 28d)

**Date range:** 2026-01-20 → 2026-02-16 vs 2025-12-23 → 2026-01-19

**Page metrics (imp / clicks / CTR / avg pos):**

| Page | Last 28d | Prev 28d |
|------|----------|----------|
| /breathe/box | 311 / 2 / 0.64% / 22.38 | 925 / 0 / 0.00% / 11.97 |
| /breathe/physiological-sigh | 1719 / 1 / 0.06% / 13.24 | 3003 / 3 / 0.10% / 10.75 |
| /4-7-8-breathing-timer | 336 / 11 / 3.27% / 13.07 | 467 / 12 / 2.57% / 9.02 |
| /box-breathing-app | 88 / 0 / 0.00% / 12.69 | 119 / 3 / 2.52% / 10.45 |
| /2-minute-breathing-exercise | 57 / 0 / 0.00% / 10.35 | 78 / 0 / 0.00% / 8.91 |
| /for/running | 218 / 0 / 0.00% / 10.12 | 269 / 0 / 0.00% / 7.36 |
| /breathe/pursed-lip | 330 / 0 / 0.00% / 67.87 | no data | 
| /breathe/ujjayi | 206 / 0 / 0.00% / 40.84 | no data |
| /breathe/belly | 19 / 0 / 0.00% / 34.53 | no data |
| /breathe/nadi-shodhana | 42 / 2 / 4.76% / 10.14 | no data |
| /for/pranayama | 19 / 0 / 0.00% / 12.79 | no data |
| /for/stress | 48 / 0 / 0.00% / 8.52 | no data |
| /coherent-breathing-app | 448 / 4 / 0.89% / 8.26 | 405 / 3 / 0.74% / 7.62 |

**Top-10 crossings:**
- Dropped out of top 10: /4-7-8-breathing-timer (9.02 → 13.07), /box-breathing-app (10.45 → 12.69), /2-minute-breathing-exercise (8.91 → 10.35), /for/running (7.36 → 10.12)
- Now in top 10 with new data: /for/stress (8.52)

**CTR movers (>0.3pp):**
- /breathe/box: +0.64pp (0.00% → 0.64%)
- /4-7-8-breathing-timer: +0.70pp (2.57% → 3.27%)
- /box-breathing-app: -2.52pp (2.52% → 0.00%)

**Query highlights (near-top-10 pages):**
- /coherent-breathing-app: "coherence breathwork app" (1 click, 1 imp, pos 11), "coherent breathing app" (1/24, pos 10.17), "coherent breathing app free" (1/14, pos 6.21)
- /2-minute-breathing-exercise: "2 minute breathing exercise" (0/1, pos 29)
- /for/running: "physiological sigh lower heart rate running" (0/14, pos 6.29)
- /box-breathing-app: "box breathing app" (0/1, pos 41), "box breathing online" (0/3, pos 29.33), "box breathing timer" (0/1, pos 49), "box breathing timer app" (0/1, pos 6), "breathing timer online" (0/1, pos 93)
- /for/stress, /breathe/nadi-shodhana: no query rows in period

**Index status:** /breathe/buteyko is submitted and indexed (last crawl 2026-02-06).

---

### 2026-02-17: Checkpoint Follow-Up (Internal Links + Metadata Alignment)

**Hypothesis:** Reinforcing internal links to pages that slipped and tightening title/description intent should help recover impressions and top-10 positions.

**Pages targeted from checkpoint:** `/4-7-8-breathing-timer`, `/box-breathing-app`, `/2-minute-breathing-exercise`, `/for/running`

**Changes Made:**
- Updated metadata on `/4-7-8-breathing-timer` to prioritize exact "4-7-8 breathing timer" intent (title/description/OG/Twitter) and adjusted H1 to match.
- Updated metadata on `/box-breathing-app` to prioritize exact "box breathing app / 4-4-4-4 timer" intent (title/description/OG/Twitter) and adjusted H1 to match.
- Updated `/for/running` metadata copy in `use-case-pages.ts` to include explicit "breathing for running recovery" intent language.
- Added contextual links to lagging pages from higher-visibility pages:
  - `/coherent-breathing-app` "More breathing tools" now links to `/2-minute-breathing-exercise` and `/for/running`.
  - `/4-7-8-breathing-timer` now links to `/for/running` in use-case cards and `/2-minute-breathing-exercise` in "More breathing apps".
  - `/box-breathing-app` "More breathing timers" now links to `/2-minute-breathing-exercise` and `/for/running`.
  - `/2-minute-breathing-exercise` "More options" now links to `/4-7-8-breathing-timer`, `/box-breathing-app`, and `/for/running`.
  - Homepage timer list now includes `/box-breathing-app`.

**Measure After:** 2026-03-03 (2 weeks)

**Measured:** 2026-03-13 (Mar 3 – Mar 12 data vs Jan 20 – Feb 16 baseline)

| Page | Before (imp/clicks/pos) | After (imp/clicks/pos) | Change |
|------|------------------------|------------------------|--------|
| `/4-7-8-breathing-timer` | 336 / 11 / 13.1 | 126 / 7 / 9.0 | ✅ Recovered to top 10, CTR up (3.3% → 5.6%) |
| `/box-breathing-app` | 88 / 0 / 12.7 | 29 / 1 / 12.7 | ⚠️ Got a click but position unchanged |
| `/2-minute-breathing-exercise` | 57 / 0 / 10.4 | 1 / 0 / 10 | ❌ Impressions collapsed |
| `/for/running` | 218 / 0 / 10.1 | 0 / 0 / — | ❌ Dropped out entirely |

**Status:** Mixed — `/4-7-8-breathing-timer` recovered well (Success ✅). Other three pages did not improve (Failed ❌). Internal links alone aren't enough without backlinks for lower-authority pages.

---

## Completed Experiments

## Recent Follow-Up Log

| Experiment | Launched | Follow-up due | Measured | Outcome |
|------------|----------|---------------|----------|---------|
| Checkpoint Follow-Up (Internal Links + Metadata Alignment) | 2026-02-17 | 2026-03-03 | 2026-03-05 | Success ✅ |
| Huberman / Physiological Sigh Cannibalization Fix | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |
| Disavow Spam Backlinks + Fix /app/ Route | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |
| Breathing Visualizer Landing Page (NEW) | 2026-02-06 | 2026-02-20 | 2026-03-05 | Success ✅ |
| Tummo Breathing Page (NEW) | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |
| Breath of Fire Page (NEW) | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |
| Breathing Exercises for Singing Page (NEW) | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |
| Lung Capacity Exercises Page (NEW) | 2026-02-06 | 2026-02-20 | 2026-03-05 | Inconclusive |

(Move experiments here after measuring results)

---

## Failed/Abandoned Ideas

(Document what didn't work to avoid re-testing)
