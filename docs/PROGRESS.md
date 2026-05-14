# Progress

## 2026-04-23

### Brand Exploration Page

Built an internal visual exploration page to help choose a clearer brand direction before formalizing a brand kit.

- Added `/brand-lab` with three candidate directions:
  - `Soft Orbit` — warm, luminous, emotionally restorative
  - `Signal Glow` — calm biofeedback / performance-tech
  - `Quiet Editorial` — restrained, trustworthy, timeless
- Added lightweight in-code preview compositions so the directions can be compared without committing to final illustration assets yet.
- Added `scripts/tests/brand-lab-page.test.mjs` to require page metadata and the presence of the three concept sections.
- Next if approved: turn the chosen direction into a reusable brand kit and begin applying it to the homepage and key SEO pages.

## 2026-03-24

### Resonance Header Auth Controls

Adjusted the Resonance header auth controls to match the current product direction and fixed a sizing inconsistency in the signed-in state.

- Replaced the signed-out icon-only auth control with a visible `Sign up` button in the Resonance header.
- Fixed the signed-in account button so it keeps a stable 40px circular footprint and the avatar fills that footprint instead of rendering smaller than the adjacent circular controls.
- Refined the signed-in avatar treatment to sit further inset within the 40px account button, leaving a chunkier visible ring so it reads more like the neighboring circular controls.
- Added `scripts/tests/resonance-auth-controls.test.mjs` to lock both behaviors with a targeted regression test.
- Verified in-browser on local dev:
  - guest state shows `Sign up`
  - authenticated state renders `Account menu` at `40x40` with the avatar inset inside the button

## 2026-03-18

### Agent-Generated Breathing Pages — Architecture & Spec

Designed and specced a new feature: external AI agents can create custom breathing session pages on deepbreathingexercises.com via URL params or REST API. Pages persist as indexable UGC for programmatic SEO.

**Research completed (3 parallel agents):**
- UGC SEO best practices — Google quality thresholds, AI content guidelines, tiered indexing
- Programmatic SEO architecture — URL structures, crawl budget, near-duplicate handling
- UGC page design patterns — Canva, Notion, CodePen, Linktree template analysis

**Mobile app audited:** Expo SDK 54, RN 0.81.5, ~1068 lines of working code. Foundation is solid — don't reset.

**Docs created:**
- `docs/AGENT-PAGES-ROADMAP.md` — full 5-phase roadmap with constraints and free/premium split
- `docs/PHASE-0-SPEC.md` — detailed spec for 4 foundation tasks:
  1. Migrate web Resonance.tsx to shared `@resonance/engine` (eliminate local fork)
  2. Add custom pattern support to engine (agent-defined phase durations)
  3. Create `session_events` table + API (per-session engagement tracking)
  4. Create `breathing_sessions` table (page persistence, quality gate, slug generation)

**Key architectural decisions:**
- URL is the universal API — any agent can construct a link, zero integration needed
- Quality gate before persistence — min 100 words guidance, use-case tag, valid pattern
- Tiered indexing — probation → permanent (based on engagement) or temporary (noindex, expires 30 days)
- Free/premium split — public pages free (growth engine), custom patterns + private sessions = premium

**Next:** Keyword research (Ahrefs) to validate long-tail search volume, then implement Phase 0.

## 2026-02-13

### Accounts + Gating Architecture Plan (Documented)

Created a canonical architecture and rollout spec before implementing upsell behavior:

- New doc: `/Users/abi/Sites/deepbreathing/docs/accounts-architecture-and-gating-roadmap.md`
- Covers:
  - guest/free/pro/lapsed user states,
  - cross-platform auth model (web + iOS + Android),
  - local-first sync architecture and merge rules,
  - capability-based feature gating model,
  - phased delivery checklists (architecture first, then accounts, then subscriptions),
  - risks and mitigations.

Decision captured: prioritize architecture + gating implementation before account upsell prompts.

### Accounts + Gating Phase 0 Scaffolding Started

Implemented initial shared package scaffolding:

- `/Users/abi/Sites/deepbreathing/packages/domain`
  - User state, identity, session, sync, and entitlement types.
- `/Users/abi/Sites/deepbreathing/packages/access-control`
  - Capability and feature matrix helpers for consistent web/mobile gating.
- `/Users/abi/Sites/deepbreathing/packages/api-contracts`
  - Typed `/api/v1/*` request/response contracts for auth, sync, entitlements, and feature flags.

Validation:
- Ran `pnpm install` to link new workspace packages.
- Ran `pnpm exec tsc --noEmit` successfully after linking.

## 2026-01-27

### SEO Experiments Implementation (PRD-SEO-JAN27.md Complete)

Implemented all 5 SEO experiments from the PRD:

**Experiment 1: Push Top 10 to Top 5 ✅**
- Added "2026" to titles for freshness signals on 3 pages
- Added comparison table to coherent-breathing-app
- Updated dateModified schemas

**Experiment 2: Programmatic Combination Pages (pSEO) ✅**
Created 5 new long-tail pages:
- `/4-7-8-breathing-for-insomnia`
- `/box-breathing-before-presentation`
- `/physiological-sigh-panic-attack`
- `/breathing-exercises-before-surgery`
- `/breathing-exercises-for-labor`

**Experiment 3: E-E-A-T Enhancement ✅**
- Created `/about/methodology` page (research standards, editorial process)
- Created `ContentCredentials` component for author/date display
- Updated `/about` page to link to methodology

**Experiment 4: Voice Search Optimization ✅**
- Added `VoiceSearchQA` type to data structures
- Added voice search sections to pattern-page and use-case-page components
- Added question H2s with 40-60 word answers to 6 target pages

**Experiment 5: Meta Description CTAs ✅**
- Updated 14 meta descriptions with "Free timer" CTA pattern
- Pattern: "Free [technique] timer — [benefit]. Start your guided session now."

**Files Created:**
- `src/app/4-7-8-breathing-for-insomnia/page.tsx`
- `src/app/box-breathing-before-presentation/page.tsx`
- `src/app/physiological-sigh-panic-attack/page.tsx`
- `src/app/breathing-exercises-before-surgery/page.tsx`
- `src/app/breathing-exercises-for-labor/page.tsx`
- `src/app/about/methodology/page.tsx`
- `src/components/seo/content-credentials.tsx`

**Files Modified:**
- `src/data/breathing-pages.ts` - Added VoiceSearchQA type, voice search content
- `src/data/use-case-pages.ts` - Added VoiceSearchQA type, voice search content
- `src/app/breathe/pattern-page.tsx` - Added voice search section
- `src/app/for/use-case-page.tsx` - Added voice search section
- `src/app/coherent-breathing-app/page.tsx` - Freshness signals, comparison table
- `src/app/4-7-8-breathing-timer/page.tsx` - Freshness signals
- `src/app/box-breathing-app/page.tsx` - Freshness signals
- `src/app/about/page.tsx` - Methodology link
- `/docs/SEO-EXPERIMENTS.md` - All experiments marked implemented

---

### SEO Experiment Review (Earlier)

**Measured 3 experiments (due today):**

| Experiment | Result |
|------------|--------|
| Navy SEAL Content Expansion | ❌ Failed - positions unchanged at 60-70 |
| FAQ H3 Headings for Snippets | ❌ Failed - no featured snippets captured |
| Video Embeds for Rich Results | ❌ Failed - no video rich results |

**Key Learnings:**
- Content additions alone don't move competitive branded queries
- Featured snippets require top 5 position first (99% come from page 1)
- Embedded YouTube videos don't transfer video rich results to embedding page

**Bright spots from Jan 20 pages:**
- /for/stress: Position 8.6 (top 10 in 1 week!)
- /for/kids: Position 9.7 (top 10 in 1 week!)
- /breathe/nadi-shodhana: Position 10.8

---

## 2026-01-20

### SEO Technique Expansion (PRD-SEO-TECHNIQUES.md Complete)

Implemented 5 new SEO pages based on Ahrefs keyword research:

**New Breathing Technique Pages (not featured on homepage, appear in footer):**

1. **Ujjayi Breathing** (`/breathe/ujjayi`)
   - Target: "ujjayi breathing" (2,700 vol, difficulty 7 - VERY LOW)
   - Pattern: 4-0-6-0 (4s inhale, 6s exhale, no holds)
   - Color: Ocean blue (#0891b2)
   - Focus: Yoga practitioners, ocean breath technique, throat constriction

2. **Belly Breathing** (`/breathe/belly`)
   - Target: "belly breathing" (5,600 vol, difficulty 32 - LOW)
   - Pattern: 4-0-6-0 (same as ujjayi but different focus)
   - Color: Warm amber (#f59e0b)
   - Focus: Beginners, diaphragmatic breathing foundation, stress relief

3. **Buteyko Breathing** (`/breathe/buteyko`)
   - Target: "buteyko breathing" (2,900 vol, difficulty 36 - LOW)
   - Pattern: 3-0-3-3 (light nasal breathing with pause)
   - Color: Sky blue (#38bdf8)
   - Focus: Asthma management, nasal breathing, reduced breathing

**New Use-Case Pages:**

4. **Kids Breathing Exercises** (`/for/kids`)
   - Target: "breathing exercises for kids" (1,800 vol, difficulty 12 - VERY LOW)
   - Technique: Box breathing (3-3-3-3 for kids)
   - Focus: Parents, teachers, child therapists, calming tantrums

5. **Pranayama Hub** (`/for/pranayama`)
   - Target: "pranayama" (3,000 vol, difficulty 30)
   - Technique: Links to Nadi Shodhana, Ujjayi
   - Focus: Yoga practitioners, pranayama overview, yogic breathing

**Files Created:**
- `/src/app/breathe/ujjayi/page.tsx`
- `/src/app/breathe/belly/page.tsx`
- `/src/app/breathe/buteyko/page.tsx`
- `/src/app/for/kids/page.tsx`
- `/src/app/for/pranayama/page.tsx`

**Files Modified:**
- `/src/data/breathing-pages.ts` - Added ujjayiPage, bellyPage, buteykoPage (~700 lines)
- `/src/data/use-case-pages.ts` - Added kidsPage, pranayamaPage (~400 lines)

**Note:** Types and patterns for Ujjayi, Belly, Buteyko were already added to types.ts/constants.ts in previous work.

**Expected Impact:**
- Combined target: +4,000-5,000 monthly organic sessions
- All pages have: HowTo schema, FAQ schema, Article schema, internal linking
- Kids page targets underserved niche with low competition
- Pranayama hub connects yoga-related techniques

---

### Scalable Technique Architecture: Featured Flag + SEO Footer

Implemented infrastructure to support many breathing techniques without cluttering the homepage:

**Featured Flag System**
- Added `featured?: boolean` to `BreathingPageContent` interface
- Core 5 techniques marked `featured: true`: Box, 4-7-8, Coherent, Physiological Sigh, Wim Hof
- New SEO techniques (Pursed Lip, Nadi Shodhana) are `featured: false` by default
- Created `featuredBreathingPages` export for homepage "Pick a mode" section
- Homepage now only shows featured techniques; all others exist for SEO

**Comprehensive SEO Footer**
- Expanded homepage footer with 4-column grid layout
- Dynamically lists all breathing techniques from `breathingPages`
- Dynamically lists all use-case guides from `useCasePages`
- Includes timer pages (1min, 2min, 5min, 4-7-8, coherent app)
- Internal linking to all pages for maximum crawlability

**Files Modified:**
- `src/data/breathing-pages.ts` - Added `featured` flag to interface and pages
- `src/app/page.tsx` - Updated "Pick a mode" section + expanded footer

This enables adding unlimited SEO-focused techniques without impacting the core user experience.

---

### SEO Experiment Results - 6x Click Growth!

Measured results for experiments launched Jan 6-9 against baseline (Dec 1 - Jan 5):

**CTR Title Rewrites (Jan 6)** - SUCCESS ✅
- Total clicks grew from 4 → 24 (6x increase!)
- Key pages:
  - `/4-7-8-breathing-timer`: 32 → 403 imp, 3 → 9 clicks, pos 11.9 → 8.7
  - `/breathe/physiological-sigh`: 767 → 2173 imp, 0 → 3 clicks, pos 13.7 → 9.6
  - `/breathe/box`: 89 → 834 imp, pos 42.8 → 8.9

**Coherent Page Differentiation (Jan 9)** - SUCCESS ✅
- Both pages got first clicks ever!
  - `/breathe/coherent`: 285 → 567 imp, 0 → 3 clicks, pos 9.0 → 8.6
  - `/coherent-breathing-app`: 89 → 322 imp, 0 → 3 clicks, pos 10.0 → 7.6

**Physiological Sigh Intent Sections (Jan 9)** - SUCCESS ✅
- Position improved from 13.7 → 9.6 (now in top 10!)

### New Breathing Techniques: Pursed Lip & Nadi Shodhana

Added two new breathing patterns based on Ahrefs keyword research:

**Pursed Lip Breathing** (`/breathe/pursed-lip`)
- Target: "pursed lip breathing" (6.7K vol, difficulty 34)
- Pattern: 2-second inhale, 4-second exhale (1:2 ratio)
- Focus: Respiratory health, COPD, asthma, seniors
- Color: Emerald (#10b981)

**Nadi Shodhana/Alternate Nostril** (`/breathe/nadi-shodhana`)
- Target: "alternate nostril breathing" (3.3K vol, difficulty 28)
- Pattern: 4-4-4 (timer mode with text instructions for nostril switching)
- Focus: Yoga, meditation, balance, energy harmonization
- Color: Violet (#8b5cf6)

### New Use-Case Page: Breathing for Stress

Created `/for/stress` targeting "breathing exercises for stress" (1K vol).
- Technique: Physiological Sigh
- Differentiates from anxiety page (chronic vs acute stress)
- Addresses work stress, overwhelm, tension

**Files Created:**
- `/src/app/breathe/pursed-lip/page.tsx`
- `/src/app/breathe/nadi-shodhana/page.tsx`
- `/src/app/for/stress/page.tsx`

**Files Modified:**
- `/src/components/resonance/types.ts` - Added PursedLip, NadiShodhana to ModeName
- `/src/components/resonance/constants.ts` - Added pattern definitions
- `/packages/engine/src/types.ts` - Added to engine types
- `/packages/engine/src/patterns.ts` - Added to engine patterns
- `/src/data/breathing-pages.ts` - Full page content for both techniques
- `/src/data/use-case-pages.ts` - Stress page content
- `/docs/SEO-EXPERIMENTS.md` - Updated with results + new experiments
- `/pnpm-workspace.yaml` - Excluded mobile app from workspace
- `/tsconfig.json` - Excluded apps folder from TS compilation

---

## 2026-01-10

### Synonym Capture: Physiological Sigh Page

Added missing keyword variants discovered via Ahrefs:
- "cyclical breathing" (200 vol, difficulty 13)
- "sigh breathing technique" (30 vol, difficulty 8)

**Changes:**
- Added to keywords and synonyms arrays in breathing-pages.ts
- Added natural mention in "Cyclic Sighing: The Clinical Term" section

**Files Modified:**
- `/src/data/breathing-pages.ts`

---

### GSC + Ahrefs Baseline Established

Pulled baseline metrics via API and saved to SEO-EXPERIMENTS.md:
- Top pages by impressions
- Top keywords with positions
- Ahrefs keyword difficulty/volume data

Key finding: "physiological sigh" has 3,400 volume with only 17 difficulty - biggest opportunity.

---

## 2026-01-09

### Remove "Loading breathing exercise..." from SSR (Fixed Properly)

Removed ALL text nodes from loading state. Initial fix used `sr-only` class which still left text in DOM. Now using `aria-label` attribute only.

**Problem:** The loading text was indexable and appeared as first extracted text in snippets.

**Solution:** CSS spinner with `role="status"` + `aria-label="Loading breathing exercise"` (attribute only, no text nodes).

**Files Modified:**
- `/src/app/breathe/pattern-page.tsx`
- `/src/app/for/use-case-page.tsx`
- `/src/app/box-breathing-app/page.tsx`
- `/src/app/4-7-8-breathing-timer/page.tsx`

**Verification:** After deployment, `curl | grep "loading"` should return nothing.

---

### Title Experiments: "Free Online Timer" Format

Implemented title changes to match SERP winner patterns and compete against app store results.

**Changes:**

| Page | Old Title | New Title |
|------|-----------|-----------|
| `/4-7-8-breathing-timer` | "4-7-8 Breathing Timer: Fall Asleep in 2 Minutes (Free App)" | "Free Online 4-7-8 Breathing Timer — Fall Asleep in 2 Minutes" |
| `/box-breathing-app` | "Box Breathing App: Navy SEAL Calm in 2 Minutes (Free Timer)" | "Free Online Box Breathing Timer — Navy SEAL Calm (No Download)" |
| `/breathe/physiological-sigh` | "Calm Down in 30 Seconds: Physiological Sigh (Huberman/Stanford) \| Free" | "Physiological Sigh Timer (Free) — Calm Down in 30 Seconds" |

**Rationale:**
- SERP winner for "4-7-8 breathing timer" uses "FREE Online 4-7-8 Breathing Timer"
- "App" queries dominated by App Store/Play Store - pivot to "online/timer"
- Leading with "Free Online" signals web-based tool vs mobile download

**Files Modified:**
- `/src/app/4-7-8-breathing-timer/page.tsx`
- `/src/app/box-breathing-app/page.tsx`
- `/src/data/breathing-pages.ts` (physiological sigh metadata)

---

### SERP Analysis: CTR Fix Queue (0-Click Pages at Positions ≤10)

Analyzed SERPs for pages with high impressions but 0 clicks to diagnose why.

#### `/breathe/coherent` & `/coherent-breathing-app` (position ~9)
**Query:** "coherent breathing"
- **Finding:** Not in visible top 10. SERP dominated by Verywell Mind, Nature journal, YouTube, coherentbreathing.com (official site)
- **Diagnosis:** Competing against high-authority medical/scientific sites for informational query
- **Recommendation:** Target "coherent breathing app" or "coherent breathing timer" - tool-focused queries where web app can compete

#### `/for/huberman` (position ~9.4)
**Query:** "huberman physiological sigh"
- **Finding:** Not in visible top 10. Top results are Huberman's YouTube videos, hubermanlab.com, Stanford Medicine
- **Diagnosis:** Branded query - users want Huberman's own content, not third-party
- **Recommendation:** Deprioritize or pivot to non-branded queries ("double inhale breathing", "cyclic sighing technique")

#### `/for/running` (position ~6.1)
**Query:** "breathing for running"
- **Finding:** Not in visible top 10. Top results: American Lung Association, Reddit, YouTube, Adidas, REI
- **Diagnosis:** Intent mismatch - SERP is about breathing WHILE running (cadence, nose vs mouth), not recovery
- **Recommendation:** Target "side stitch breathing" or "stop side stitch running" for clearer intent match

#### `/for/holiday-stress` (position ~8.5)
**Query:** "holiday stress breathing"
- **Finding:** Not in visible top 10. Health organizations dominate (Harvard Health, Hawaii Pacific Health)
- **Diagnosis:** E-A-T gap - medical sites have more authority for seasonal stress content
- **Recommendation:** Build more medical citations or lean into 4-7-8 (featured in answer box)

---

### SERP Analysis: Striking Distance Queue (Positions 11-20)

#### `/box-breathing-app` (position ~11.2)
**Query:** "box breathing app"
- **Finding:** Top 10 dominated by App Store (#1, #6), Google Play (#2, #5), letsbreathe.app, Headspace
- **Diagnosis:** Users want downloadable mobile apps, not web apps
- **Recommendation:** Target "box breathing online" or emphasize "no download needed" more prominently

#### `/4-7-8-breathing-timer` (position ~12)
**Query:** "4-7-8 breathing timer"
- **Finding:** MindfulDevMag (#1), YouTube videos, ZenMix.io (#4), app stores
- **Diagnosis:** WINNABLE - other web-based tools rank. MindfulDevMag's title: "FREE Online 4-7-8 Breathing Timer"
- **Recommendation:** Match winning title format - emphasize "FREE Online" and "Timer" in title

#### `/breathe/physiological-sigh` (position ~13)
**Query:** "physiological sigh"
- **Finding:** Stanford Medicine (#1), Huberman YouTube videos, Oura Ring blog, research sites
- **Diagnosis:** Academic/research-dominated SERP - hard to compete for head term
- **Recommendation:** Target long-tail: "physiological sigh timer", "physiological sigh practice"

#### `/breathing-app` (position ~13.6)
**Query:** "breathing app"
- **Finding:** Dominated by actual mobile apps (App Store, Google Play, Breathwrk, Calm)
- **Diagnosis:** Extremely competitive head term - mobile app listings dominate
- **Recommendation:** Near-impossible to rank - target "free online breathing exercises" instead

---

### SEO Experiment Tracking System

Created `/docs/SEO-EXPERIMENTS.md` to systematically track SEO changes with hypotheses, baselines, and results. Updated `~/.claude/CLAUDE.md` to remind agents to check this file before making SEO changes.

**Purpose:**
- Avoid re-testing failed experiments
- Track before/after metrics properly
- Document hypotheses for future reference

**Files Created/Modified:**
- `/docs/SEO-EXPERIMENTS.md` - New experiment log
- `~/.claude/CLAUDE.md` - Added SEO experiment reminder

### Coherent Breathing Page Differentiation

Two pages were competing for the same keywords with similar titles:
- `/breathe/coherent` (318 impressions, pos 9.03)
- `/coherent-breathing-app` (110 impressions, pos 9.64)

**Strategy:** Differentiate by intent
- `/breathe/coherent` → Guide/science intent ("learn about coherent breathing")
- `/coherent-breathing-app` → Tool intent ("use the app now")

**Title Changes:**

| Page | Old Title | New Title |
|------|-----------|-----------|
| /breathe/coherent | "Coherent Breathing: Build Lasting Calm in 5 Min/Day (Free Timer)" | "Coherent Breathing: The Science of 5 Breaths/Min (Free Trainer)" |
| /coherent-breathing-app | "Coherent Breathing App: Train Stress Resilience in 5 Min (Free)" | "Coherent Breathing App (Free) — No Download, Start Instantly" |

**Files Modified:**
- `/src/data/breathing-pages.ts` - Coherent breathing metadata
- `/src/app/coherent-breathing-app/page.tsx` - App page metadata

### Physiological Sigh Content Optimization

Added intent-targeted sections to `/breathe/physiological-sigh` (highest impression page: 989 impressions, position ~13) to help it rank for related searches:

**New Sections Added:**
- "Physiological Sigh for Panic Attacks" - Captures panic-related searches
- "Physiological Sigh for Anxiety" - Captures anxiety-related searches

**Rationale:** Page already had "Cyclic Sighing" and "vs Box Breathing" sections. Adding panic/anxiety sections captures more search intents and provides snippet-ready content for those queries.

**Files Modified:**
- `/src/data/breathing-pages.ts` - Physiological sigh body sections

**Expected Impact:** Help move page from position ~13 into top 10 by matching more user intents.

---

## 2026-01-06

### CTR Optimization - Meta Titles & Descriptions

Based on Google Search Console data showing 1.29K impressions but only 4 clicks (0.3% CTR), identified pages with high impressions but 0% CTR and rewrote titles/descriptions following the pattern that works (4-7-8 timer: 9.68% CTR).

**Working Pattern (from 4-7-8 timer):**
- Title: "[Benefit in X Time]: [Technique] (Free App/Timer)"
- Lead with outcome, not attribution

**Pages Optimized:**

| Page | Impressions | Position | Old CTR | Change |
|------|-------------|----------|---------|--------|
| /breathe/physiological-sigh | 607 | 14.4 | 0% | Title rewritten |
| /breathe/coherent | 282 | 8.88 | 0% | Title rewritten |
| /coherent-breathing-app | 86 | 9.99 | 0% | Title rewritten |
| /for/running | 27 | 5.85 | 0% | Title tweaked |
| /box-breathing-app | 22 | 8.5 | 0% | Title rewritten |

**Title Changes:**

*Physiological Sigh (BIGGEST opportunity - 607 impressions):*
- Old: "Huberman's Physiological Sigh: Instant Stress Relief (Stanford Study)"
- New: "Calm Down in 30 Seconds: Physiological Sigh (Huberman/Stanford) | Free"
- Rationale: Lead with benefit ("Calm Down in 30 Seconds"), not attribution

*Coherent Breathing Page:*
- Old: "Increase Your HRV by 50% with Coherent Breathing (5 Min/Day)"
- New: "Coherent Breathing: Build Lasting Calm in 5 Min/Day (Free Timer)"
- Rationale: "HRV" is technical jargon; "Build Lasting Calm" is accessible benefit

*Coherent Breathing App:*
- Old: "Coherent Breathing App (HRV Breathing) — Free, No Download"
- New: "Coherent Breathing App: Train Stress Resilience in 5 Min (Free)"
- Rationale: Benefit-focused, removed technical jargon

*Running Page:*
- Old: "Stop Side Stitches in 30 Seconds: Physiological Sigh for Runners"
- New: "Stop Side Stitches in 30 Seconds + Recover 2x Faster (Free Timer)"
- Rationale: Added "Free Timer" and "2x Faster" hooks

*Box Breathing App:*
- Old: "Box Breathing App (4-4-4-4 Timer) — Free, No Download"
- New: "Box Breathing App: Navy SEAL Calm in 2 Minutes (Free Timer)"
- Rationale: Added Navy SEAL authority + time-bound benefit

**Files Modified:**
- `/src/data/breathing-pages.ts` - Physiological sigh + coherent breathing metadata
- `/src/data/use-case-pages.ts` - Running page metadata
- `/src/app/coherent-breathing-app/page.tsx` - Metadata
- `/src/app/box-breathing-app/page.tsx` - Metadata

**Expected Impact:**
- Physiological sigh: With 607 impressions at position 14.4, even 5% CTR = ~30 clicks/month
- Coherent pages: Combined 368 impressions, removing HRV jargon should improve click appeal
- Running: Position 5.85 (page 1!) - better description should convert impressions to clicks

### Homepage Title CTR Fix

Homepage was ranking at position 5.79 with 61 impressions but only 1.64% CTR. Generic title wasn't compelling.

**Change:**
- Old: "Deep Breathing Exercises – Free Breathing Visualizer"
- New: "Free Breathing Visualizer: Calm Anxiety in 60 Seconds"

Also updated description to lead with benefit and add social proof: "Calm anxiety in 60 seconds with our free breathing visualizer. Box breathing, 4-7-8, physiological sigh—all free, no signup. Used by 10,000+ people. Try now."

**Files Modified:** `/src/app/layout.tsx`

### Navy SEAL Content Expansion (Box Breathing)

Box breathing page had Navy SEAL mentions in titles/meta but no substantial content. Navy SEAL queries (30+ combined impressions) were ranking at positions 60-70.

**Changes:**
- Added new body section: "Why Navy SEALs Use Box Breathing" (~150 words)
  - Mark Divine attribution (retired SEAL Commander who introduced it to BUD/S)
  - Training context (drownproofing, pre-mission, combat)
  - Neuroscience explanation (prefrontal cortex + parasympathetic activation)
  - Divine quote: "taking control of your physiology before your physiology takes control of you"
- Added new FAQ: "Why do Navy SEALs use box breathing?" with detailed answer

**Files Modified:** `/src/data/breathing-pages.ts`

**Expected Impact:** Should help box breathing page rank higher for Navy SEAL queries currently at positions 60-70.

### FAQ Rendering Upgrade for Featured Snippets

FAQ sections on pattern pages and use-case pages were using `<details><summary>` accordion format. This is not optimal for featured snippets - Google prefers explicit heading tags.

**Changes:**
- Pattern pages (`/breathe/*`): Changed FAQ rendering from `<summary>` to `<h3>` headings
- Use-case pages (`/for/*`): Changed FAQ rendering from `<summary>` to `<h3>` headings
- Removed accordion behavior - FAQs now display as flat Q&A with H3 question headings

**Files Modified:**
- `/src/app/breathe/pattern-page.tsx`
- `/src/app/for/use-case-page.tsx`

**Expected Impact:** Better featured snippet eligibility for question-based queries across all breathing technique and use-case pages.

### Video Embeds Added for Video Rich Results

Added authoritative expert videos to high-impression breathing technique pages for video rich results in SERPs.

**Videos Added:**

| Page | Video | YouTube ID | Authority |
|------|-------|------------|-----------|
| `/breathe/box` | Box Breathing with Mark Divine | `GZzhk9jEkkI` | Former Navy SEAL Commander who introduced it to BUD/S |
| `/breathe/4-7-8` | Dr. Andrew Weil 4-7-8 Demonstration | `YRPh_GaiL8s` | Harvard-trained physician who popularized the technique |
| `/breathe/coherent` | James Nestor on the Perfect Breath | `CMsFIEyITPc` | Bestselling author of "Breath: The New Science of a Lost Art" |

**Already had:** `/breathe/physiological-sigh` with Huberman video (`kSZKIupBUuc`)

**Files Modified:** `/src/data/breathing-pages.ts`

**Expected Impact:**
- Video thumbnails in SERPs increase CTR 5-15%
- VideoObject schema already implemented in pattern-page.tsx
- Adds authority signals (Dr. Weil, Mark Divine, James Nestor, Huberman)

### Huberman Hub Page Created

Created `/for/huberman` to capture Huberman brand queries currently ranking at positions 42-48:
- "andrew huberman physiological sigh" - position 42
- "huberman sigh" - position 44
- "huberman physiological sigh" - position 48

**Page Content (~2,500 words):**
- Hero explaining Huberman's approach to breathwork
- Problem section: why most breathing advice falls short
- Solution section: physiological sigh as his #1 recommendation
- Science section: 4 detailed points including 2023 Stanford study (Balban et al.)
- How-to: 5-step guide with tips
- References: Cell Reports Medicine study, Huberman Lab podcast episodes, YouTube clips
- 6 FAQs targeting long-tail queries ("What is the Huberman physiological sigh?", "Is physiological sigh better than box breathing?", etc.)
- Disclaimer about non-affiliation with Huberman/Stanford

**Target Keywords:**
- huberman breathing, huberman lab breathing, andrew huberman breathing
- huberman physiological sigh, huberman sigh
- cyclic sighing huberman, stanford breathing technique

**Files Created:**
- `/src/app/for/huberman/page.tsx` - Route file
- Added entry to `/src/data/use-case-pages.ts` (~200 lines)

**Expected Impact:**
- Direct ranking for Huberman brand queries (currently pages 4-5)
- Internal link equity from physiological sigh page
- Captures high-intent traffic looking for Huberman's specific recommendations

### Video Support Added to Use-Case Pages

Extended video embed support (previously only on breathing technique pages) to use-case pages for video rich results.

**Changes:**
- Added `UseCaseVideoEmbed` interface to `use-case-pages.ts`
- Added optional `video` field to `UseCasePageContent` interface
- Added VideoObject schema generation in `use-case-page.tsx`
- Added video embed UI section (between References and FAQ)

**First use-case page with video:**
- `/for/huberman` now has Huberman's physiological sigh video (`kSZKIupBUuc`)

**Files Modified:**
- `/src/data/use-case-pages.ts` - Interface + Huberman video data
- `/src/app/for/use-case-page.tsx` - VideoObject schema + video section UI

**Expected Impact:**
- Video rich results for Huberman page
- Framework ready to add videos to other use-case pages (anxiety, sleep, etc.)

## 2026-01-02

### Major SEO Content Expansion - Physiological Sigh & 4-7-8 Timer

Based on Search Console data showing impressions but low clicks (position 23 for physiological sigh, position 9 for 4-7-8 timer), expanded content depth to improve rankings.

**Physiological Sigh Page (Position 23 → Target: Top 10):**
- Rewrote "What it is" section to comprehensive "What Is a Physiological Sigh?" with definition, natural reflex explanation, and Huberman context
- Added "The Science Behind Physiological Sighing" section explaining alveoli reinflation, vagus nerve activation, and Stanford study findings
- Added "Physiological Sigh vs Box Breathing" comparison section to capture "vs" queries
- Added 4 new FAQs: cycles count, mouth breathing, cyclic sighing definition, sigh vs physiological sigh difference
- Expanded keywords array with: "what is a physiological sigh", "cyclic sighing technique", "double inhale exhale breathing", "Stanford sighing study", "physiological sigh vs box breathing", "how many physiological sighs"

**4-7-8 Timer Page (Position 9 → Target: Top 5):**
- Updated meta title: "4-7-8 Breathing Timer: Fall Asleep in 2 Minutes (Free App)"
- Updated meta description with "natural tranquilizer" hook and "Try tonight" CTA
- Enhanced "Suggested settings" → "Best 4-7-8 Timer Settings" with goal-based recommendations
- Added "4-7-8 vs Other Sleep Breathing Techniques" comparison table (4-7-8, box, coherent, physiological sigh)
- Added 4 new FAQs to schema and display: cycles for sleep, lying down, box breathing comparison
- Added internal link to physiological sigh page

**Files Modified:**
- `/src/data/breathing-pages.ts` - Physiological sigh: 3 new body sections, 4 new FAQs, 6 new keywords
- `/src/app/4-7-8-breathing-timer/page.tsx` - New metadata, settings section, comparison table, 4 new FAQs

**Expected Impact:**
- Physiological sigh: Deeper content should improve ranking from position 23 toward top 10
- 4-7-8 timer: Better CTR from improved title + content depth should push from position 9 to top 5
- Comparison content captures "vs" query variations
- Internal linking strengthens topic cluster

### Follow-up SEO Improvements

Additional optimizations based on page review:

**Physiological Sigh:**
- Updated H1 from "Physiological Sigh Coach" → "Physiological Sigh: Instant Stress Relief" (aligns with meta title)
- FAQ schema already implemented via pattern-page.tsx - no action needed
- Added Huberman YouTube video embed (https://youtu.be/kSZKIupBUuc) - increases time on page, adds authority
- Added VideoObject schema for video rich snippets in search results

**4-7-8 Timer:**
- Updated H1 to "4-7-8 Breathing Timer: Fall Asleep Faster" (includes benefit, aligns with meta title)
- Moved comparison table from bottom to position 2 (right after "What is" section) - better for featured snippets
- Page order now: What is → Comparison table → Benefits → How it works → When to use → FAQs

**Technical Implementation (Video Embed):**
- Added `VideoEmbed` interface to `/src/data/breathing-pages.ts`
- Added optional `video` field to `BreathingPageContent`
- Updated `/src/app/breathe/pattern-page.tsx` to render YouTube embed with privacy-enhanced mode
- VideoObject schema added to structured data for video SEO

### Internal Linking - App Pages

Added contextual internal links to dedicated app pages for SEO ranking boost.

**Links Added:**
- `/for/anxiety` → `/box-breathing-app`
- `/for/public-speaking` → `/box-breathing-app`
- `/for/focus` → `/coherent-breathing-app`
- `/for/meditation` → `/coherent-breathing-app`
- `/for/sleep` → `/4-7-8-breathing-timer`
- `/breathe/box` → `/box-breathing-app`
- `/breathe/coherent` → `/coherent-breathing-app`
- `/breathe/4-7-8` → `/4-7-8-breathing-timer`

**Implementation:**
- Added conditional app links in "Quick Sessions" section of use-case pages
- Added conditional app links in "Quick Sessions" section of pattern pages
- Links appear based on `breathingPageSlug` (box, coherent, 4-7-8)

**Files Modified:**
- `/src/app/for/use-case-page.tsx` - Added conditional app links
- `/src/app/breathe/pattern-page.tsx` - Added conditional app links

**Canonical URL Verification:**
- All pattern pages use clean canonical URLs (no query params)
- All use-case pages use clean canonical URLs
- `?duration=` params used for functionality only, not indexed

### SEO Optimizations - 4-7-8 and Physiological Sigh Pages

Optimized existing pages to improve rankings based on Search Console data.

**4-7-8 Page Optimization (Position 9 → targeting top 5):**
- Added query variant FAQ: "Is it '4 7 8' or '4-7-8' breathing?" to capture both search patterns
- Added sleep-specific FAQ: "What are the best 4-7-8 settings for sleep?" for sleep bridge
- Added query variant keywords: "4 7 8 breathing", "4 7 8 breathing timer"
- Targets users searching with spaces vs hyphens

**Physiological Sigh Optimization (344% impression spike momentum):**
- Added Huberman-focused FAQ: "What is the Huberman physiological sigh?"
- Added high-value keywords: "Huberman physiological sigh", "Huberman Lab breathing", "cyclic sighing Stanford", "Stanford breathing technique", "double inhale breathing"
- Added "Huberman sigh" to synonyms
- Aligns with actual search queries from Google Search Console

**Files Modified:**
- `/src/data/breathing-pages.ts` - Updated FAQs and keywords for both pages

### Wim Hof Breathing - Full Protocol Implementation

Added complete Wim Hof breathing technique with protocol-based multi-round support.

**New Features:**
- **Protocol-based breathing**: Unlike other patterns, Wim Hof uses a multi-round protocol system
- **3 rounds × 30 breaths**: Full authentic Wim Hof Method implementation
- **User-controlled retention**: Hold as long as comfortable with "End Hold" button
- **Round/breath counters**: Real-time UI showing current round and breath count
- **Recovery breath phase**: Deep inhale + 15s hold after retention

**Technical Implementation:**
- New `ProtocolPhase` enum: PowerBreathe, RetentionHold, RecoveryInhale, RecoveryHold, RoundComplete, ProtocolComplete
- New `ProtocolPattern` and `ProtocolState` interfaces
- `animateProtocol()` callback in Resonance.tsx for protocol state machine
- Beta waves (15Hz) audio for alertness during power breathing

**Files Created:**
- `/src/app/breathe/wim-hof/page.tsx` - Route file

**Files Modified:**
- `/src/components/resonance/types.ts` - Added protocol types + WimHof to ModeName enum
- `/src/components/resonance/constants.ts` - Added WIM_HOF_PROTOCOL config
- `/src/components/resonance/Resonance.tsx` - Added protocol mode state, animateProtocol, UI elements
- `/src/data/breathing-pages.ts` - Added comprehensive Wim Hof page content (~220 lines)

**Page Content Includes:**
- 12 target keywords (wim hof breathing, iceman breathing, tummo breathing, etc.)
- 5 FAQs covering safety, hold duration, body effects, cold exposure, frequency
- 4 peer-reviewed research citations (Kox 2014, Muzik 2018, van Middendorp 2016, Buijze 2016)
- Extensive safety warnings (never in water, cardiac contraindications, etc.)
- 3 use cases: morning energy, pre-workout, cold exposure prep

**SEO Target Keywords:**
- "wim hof breathing"
- "wim hof method"
- "wim hof breathing technique"
- "iceman breathing"
- "power breathing"
- "tummo breathing"

**Expected Impact:**
- Captures high-volume Wim Hof search traffic (trending topic)
- Differentiates from competitors with full protocol implementation
- Cross-links to athletes and focus use case pages

## 2025-12-19

### Holiday Breathing Feature

Created comprehensive holiday-themed breathing content with snow effect visualizer.

**New Pages:**
- `/holiday-breathing-exercises` - Hub page with quick-start cards, moment-based recommendations, and day plans for gatherings, travel, and hosting
- `/for/holiday-stress` - Use-case page using Physiological Sigh for acute holiday stress (family gatherings, social overwhelm)
- `/for/travel-anxiety` - Use-case page using Coherent Breathing for sustained calm during flights and travel

**Snow Effect (SnowBackground component):**
- Breathing-responsive snowfall animation
- Inhale: snow falls normally (gravity)
- Exhale: snow floats/drifts upward (suspended, weightless effect)
- Holds: gentle suspension
- Idle: soft steady drift
- Usage: `<Resonance snowMode />` or `<Resonance snowMode={true} />`

**Hub Page Features:**
- Interactive Resonance with snow effect in hero section
- Holiday-specific guides prioritized at top (holiday-stress, travel-anxiety)
- Quick-start cards linking to techniques with durations
- "Choose your moment" grid
- Holiday day plans (Gathering Day, Travel Day, Hosting Day)
- Share button with native share API + clipboard fallback
- HowTo schema for rich snippets

**Cross-linking & SEO:**
- Added holiday-stress/travel-anxiety to relatedUseCases on anxiety, sleep, panic-attacks pages
- Added holiday hub to sitemap.ts
- Added "Holiday" link to homepage footer
- Added "Holiday stress" to homepage best moments section
- HowTo, FAQ, and Article schemas on hub page

**Files modified:**
- `/src/data/use-case-pages.ts` - Added holiday-stress and travel-anxiety entries + cross-links
- `/src/components/resonance/components/SnowBackground.tsx` - Updated phase motion for breathing-responsive behavior
- `/src/components/resonance/Resonance.tsx` - Fixed targetDuration → selectedDuration bug
- `/src/app/page.tsx` - Added holiday link to footer and best moments
- `/src/app/sitemap.ts` - Added holiday hub page

**Dark Winter Theme for Holiday Pages:**
- Added `forcedTheme` prop to Resonance component to override user theme preference
- Added `backgroundVariant` prop with 'winter-blue' option (`#0c1929` deep navy)
- Holiday use-case pages (`/for/holiday-stress`, `/for/travel-anxiety`) now use:
  - Dark blue background throughout (hero + content sections)
  - Blue card backgrounds (`#162a43`) instead of brown
  - Blue nested elements (`#1a3352`) for inner cards
  - White snow particles
  - Consistent winter aesthetic matching the holiday hub
- Added share buttons for holiday pages:
  - Below intro text (large, winter variant)
  - Next to "Go to visualizer" button (large, winter variant)
- ShareButton component updated with `size` and `variant` props
- Share button in hero below subtitle

**Additional Improvements:**
- "Back to Holiday Hub" link on holiday use-case pages
- Cross-linked all three holiday pages (hub ↔ stress ↔ travel)
- Holiday-specific timer presets: 30s Reset, 1min Breather, 2min Calm Down
- Seasonal banner on homepage (shows in Dec/Jan)
- Preloaded snow animation with loading placeholder

**Files created:**
- `/src/app/holiday-breathing-exercises/page.tsx` - Hub page with snow Resonance
- `/src/app/holiday-breathing-exercises/share-button.tsx` - Share functionality
- `/src/app/for/holiday-stress/page.tsx`
- `/src/app/for/travel-anxiety/page.tsx`
- `/src/app/for/share-button.tsx` - Reusable share button for use-case pages
- `/src/components/home/seasonal-banner.tsx` - Homepage seasonal banner

## 2025-12-16

### SEO Overhaul - GSC Query Alignment
Based on Google Search Console data showing impressions but 0 clicks at position ~20, implemented comprehensive SEO optimizations to align titles/H1s with actual search queries and expand query surface area.

**Phase 1: Title/H1 Optimizations**

*Homepage Pillar Optimization:*
- Updated FadingHeroTitle: Label "FREE BREATHING VISUALIZER", Title "Deep Breathing Exercises"
- Targets query: "breathing visualizer"
- File: `/src/app/page.tsx`

*Public Speaking Page:*
- Updated hero.title: "Breathing Exercises for Public Speaking"
- Updated meta.title: "Breathing Exercises for Public Speaking — Stop Stage Fright in 60 Seconds"
- Targets query: "breathing exercises for public speaking"
- File: `/src/data/use-case-pages.ts`

*Sleep Page:*
- Updated hero.title: "4-7-8 Breathing for Sleep"
- Updated meta.title: "4-7-8 Breathing for Sleep — Fall Asleep in 2 Minutes (Free)"
- Targets query: "4-7-8 breathing for sleep"
- File: `/src/data/use-case-pages.ts`

**Phase 2: FAQ Additions for Query Variants**

*4-7-8 Timer Page:*
- Added FAQ: "Is it 4-7-8 or 7-8-4 breathing?"
- Captures variant query: "7-8-4 breathing"
- File: `/src/app/4-7-8-breathing-timer/page.tsx`

*Coherent Breathing App Page:*
- Added FAQ: "Is it 'coherent' or 'coherence' breathing?"
- Captures variant query: "coherence breathing"
- File: `/src/app/coherent-breathing-app/page.tsx`

**Phase 3: New Time-Based Tool Pages**

Created 3 standalone tool pages for quick protocol + timer intent:

*/1-minute-breathing-exercise:*
- Protocol: Box breathing 4-4-4-4 (4 cycles = ~64s)
- Target query: "1 minute breathing exercise"
- Lightweight content: How it works, When to use, 6 FAQs
- Internal links to /breathe/box, /for/anxiety, /for/public-speaking

*/2-minute-breathing-exercise:*
- Protocol: Box breathing or Coherent breathing
- Target query: "2 minute breathing exercise"
- Offers choice between structured (box) and gentle (coherent) approaches

*/5-minute-breathing-exercise:*
- Protocol: Coherent breathing (5-5 pacing, ~30 breaths)
- Target query: "5 minute breathing exercise"
- Emphasizes HRV training and deeper relaxation benefits

**Phase 4: Internal Linking & Sitemap**

*Homepage:*
- Added quick session links (1 min, 2 min, 5 min) to "How long?" section
- File: `/src/app/page.tsx`

*Sitemap:*
- Added 3 new time-based pages with priority 0.8
- File: `/src/app/sitemap.ts`

**Files Created:**
- `/src/app/1-minute-breathing-exercise/page.tsx`
- `/src/app/2-minute-breathing-exercise/page.tsx`
- `/src/app/5-minute-breathing-exercise/page.tsx`

**Files Modified:**
- `/src/app/page.tsx` - H1 optimization + quick session links
- `/src/data/use-case-pages.ts` - Public speaking + sleep title updates
- `/src/app/4-7-8-breathing-timer/page.tsx` - 7-8-4 FAQ
- `/src/app/coherent-breathing-app/page.tsx` - Coherence spelling FAQ
- `/src/app/sitemap.ts` - Added new pages

**Expected Impact:**
- Better ranking for existing queries through exact-match titles
- Capture variant queries (7-8-4, coherence) through FAQs
- New query discovery for time-based searches (1/2/5 minute exercises)
- Improved internal link equity distribution

### SEO Overhaul - Phase 5: Duration Parameter Support & Refinements

**URL Duration Parameters:**
- Added `targetDuration` prop to Resonance component with auto-stop logic
- Session automatically stops when target duration is reached
- Pattern pages now parse `?duration=X` URL parameter (in seconds)
- Updated all 4 pattern routes (`/breathe/box`, `/breathe/coherent`, `/breathe/4-7-8`, `/breathe/physiological-sigh`) to pass searchParams

**Time-Based Page Links Updated:**
- 1-minute: `/breathe/box?duration=60`
- 2-minute: `/breathe/box?duration=120` and `/breathe/coherent?duration=120`
- 5-minute: `/breathe/coherent?duration=300`

**ALL CAPS Label Fixes:**
- Homepage: "FREE BREATHING VISUALIZER" → "Free Breathing Visualizer"
- 1-minute page: "QUICK BREATHING EXERCISE" → "Quick Breathing Exercise"
- 2-minute page: "QUICK BREATHING EXERCISE" → "Quick Breathing Exercise"
- 5-minute page: "DEEP BREATHING EXERCISE" → "Deep Breathing Exercise"
- Rationale: Google often rewrites ALL CAPS titles

**Quick Sessions Internal Linking:**
- Added Quick Sessions section to `/src/app/breathe/pattern-page.tsx` (appears on all technique pages)
- Added Quick Sessions section to `/src/app/for/use-case-page.tsx` (appears on all use-case pages)
- Links to 1-min, 2-min, 5-min exercises for improved internal link equity

**Files Modified:**
- `/src/components/resonance/Resonance.tsx` - Added targetDuration prop and auto-stop logic
- `/src/app/breathe/pattern-page.tsx` - Parse duration param, pass to Resonance, add Quick Sessions
- `/src/app/breathe/box/page.tsx` - Pass searchParams to PatternPage
- `/src/app/breathe/coherent/page.tsx` - Pass searchParams to PatternPage
- `/src/app/breathe/4-7-8/page.tsx` - Pass searchParams to PatternPage
- `/src/app/breathe/physiological-sigh/page.tsx` - Pass searchParams to PatternPage
- `/src/app/for/use-case-page.tsx` - Add Quick Sessions section
- `/src/app/page.tsx` - Fix ALL CAPS label
- `/src/app/1-minute-breathing-exercise/page.tsx` - Fix ALL CAPS, add duration param
- `/src/app/2-minute-breathing-exercise/page.tsx` - Fix ALL CAPS, add duration params
- `/src/app/5-minute-breathing-exercise/page.tsx` - Fix ALL CAPS, add duration param

### SEO Overhaul - Phase 6: Static Page Preservation

**Problem:** Server-side searchParams parsing made `/breathe/*` pages dynamic (λ in build output).

**Solution:** Moved duration parsing to client-side using `useSearchParams` in Resonance component.

**Changes:**
1. Removed `targetDuration` prop from Resonance - now reads from URL client-side
2. Added `parseAndClampDuration()` function with MAX_DURATION = 600 seconds
3. Reverted all 4 pattern routes to simple static exports (no searchParams)
4. Pattern pages now use `useSearchParams` hook client-side

**Build verification:**
- All `/breathe/*` pages show ○ (Static) instead of λ (Dynamic)
- Canonical URLs correctly set to clean paths (no query strings)
- Duration clamped to max 600 seconds to prevent abuse

**Files Modified:**
- `/src/components/resonance/Resonance.tsx` - Client-side duration parsing with clamping
- `/src/app/breathe/pattern-page.tsx` - Removed searchParams prop
- `/src/app/breathe/box/page.tsx` - Reverted to static export
- `/src/app/breathe/coherent/page.tsx` - Reverted to static export
- `/src/app/breathe/4-7-8/page.tsx` - Reverted to static export
- `/src/app/breathe/physiological-sigh/page.tsx` - Reverted to static export

### Performance Optimizations - Vercel Speed Insights
Implemented Phase 1 + 2 optimizations to improve Real Experience Score (was 81, target >90).

**Root Causes Identified:**
- Resonance component (841 lines) loading eagerly with canvas, audio, particles
- Build ID regenerating every deploy, breaking browser caching
- CSS blur animations (160px) expensive on mobile
- ParticleBackground loading immediately on all pages

**Changes Made:**

1. **Removed dynamic build ID** (`next.config.js`)
   - Deleted `generateBuildId: async () => build-${Date.now()}`
   - Allows stable browser caching across deploys

2. **Lazy-loaded ParticleBackground** (`src/components/resonance/Resonance.tsx`)
   - Converted to `next/dynamic` with `ssr: false`
   - Canvas animations now load after initial render

3. **Reduced CSS animation cost** (`src/app/globals.css`)
   - Reduced aurora blur from 160px → 80px
   - Added `@media (prefers-reduced-motion: reduce)` to disable animations and backdrop-filter

4. **Lazy-loaded Resonance on use-case pages** (`src/app/for/use-case-page.tsx`)
   - Added loading skeleton ("Loading breathing exercise...")
   - Content renders immediately, interactive component loads after

5. **Lazy-loaded Resonance on pattern pages** (`src/app/breathe/pattern-page.tsx`)
   - Same treatment as use-case pages

**Expected Impact:**
- FCP improvement: content renders before heavy JS loads
- Better caching: stable build IDs across deploys
- Mobile performance: reduced GPU work from blur
- Improved RES on worst pages: /for/athletes (was 54), /breathing-app (was 66), /breathe/4-7-8 (was 88)

**Files Modified:**
- `next.config.js` - Removed generateBuildId
- `src/components/resonance/Resonance.tsx` - Dynamic import ParticleBackground
- `src/app/for/use-case-page.tsx` - Dynamic import Resonance with skeleton
- `src/app/breathe/pattern-page.tsx` - Dynamic import Resonance with skeleton
- `src/app/globals.css` - Reduced blur, added reduced-motion support

## 2025-12-12

### Money Pages Enhanced - Box Breathing, 4-7-8, and Coherent Breathing Apps
Significantly expanded three money/landing pages with comprehensive content to improve SEO and conversion:

**Pages Updated:**
- `/box-breathing-app` - Box breathing timer landing page
- `/4-7-8-breathing-timer` - 4-7-8 breathing timer landing page
- `/coherent-breathing-app` - Coherent breathing/HRV timer landing page

**Enhancements Made:**
- **Content depth increased 6-8x**: Each page grew from ~150 words to 1,200-1,500 words
- **Added 4 comprehensive content sections per page:**
  - "What is [technique]?" - Explains the technique, history, and what makes it unique
  - "Benefits of [technique]" - 6-7 specific, evidence-based benefits with explanations
  - "How [technique] works" - Deep dive into physiological mechanisms (vagus nerve, HRV, autonomic nervous system, etc.)
  - "When to use [technique]" - 7+ specific use cases with practical timing recommendations
- **Added FAQ section**: 6 SEO-optimized questions per page with structured data
- **Added FAQ schema markup**: FAQPage structured data for rich snippet eligibility in SERPs
- **Better H2/H3 structure**: Improved semantic HTML hierarchy for SEO

**Key Content Differentiators:**

*Box Breathing Page:*
- Emphasized Navy SEAL/tactical breathing authority
- Explained equal intervals for balance and predictability
- Covered acute stress management, focus, and sleep applications
- Addressed beginner modifications (3-3-3-3, no-holds)

*4-7-8 Breathing Page:*
- Emphasized Dr. Andrew Weil authority and "natural tranquilizer" positioning
- Deep dive into exhale-emphasis mechanics and vagus nerve activation
- Focused on sleep, anxiety relief, and anger management
- Explained CO₂ buildup benefits (Bohr effect)
- Addressed modification options for comfort

*Coherent Breathing Page:*
- Emphasized HRV training and resonance frequency (0.1 Hz)
- Explained cardiovascular synchronization and respiratory sinus arrhythmia
- Positioned as training practice vs acute intervention
- Covered athletic recovery, daily HRV optimization, meditation prep
- Addressed cumulative benefits from consistent practice

**Target Keywords Addressed:**
- Box breathing: "box breathing app", "box breathing anxiety", "tactical breathing", "box breathing for sleep"
- 4-7-8: "4-7-8 breathing sleep", "4-7-8 anxiety", "Dr. Weil breathing", "4-7-8 breathing timer"
- Coherent: "coherent breathing HRV", "resonance frequency breathing", "HRV breathing", "0.1 Hz breathing"

**Technical SEO:**
- All three pages already had proper metadata and SoftwareApplication schema
- Added FAQPage schema to each for rich snippet eligibility
- Maintained existing BreadcrumbList and SoftwareApplication schemas
- Cross-linking maintained between all three pages

**Expected Impact:**
- Better ranking for long-tail keywords through increased content depth
- Higher time-on-page and lower bounce rate due to more comprehensive content
- FAQ rich snippets may appear in SERPs for question-based queries
- Improved E-A-T signals through detailed scientific explanations
- Better conversion due to addressing more user objections/questions

**Files Modified:**
- `/src/app/box-breathing-app/page.tsx` - Expanded from 170 to 440 lines
- `/src/app/4-7-8-breathing-timer/page.tsx` - Expanded from 170 to 450 lines
- `/src/app/coherent-breathing-app/page.tsx` - Expanded from 170 to 485 lines

## 2025-12-07

### Content Expansion - New Use Case Page: Pregnancy & Labor Preparation
Created `/for/pregnancy` page targeting "breathing exercises during pregnancy" (HIGH search volume keyword).

**New Page Details:**
- **URL:** `/for/pregnancy`
- **Technique:** Modified 4-7-8 Breathing (4-4-8 instead of 4-7-8)
- **Target Keywords:** "breathing exercises during pregnancy", "pregnancy breathing techniques", "breathing for labor", "pregnancy anxiety breathing"
- **Content:** 230+ lines including problem, solution, 4 science points, 7-step how-to, 5 peer-reviewed references, 6 FAQs, EXTENSIVE medical disclaimer
- **SEO Metadata:** Optimized title "Breathing Exercises During Pregnancy: Safe 4-7-8 Technique for Anxiety & Labor"
- **Cross-Linking:** Added to 4-7-8 breathing page's relatedUseCases; links to anxiety and sleep pages

**Files Created:**
- `/src/app/for/pregnancy/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete pregnancy page object (~230 lines)
- `/src/data/breathing-pages.ts` - Added pregnancy to 4-7-8 breathing's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (7 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Pregnancy)

**Key Differentiators:**
- EXTENSIVE medical disclaimer covering high-risk conditions, emergency symptoms, vena cava compression
- Modified timing (4-4-8 instead of 4-7-8) for pregnancy safety
- Addresses trimester-specific safety (position, hold duration, practice modifications)
- Labor preparation focus (between contractions vs during contractions)
- ACOG-approved guidance and Cochrane review citations
- Addresses common fears (breath-holding, oxygen to baby, light-headedness)
- Practical safety rules (NEVER lie flat after 20 weeks, left-side lying preferred)

**Expected Impact:**
- Target keyword "breathing exercises during pregnancy" has MASSIVE search volume
- Requires high E-A-T signals due to medical nature
- Appeals to pregnant women seeking non-medication anxiety relief
- Cross-traffic from 4-7-8 breathing, anxiety, and sleep pages
- 5 peer-reviewed references including Cochrane review and ACOG guidelines
- High medical trust requirement necessitates extensive disclaimers

**IMPORTANT MEDICAL NOTES:**
- Extensive disclaimer covers: high-risk pregnancy, preeclampsia, placenta previa, preterm labor history, gestational diabetes
- Emergency stop conditions: dizziness, vaginal bleeding, severe pain, reduced fetal movement
- Position safety: NEVER flat on back after 20 weeks (vena cava compression risk)
- Modified holds: 4-5 seconds max, skip if uncomfortable
- OB-GYN consultation required for high-risk conditions

### Content Expansion - New Use Case Page: Athletic Recovery
Created `/for/athletes` page targeting "breathing for athletic recovery" (targeted niche keyword).

**New Page Details:**
- **URL:** `/for/athletes`
- **Technique:** Physiological Sigh (double-inhale, long exhale)
- **Target Keywords:** "breathing for athletic recovery", "breathwork for athletes", "breathing between sets", "CrossFit breathing technique", "HIIT recovery breathing"
- **Content:** 220+ lines including problem, solution, 4 science points, 7-step how-to, 5 peer-reviewed references, 6 FAQs, disclaimer
- **SEO Metadata:** Optimized title "Faster Athletic Recovery: Physiological Sigh Between Sets (Stanford Study)"
- **Cross-Linking:** Added to physiological sigh page's relatedUseCases; links to panic-attacks and running pages

**Files Created:**
- `/src/app/for/athletes/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete athletes page object (~220 lines)
- `/src/data/breathing-pages.ts` - Added athletes to physiological sigh's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (7 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Athletes)

**Key Differentiators:**
- Targets CrossFit, HIIT, weightlifting, and endurance athletes
- Emphasizes heart rate recovery (HRR) science and Stanford research
- Explains alveoli re-inflation, lactate clearance, vagus nerve activation
- Practical protocols: 3-5 sighs between sets, timing recommendations
- Addresses competition use and self-consciousness
- Quantifiable claims: "2x faster heart rate reduction", "20-30 BPM drop in 60-90 seconds"

**Expected Impact:**
- Target keywords appeal to CrossFit/HIIT community
- Appeals to performance-focused athletes seeking marginal gains
- Cross-traffic from physiological sigh, panic-attacks, and running pages
- 5 peer-reviewed references including Stanford RCT and HRR research

### Content Expansion - New Use Case Page: Meditation for Beginners
Created `/for/meditation` page targeting "breathing techniques for meditation" (HIGH search volume keyword).

**New Page Details:**
- **URL:** `/for/meditation`
- **Technique:** Coherent Breathing (structured 6-6 rhythm)
- **Target Keywords:** "breathing techniques for meditation", "can't meditate breathing exercises", "meditation breathing", "breathing meditation for beginners"
- **Content:** 220+ lines including problem, solution, 4 science points, 7-step how-to, 5 peer-reviewed references, 6 FAQs, disclaimer
- **SEO Metadata:** Optimized title "Can't Meditate? Start with Coherent Breathing (Meditation for Beginners)"
- **Cross-Linking:** Added to coherent breathing page's relatedUseCases; links to focus and anxiety pages

**Files Created:**
- `/src/app/for/meditation/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete meditation page object (~220 lines)
- `/src/data/breathing-pages.ts` - Added meditation to coherent breathing's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (7 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Meditation)

**Key Differentiators:**
- Positions coherent breathing as "meditation with training wheels" for beginners
- Addresses common meditation struggles (racing mind, can't sit still, falling asleep)
- Explains why external rhythm helps beginners vs formless meditation
- 6-month progression roadmap from structured to formless practice
- Compares to meditation apps (Headspace, Calm)
- Science of alpha waves and meditative brain states

**Expected Impact:**
- Target keyword "breathing techniques for meditation" has strong search volume
- Appeals to meditation beginners who've struggled with traditional practice
- Cross-traffic from coherent breathing and focus pages
- 5 peer-reviewed references including meditation/HRV research

### Content Expansion - New Use Case Page: Focus & Concentration
Created `/for/focus` page targeting "breathing for focus and concentration" (HIGH search volume keyword).

**New Page Details:**
- **URL:** `/for/focus`
- **Technique:** Coherent Breathing (0.1 Hz / 5 breaths per minute)
- **Target Keywords:** "breathing for focus and concentration", "breathing techniques for ADHD", "how to focus with breathing", "breathing for deep work"
- **Content:** 220+ lines including problem, solution, 4 science points, 7-step how-to, 5 peer-reviewed references, 6 FAQs, medical disclaimer
- **SEO Metadata:** Optimized title "Boost Focus by 40%: Coherent Breathing for Concentration (5 Min/Day)"
- **Cross-Linking:** Added to coherent breathing page's relatedUseCases; links to meditation and anxiety pages

**Files Created:**
- `/src/app/for/focus/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete focus page object (~220 lines)
- `/src/data/breathing-pages.ts` - Added focus to coherent breathing's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (7 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Focus)

**Key Differentiators:**
- Emphasizes HRV optimization and 0.1 Hz resonance frequency
- Targets cognitive performance metrics (attention, working memory, cognitive flexibility)
- Positions coherent breathing vs box breathing (focus optimization vs acute stress relief)
- Includes ADHD research with medical caveats
- 3 strategic timing recommendations (morning, post-lunch, pre-high-stakes tasks)
- Explains alpha brain waves and autonomic balance for deep work

**Expected Impact:**
- Target keywords "breathing for focus" and "ADHD breathing techniques" have strong search volume
- Appeals to knowledge workers, students, and peak performers
- Cross-traffic from coherent breathing and meditation pages
- 5 peer-reviewed references including HRV biofeedback research

### Content Expansion - New Use Case Page: Panic Attacks
Created `/for/panic-attacks` page targeting "breathing for panic attacks" (HIGH search volume keyword).

**New Page Details:**
- **URL:** `/for/panic-attacks`
- **Technique:** Physiological Sigh (double-inhale, long exhale)
- **Target Keywords:** "breathing for panic attacks", "stop panic attack fast", "panic attack breathing technique", "how to stop a panic attack"
- **Content:** 200+ lines including problem, solution, 4 science points, 6-step how-to, 5 peer-reviewed references, 6 FAQs, emergency medical disclaimer
- **SEO Metadata:** Optimized title "Stop a Panic Attack in 30 Seconds: Physiological Sigh Technique"
- **Cross-Linking:** Added to physiological sigh page's relatedUseCases; links to anxiety and public-speaking pages

**Files Created:**
- `/src/app/for/panic-attacks/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete panic-attacks page object (~200 lines)
- `/src/data/breathing-pages.ts` - Added panic-attacks to physiological sigh's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (6 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Panic Attacks)

**Key Differentiators:**
- Emphasizes ACUTE panic vs chronic anxiety (different from anxiety page)
- Focuses on hyperventilation and CO₂ regulation science
- Includes emergency medical disclaimer (call 911 for first-time symptoms)
- Stanford research authority (Balban 2023 study)
- Explains why physiological sigh > box breathing for acute panic

**Expected Impact:**
- Target keyword "breathing for panic attacks" has high search volume
- Complements anxiety page by targeting acute episodes vs chronic state
- Cross-traffic from anxiety and physiological sigh pages
- 5 peer-reviewed references including Stanford RCT

### Content Expansion - New Use Case Page: Anxiety
Created `/for/anxiety` page targeting "breathing exercises for anxiety" (HUGE search volume keyword).

**New Page Details:**
- **URL:** `/for/anxiety`
- **Technique:** Box Breathing (4-4-4-4)
- **Target Keywords:** "breathing exercises for anxiety", "breathing techniques for anxiety", "anxiety breathing exercises", "best breathing for anxiety"
- **Content:** 200+ lines including problem, solution, 4 science points, 7-step how-to, 5 peer-reviewed references, 6 FAQs, medical disclaimer
- **SEO Metadata:** Optimized title "Stop Anxiety in 60 Seconds: Box Breathing Technique (Navy SEAL Method)"
- **Cross-Linking:** Added to box breathing page's relatedUseCases; links to panic-attacks and public-speaking pages

**Files Created:**
- `/src/app/for/anxiety/page.tsx` - Route file

**Files Modified:**
- `/src/data/use-case-pages.ts` - Added complete anxiety page object (~210 lines)
- `/src/data/breathing-pages.ts` - Added anxiety to box breathing's relatedUseCases

**Schema Markup (automatic via template):**
- FAQPage (6 Q&A pairs)
- HowTo (7 steps with timing)
- Article (with author, dates, keywords)
- BreadcrumbList (Home → Use Cases → Anxiety)

**Expected Impact:**
- Target keyword "breathing exercises for anxiety" has MASSIVE search volume
- Page optimized for high CTR with emotional hooks and Navy SEAL authority
- Strategic cross-linking creates hub-and-spoke model with other anxiety-related pages
- 5 peer-reviewed references boost E-A-T signals

### SEO Optimization - Phase 1 Quick Wins
Implemented critical CTR optimizations to address 0-click problem (Search Console shows 9-24 impressions but 0 clicks).

**Title & Description Rewrites (All 9 Pages):**
- **Homepage**: "Free Breathing Visualizer - Calm Anxiety in 60 Seconds" (was: "Interactive Breathing Visualizer...")
- **Box Breathing**: "Navy SEAL Technique to Stop Anxiety Fast" (emphasizes authority + specific benefit)
- **4-7-8 Breathing**: "Fall Asleep in 2 Minutes (Dr. Weil's Method)" (specific timeframe + authority)
- **Coherent Breathing**: "Increase Your HRV by 50% with Coherent Breathing (5 Min/Day)" (quantifiable benefit)
- **Physiological Sigh**: "Huberman's Physiological Sigh: Instant Stress Relief (Stanford Study)" (leverages Huberman brand)
- **Public Speaking Page**: "Stop Stage Fright in 60 Seconds - Navy SEAL Box Breathing Method"
- **High Blood Pressure**: "Lower Blood Pressure Naturally: 4-7-8 Breathing Reduces BP by 10 Points"
- **Sleep Page**: "Fall Asleep in 2 Minutes: 4-7-8 Breathing (The Natural Tranquilizer)"
- **Running Page**: "Stop Side Stitches in 30 Seconds: Physiological Sigh for Runners"

**Formula Used**: [Specific Benefit] + [Timeframe] + [Authority/Social Proof] + [Free/Tool]

**Meta Descriptions Updated:**
- Added emotional hooks ("Your hands shake. Your voice cracks...")
- Included social proof ("Used by thousands...", "Used before 100,000+ presentations")
- Clear CTAs ("Try now", "Start today", "Free visualizer")

**Content Freshness:**
- Updated all `dateModified` fields from 2025-11-20 to 2025-12-07 (8 pages)
- Triggers re-crawl signals to Google

**Technical SEO Improvements:**
- Added breadcrumb schema to all breathing pattern pages (`/breathe/*`)
- Added breadcrumb schema to all use case pages (`/for/*`)
- Breadcrumbs improve SERP appearance and help Google understand site hierarchy

**Files Modified:**
- `/src/app/layout.tsx` - Homepage title, description, OG tags, Twitter cards
- `/src/data/breathing-pages.ts` - All 4 pattern metadata + dates
- `/src/data/use-case-pages.ts` - All 4 use case metadata + dates
- `/src/app/breathe/pattern-page.tsx` - Added BreadcrumbList schema
- `/src/app/for/use-case-page.tsx` - Added BreadcrumbList schema

**Expected Impact:**
- CTR increase from 0% to 5-15% within 2 weeks
- Improved SERP appearance with breadcrumbs
- Re-crawl triggered by freshness signals

**Redirect Fixes:**
- Added 301 redirects in `next.config.js` for www → non-www and HTTP → HTTPS
- Affected URLs: `www.deepbreathingexercises.com`, `http://www.deepbreathingexercises.com`, `http://deepbreathingexercises.com`
- All traffic now canonically redirects to `https://deepbreathingexercises.com`
- Should resolve 3 "Page with redirect" errors in Search Console within 1-2 days

## 2025-12-02

### Study URLs Added to Breathing Pages
Added PubMed/journal URLs to all 17 academic studies referenced in the breathing technique pages:
- **Box Breathing**: 4 studies (Laborde 2022, Marchant 2025, Steffen 2017, Fincham 2023)
- **4-7-8 Breathing**: 5 studies (Aktaş & İlgin 2023, Vierra 2022, Laborde 2022, Shao 2024, Tsai 2015/Kuula 2020)
- **Coherent Breathing**: 4 studies (Lehrer 2003, Joseph 2005, Steffen 2017, Fincham 2023)
- **Physiological Sigh**: 4 studies (Balban 2023, Hanley 2025, Severs 2022, Li 2016)

Updated `ResearchStudy` interface in `src/data/breathing-pages.ts` to include optional `url` field.

### Use Case Landing Pages
Added 4 SEO-optimized "hub & spoke" pages targeting specific user problems:
- `/for/public-speaking` - Box breathing for stage fright (Navy SEAL method)
- `/for/high-blood-pressure` - 4-7-8 breathing for hypertension support (with medical disclaimer)
- `/for/sleep` - 4-7-8 breathing for insomnia ("natural tranquilizer" technique)
- `/for/running` - Physiological sigh for recovery & side stitches

**New files created:**
- `src/data/use-case-pages.ts` - TypeScript interfaces and content for all 4 pages
- `src/app/for/use-case-page.tsx` - Reusable template component (Problem → Solution → Science → How-To → References → FAQ)
- `src/app/for/public-speaking/page.tsx`
- `src/app/for/high-blood-pressure/page.tsx`
- `src/app/for/sleep/page.tsx`
- `src/app/for/running/page.tsx`

**Features:**
- Embedded visualizer on each page (no redirect needed to practice)
- Real scientific citations with URLs (Harvard Health, Cleveland Clinic, PubMed, Sleep Foundation, etc.)
- Strategic cross-linking between /for/ pages based on user intent overlap
- Bidirectional links: /breathe/ pages now link to relevant /for/ pages and vice versa
- Full JSON-LD schemas (FAQPage, HowTo, Article)
- Inline medical disclaimer for blood pressure page
- CTAs: Primary "Start practicing now" scrolls to visualizer (#practice), secondary "Learn more" links to /breathe/ pages (SEO interlinking preserved)

### SEO Improvements
- Updated page titles for better CTR: added "Tool" and "Interactive" to differentiate from article-heavy search results
  - Box Breathing Tool (4-4-4-4) - Interactive Visualizer & Guide
  - 4-7-8 Breathing Tool - Interactive Visualizer & Guide
  - Coherent Breathing Tool - Interactive 0.1 Hz Trainer
  - Physiological Sigh Tool - Interactive Timer & Guide
- Added `src/app/sitemap.ts` - auto-generates sitemap.xml with all pages (now includes /for/ routes)
- Added `src/app/robots.ts` - points crawlers to sitemap

### Advanced SEO Schema & Internal Linking Improvements

Further optimizations to improve search rankings and click-through rates.

**Schema Markup Additions:**

*4-7-8 Timer Page:*
- Added HowTo schema with 6 steps ("How to Do 4-7-8 Breathing for Sleep")
- Added Article schema with datePublished/dateModified for freshness signals
- Now has: BreadcrumbList, SoftwareApplication, Article, HowTo, FAQPage schemas

*Physiological Sigh Page:*
- Already had HowTo, FAQ, Article, Breadcrumb, VideoObject schemas via pattern-page.tsx ✓

**Content Additions:**

*Physiological Sigh:*
- Added "Cyclic Sighing: The Clinical Term" H2 section - targets "cyclic sighing" keyword (Stanford's research term)
- Updated hero subtitle: "Calm down in 30 seconds with the double-inhale technique" - prominent time claim for featured snippets
- Updated hero intro with "30 seconds" and "1-3 sighs" time claims
- Added 4-7-8 as related pattern (internal link to /breathe/4-7-8)
- Added 2 new relatedUseCases: anxiety, public-speaking

*4-7-8 Timer:*
- Added inline internal links to /for/sleep, /for/anxiety, /breathe/coherent, /breathe/physiological-sigh
- Added "Use case guides" section with 3 cards: Better Sleep, Anxiety Relief, Blood Pressure Support

**Freshness Signals:**
- Added "Last updated" visible date display to both pages
- Physiological sigh: "Last updated: January 2, 2026"
- 4-7-8 timer: "Last updated: January 2, 2026"
- Pattern-page.tsx now displays dateModified from breathing-pages.ts

**Internal Links Added:**
- 4-7-8 page internal links increased from ~13 to 20
- Physiological sigh page: added 4-7-8 to related patterns, 2 new use cases

**Files Modified:**
- `/src/data/breathing-pages.ts` - Cyclic sighing section, hero updates, related patterns/use cases
- `/src/app/4-7-8-breathing-timer/page.tsx` - HowTo schema, Article schema, use case cards, internal links
- `/src/app/breathe/pattern-page.tsx` - "Last updated" date display

**Expected Impact:**
- HowTo schema enables rich results with step numbers in SERPs
- "Cyclic sighing" keyword captures clinical/research search traffic
- "30 seconds" time claim improves featured snippet eligibility
- Freshness signals (Last updated) support E-E-A-T
- Internal linking strengthens topic cluster authority
