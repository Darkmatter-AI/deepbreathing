# QA Sweep — High-Traction Pages (Bing spike leverage check)

**Date:** 2026-06-06
**Branch:** `qa/traction-pages-jun2026` (off `origin/main`)
**Trigger:** Bing search traffic stepped up Jun 1–3 (peak 23 clicks / 455 impr on Jun 3). Before investing in leverage (internal links, content, indexing pushes), confirm the pages *earning* that traction render cleanly and — for localized URLs — are fully translated.

## How this was tested

All testing hit **production** (`https://deepbreathingexercises.com`), because translations are applied by the mass-translate proxy that sits in front of prod — a local/branch dev server renders English only. Production serves `main`, so this inherently tested `main`. The `audio-v2-overnight` working tree was untouched.

Each URL was loaded at **desktop 1280×900** and **mobile 375×812** with a headless Chromium (Playwright, one isolated browser process per probe — no shared-daemon contention), cache-busted with `?cb=<ms>`. Per page we captured: HTTP status, an H1 sample **sequence** over ~2s (to catch hydration language flips), horizontal overflow, console errors / React hydration errors, full body `innerText` (for translation review), an idle screenshot, and a post-Start screenshot. The breathing orb was clicked to verify it animates.

**Known-intentional, NOT flagged** (per the QA scope): English meta description / og:title / twitter tags (proxy skips `<head>`), English pattern names in tables (Box, 4-7-8, Coherent…), English aria-labels, canonical → English URL.

### Translation is applied client-side (verified — important context)

The discriminating test for F1/F2 turned up an architectural fact worth stating up front. **The server HTML is English for every localized URL** — `curl -A "Mozilla/5.0" <localized-url>` returns English H1 *and* English body, with the target-language strings (even the hero that reliably renders translated) **absent**. In a real browser the translation appears **client-side at ~1.5 s after load** (time-series on `/ja/4-7-8-breathing-timer`: the Japanese body marker `副交感神経` is absent at t=0–900 ms and present from ~1500 ms onward). So:

- Raw `curl` / any non-JS fetch sees an **all-English** page. This is what an initial (pre-render) crawl sees.
- The half-English findings below are **coverage gaps in the client-side translation pass** (content that the pass never converts), not a server-side proxy that "skipped" a section. The untranslated content is **stable** — it's still English at t=4000 ms, fully settled — so these are not transient hydration flashes.
- **Ownership is ambiguous from the outside.** The content that escapes translation (the tool-page H1; the recurring science/mechanism/step-by-step sections) is plausibly rendered/injected by React client components *after* the translation pass runs over the DOM — which would make it a repo ↔ translation-layer interaction, not purely a mass-translate coverage miss. Triage should confirm which layer owns the fix before assigning.
- **SEO implication (beyond this sweep's scope, but load-bearing for the "leverage" decision):** if Google indexes the pre-render HTML it sees English; if it renders JS it sees the mixed end-state. Either way these are not cleanly Japanese/Portuguese/Spanish pages. Worth a GSC "view crawled page" check before investing in leverage.

## Verdict table

| URL | Desktop | Mobile | Verdict |
|---|---|---|---|
| `/` (home) | PASS | PASS | ✅ leverageable |
| `/breathing-visualizer` | PASS | **FAIL** — orb not tappable | 🔴 needs fix (mobile) |
| `/4-7-8-breathing-timer` | PASS | **FAIL** — orb not tappable | 🔴 needs fix (mobile) |
| `/5-minute-breathing-exercise` | PASS (content page, no inline orb — by design) | PASS | ✅ leverageable |
| `/breathe/box` | PASS | PASS | ✅ leverageable |
| `/breathe/4-7-8` | PASS | PASS | ✅ leverageable |
| `/breathe/wim-hof` | PASS | PASS | ✅ leverageable |
| `/breathe/9d-breathwork` | PASS | PASS | ✅ leverageable |
| `/breathe/tummo` | PASS | PASS | ✅ leverageable |
| `/breathe/belly` | PASS | PASS | ✅ leverageable |
| `/breathe/pursed-lip` | PASS | PASS | ✅ leverageable |
| `/ja/4-7-8-breathing-timer` | **FAIL** — English H1 + half-English body | **FAIL** — English H1, orb not tappable, half-English body | 🔴 needs fix (HIGH — #1 traction page) |
| `/ja/breathe/wim-hof` | **FAIL** — half-English body + hydration errors | same | 🟡 needs fix (translation) |
| `/ja/for/kids` | **FAIL** — half-English body + hydration errors + EN H1 flash | same | 🟡 needs fix (translation) |
| `/pt/breathe/wim-hof` | **FAIL** — half-English body + hydration errors | same | 🟡 needs fix (translation) |
| `/es/for/kids` | **FAIL** — half-English body + hydration errors + EN H1 flash | same | 🟡 needs fix (translation) |

**EN traction set: 9/11 fully leverageable.** The two standalone tool pages (`/breathing-visualizer`, `/4-7-8-breathing-timer`) are clean on desktop but have a dead breathing orb on mobile.

**Localized traction set: 0/5 fully leverageable.** All five render a correct, in-language hero/above-the-fold, but the deeper body content is substantially English, and the `/breathe` + `/for` templates throw React hydration errors. `/ja/4-7-8-breathing-timer` (the #1 traction page, `478タイマー` pos 1) additionally renders an English H1.

## Findings (detail)

### F1 — Localized pages are half-English in body content (systemic, HIGH)
Above-the-fold (h1, subtitle, primary CTA, language switcher, signup) renders correctly in the target language on all 5 pages once the client translation pass runs (~1.5 s). But large blocks of deeper body content — specifically the science / mechanism / step-by-step sections — are **never converted and stay English** (still English at t=4 s, confirmed by time-series — not a transient flash). The same English blocks recur across pages, which points at specific content sections the client translation pass doesn't cover (see the "translation is client-side" note above for the verified mechanism and the open ownership question), not random misses.

English-run counts (runs of ≥4 consecutive English words in the body `innerText`, proper nouns excluded):

| Page | English runs | Sample leaked text |
|---|---:|---|
| `/ja/4-7-8-breathing-timer` | 27 | "The vagus nerve runs from your brainstem down through your chest and abdomen" |
| `/ja/breathe/wim-hof` | 49 | "How to do Wim Hof Breathing (Step by Step)" (whole section) |
| `/ja/for/kids` | 58 | "Children's brains are still developing the prefrontal cortex" |
| `/pt/breathe/wim-hof` | 71 | "controlled hyperventilation technique consisting…" |
| `/es/for/kids` | 91 | "These kid-friendly breathing exercises are designed…" |

Evidence: `docs/qa-evidence/traction-2026-06-06/ja-wim-hof-halfenglish.png` (English "How to do Wim Hof Breathing" block inside the Japanese page), `es-for-kids-halfenglish.png`. Clean hero for contrast: `es-for-kids-hero-clean.png`.

This is the "ranking at position 1 but half-English = wasted traction" case the sweep was built to catch. **Do not push more indexing/links at these localized URLs until the body translation gap is closed.**

### F2 — `/ja/4-7-8-breathing-timer` renders an English H1 (HIGH — #1 traction page)
The H1 reads `4-7-8 breathing timer (free online)` in **English**, reliably (5/5 fresh loads, both viewports; English at every timestamp t=0–4 s), while the rest of the body translates to Japanese around it. The `/breathe/*` and `/for/*` template pages translate their H1 correctly (ja-wim-hof → `ウィム・ホフ呼吸法`, es-for-kids → Spanish), so this is specific to the standalone tool-page template whose title (the `FadingHeroTitle` client component) renders the English bundle string and escapes the client translation pass. This is the top click query in the spike (`478タイマー`, 3 clicks, pos 1), so the most-clicked localized page shows an English headline. Evidence: `ja-478-timer-english-h1.png`. (Distinct from, and more severe than, the documented benign meta/og English limitation — this is the visible on-page H1. Same likely mechanism as F1: client-component content escaping the translation pass.)

### F3 — React hydration errors on localized `/breathe` + `/for` templates (MEDIUM)
`/ja/breathe/wim-hof`, `/pt/breathe/wim-hof`, `/ja/for/kids`, `/es/for/kids` throw `Minified React error #418 / #423 / #425` (hydration mismatch / "text content does not match server-rendered HTML") on load (intermittently on `/ja/4-7-8-breathing-timer` too). Note: the brief English H1 **flash** observed at first paint on `/ja/for/kids` and `/es/for/kids` is mostly explained by the normal server-English → client-translated transition (English server HTML, target language appears ~1.5 s later — see mechanism note), and these four settle to the correct H1. So the *user-visible* consequence is minor (a sub-2 s English flash that resolves). But `#418/#423` mean React is discarding server HTML and re-rendering the root client-side, which is a correctness smell and may be *part of why* the translation pass and the client components race the way they do (F1/F2). EN pages show **no** hydration errors. Worth investigating jointly with F1/F2 rather than in isolation.

### F4 — Mobile: breathing orb not tappable on the two standalone tool pages (MEDIUM)
On `/breathing-visualizer` and `/4-7-8-breathing-timer` at 375px, the breathing orb (`button[aria-label="Start Session"]`, z-20) is covered by the hero-content overlay (`div … inset-y-0 … max-w-xl … justify-end`, z-30), which **intercepts pointer events**. Tapping the orb — the only in-page control that starts the animation — does nothing. Confirmed by the browser's own hit-testing (pointer-event interception) and reproducible 2/2 on both pages. On desktop the overlay uses `sm:justify-center` and the click gets through, so desktop is fine. Home `/`, `/breathe/box`, and `/breathe/tummo` orbs are all tappable on mobile (2/2 OK) — so this is specific to those two pages' hero layout. It cascades to `/ja/4-7-8-breathing-timer` (same template). A partial escape hatch exists (the orange "Start session" link navigates to `/breathe/box`, where the orb works), but the on-page interaction is dead. Evidence: `breathing-visualizer-mobile-orb-dead.png` (orb still shows ▶ after a Start tap) vs `breathe-box-mobile-orb-works.png`.

This is related to but distinct from existing backlog items #1 (orb discoverability) and #5 (orb icon/text overlap): here the orb is functionally **unclickable**, not just unclear.

## Out of scope (not re-litigated here)
- Fixing the bugs (separate triage pass).
- The other ~230 locale/route combinations (only the traction set was tested).
- The known meta/og English limitation (documented; head-only; benign).

## Reproduction
Probe + raw artifacts are under `/tmp/qa-traction/` (ephemeral): `probe.py`, `results/*.json`, `text/*.txt` (body dumps), `shots/*.png`. Re-run: `python3 probe.py <slug> <path> <lang>`.
