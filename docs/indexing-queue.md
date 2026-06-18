# Indexing Queue

Tracks manual URL submissions to Google Search Console and Bing Webmaster Tools.
The `daily-indexing` skill reads this file, picks the next URLs whose **Indexed**
column is empty AND whose GSC/Bing column is empty, submits them, and writes the
submission date back.

## Current state (as of 2026-05-05)

- **Total URLs in sitemap**: 307
- **Indexed by Google**: 200 (per GSC Page Indexing report — was 180 on Apr 20, +20 in 15 days)
- **Not indexed**: 147 (6 reasons; biggest bucket is "Discovered - currently not indexed" at 113)
- **404 patterns flagged & fixed today**: 5 — all addressed via 3 redirect rules in next.config.js (see SEO-EXPERIMENTS.md 2026-05-05 entry):
  - `/de/es/breathe/wim-hof`, `/de/ja/breathe/breath-of-fire`, `/ja/de/box-breathing-app` → handled by double-locale stripping rule
  - `/breathing-app/*`, `/4-7-8-breathing-timer/*` → handled by sub-path collapse rules
- **Next checkpoint**: 2026-05-19 (scheduled task). Expect "Discovered not indexed" <50 if processing normally.

## Historical state (as of 2026-04-20)

- 180 / 307 indexed, 127 pending.
- **GSC run 2026-04-20**: 126/126 submitted via MCP API (110 on first pass, 16 pt/for/* + /embed on second pass).
- **Bing run 2026-04-20**: 126/126 submitted via agent-browser UI (OAuth Read scope only; API key not stored — used BWT URL Submission UI).

## Columns

- **P** — Priority 1 (highest) to 5 (lowest). Work the lowest-numbered pending rows first.
- **Indexed** — `✓` means confirmed in GSC Page Indexing → Indexed pages. Skip submission for these. Refresh this column weekly by re-pulling the GSC indexed list (see skill doc).
- **GSC** — ISO date submitted via GSC URL Inspection → Request Indexing or the `mcp__mass-translate-backend__request_indexing` API.
- **Bing** — ISO date submitted via Bing Webmaster → URL Submission or the `mcp__mass-translate-backend__submit_urls_bing` API.

## Submission channels (preferred order)

1. **mass-translate MCP API** — fast, batch-friendly, no UI automation.
   - `mcp__mass-translate-backend__request_indexing` — Google Indexing API (one URL per call).
   - `mcp__mass-translate-backend__submit_urls_bing` — up to 10 URLs per call. **Blocker**: needs Bing Content API key from BWT Settings → API Access → connect via backend.
2. **agent-browser UI** — fallback, slower but works without MCP auth.
   - GSC URL Inspection — one URL at a time, ~10-20/day silent cap
   - Bing Webmaster URL Submission — paste batch into dialog, 10K/day quota

## Priority rationale

| Priority | Pattern | Why |
|---|---|---|
| 1 | Homepage, /languages, `/es/*` matching high-demand patterns | Bing's 53.7K Spanish impressions (técnicas de respiración family) — biggest untapped demand |
| 2 | Remaining `/es/*` + buteyko/tummo/ujjayi/wim-hof/physiological-sigh in all 5 locales | AI-Overview-affected queries; needs strong fresh signals |
| 3 | Other translated pages (ja/pt/fr/de) | Moderate demand; indexing accelerates natural rate |
| 5 | English pages | Mostly already indexed; low marginal value |

## Queue

| P | URL | Indexed | GSC | Bing |
|---|---|---|---|---|
| 1 | https://deepbreathingexercises.com/breathe/9d-breathwork |  | 2026-06-13 | 2026-06-13 |
| 1 | https://deepbreathingexercises.com/breathe/hope-cartel-9d-breathwork |  | 2026-06-13 | 2026-06-13 |
| 2 | https://deepbreathingexercises.com/about/abi |  | 2026-06-13 | 2026-06-13 |
| 2 | https://deepbreathingexercises.com/about/editorial-policy |  | 2026-06-13 | 2026-06-13 |
| 2 | https://deepbreathingexercises.com/es/breathe/9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/de/breathe/9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/fr/breathe/9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/ja/breathe/9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/pt/breathe/9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 2 | https://deepbreathingexercises.com/es/breathe/hope-cartel-9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/de/breathe/hope-cartel-9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/fr/breathe/hope-cartel-9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/ja/breathe/hope-cartel-9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/pt/breathe/hope-cartel-9d-breathwork |  | 2026-06-18 | 2026-06-18 |
| 2 | https://deepbreathingexercises.com/es/about/abi |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/de/about/abi |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/fr/about/abi |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/ja/about/abi |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/pt/about/abi |  | 2026-06-18 | 2026-06-18 |
| 2 | https://deepbreathingexercises.com/es/about/editorial-policy |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/de/about/editorial-policy |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/fr/about/editorial-policy |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/ja/about/editorial-policy |  | 2026-06-18 | 2026-06-18 |
| 3 | https://deepbreathingexercises.com/pt/about/editorial-policy |  | 2026-06-18 | 2026-06-18 |
| 1 | https://deepbreathingexercises.com | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/1-minute-breathing-exercise | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/2-minute-breathing-exercise | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/4-7-8-breathing-for-insomnia |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/4-7-8-breathing-timer | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/5-minute-breathing-exercise | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/4-7-8 | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/belly | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/box | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/breath-of-fire |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathe/buteyko | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/coherent | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/nadi-shodhana |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathe/physiological-sigh |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathe/pursed-lip |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathe/tummo | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathe/ujjayi |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathe/wim-hof | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathing-app | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathing-exercises-before-surgery | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/breathing-exercises-for-labor |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/es/breathing-visualizer | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/for/anxiety | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/for/panic-attacks | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/for/sleep | ✓ |  |  |
| 1 | https://deepbreathingexercises.com/es/for/stress |  | 2026-04-20 | 2026-04-20 |
| 1 | https://deepbreathingexercises.com/languages |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/breathe/buteyko | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/breathe/physiological-sigh | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/breathe/tummo | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/breathe/ujjayi | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/breathe/wim-hof | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/de/breathe/buteyko | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/de/breathe/physiological-sigh |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/de/breathe/tummo | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/de/breathe/ujjayi |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/de/breathe/wim-hof | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/about | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/about/methodology |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/box-breathing-app | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/box-breathing-before-presentation |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/breathe | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/coherent-breathing-app | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/embed |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/for/athletes |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/focus |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/high-blood-pressure |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/holiday-stress |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/huberman |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/kids |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/lung-capacity | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/for/meditation |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/pranayama | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/for/pregnancy | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/for/public-speaking |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/running |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/singing |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/for/travel-anxiety | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/holiday-breathing-exercises | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/es/physiological-sigh-panic-attack |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/es/privacy | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/fr/breathe/buteyko | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/fr/breathe/physiological-sigh |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/fr/breathe/tummo | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/fr/breathe/ujjayi |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/fr/breathe/wim-hof | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/ja/breathe/buteyko | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/ja/breathe/physiological-sigh |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/ja/breathe/tummo | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/ja/breathe/ujjayi |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/ja/breathe/wim-hof |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/pt/breathe/buteyko | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/pt/breathe/physiological-sigh |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/pt/breathe/tummo | ✓ |  |  |
| 2 | https://deepbreathingexercises.com/pt/breathe/ujjayi |  | 2026-04-20 | 2026-04-20 |
| 2 | https://deepbreathingexercises.com/pt/breathe/wim-hof |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/1-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/2-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/4-7-8-breathing-for-insomnia |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/4-7-8-breathing-timer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/5-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/about | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/about/methodology |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/box-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/box-breathing-before-presentation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathe | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathe/4-7-8 |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathe/belly | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathe/box | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathe/breath-of-fire |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathe/coherent | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathe/nadi-shodhana |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathe/pursed-lip |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathing-exercises-before-surgery | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/breathing-exercises-for-labor |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/breathing-visualizer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/coherent-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/embed |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/anxiety | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/athletes |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/focus |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/high-blood-pressure |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/holiday-stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/huberman |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/kids |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/lung-capacity | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/meditation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/panic-attacks | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/pranayama | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/pregnancy |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/public-speaking |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/running |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/singing |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/sleep | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/for/stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/for/travel-anxiety | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/holiday-breathing-exercises | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/de/physiological-sigh-panic-attack |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/de/privacy | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/1-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/2-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/4-7-8-breathing-for-insomnia |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/4-7-8-breathing-timer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/5-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/about | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/about/methodology |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/box-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/box-breathing-before-presentation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/breathe | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathe/4-7-8 |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/breathe/belly | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathe/box | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathe/breath-of-fire |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/breathe/coherent | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathe/nadi-shodhana | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathe/pursed-lip |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathing-exercises-before-surgery | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/breathing-exercises-for-labor |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/breathing-visualizer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/coherent-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/embed |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/anxiety |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/athletes |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/focus |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/high-blood-pressure |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/holiday-stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/huberman |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/kids |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/lung-capacity | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/meditation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/panic-attacks | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/pranayama | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/pregnancy |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/public-speaking |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/running | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/singing |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/sleep | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/for/stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/for/travel-anxiety | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/holiday-breathing-exercises | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/fr/physiological-sigh-panic-attack |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/fr/privacy | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/1-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/2-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/4-7-8-breathing-for-insomnia |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/4-7-8-breathing-timer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/5-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/about | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/about/methodology |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/box-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/box-breathing-before-presentation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathe | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/breathe/4-7-8 |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathe/belly |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathe/box | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/breathe/breath-of-fire |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathe/coherent | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/breathe/nadi-shodhana |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathe/pursed-lip |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/breathing-exercises-before-surgery | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/breathing-exercises-for-labor |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/breathing-visualizer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/coherent-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/embed |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/for/anxiety |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/athletes |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/focus |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/high-blood-pressure |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/holiday-stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/huberman |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/kids |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/lung-capacity | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/for/meditation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/panic-attacks | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/for/pranayama | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/for/pregnancy |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/public-speaking |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/running |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/singing |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/sleep | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/for/stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/for/travel-anxiety | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/holiday-breathing-exercises | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/ja/physiological-sigh-panic-attack |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/ja/privacy | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/1-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/2-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/4-7-8-breathing-for-insomnia |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/4-7-8-breathing-timer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/5-minute-breathing-exercise | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/about |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/about/methodology |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/box-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/box-breathing-before-presentation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathe | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/breathe/4-7-8 |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathe/belly |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathe/box | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/breathe/breath-of-fire |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathe/coherent | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/breathe/nadi-shodhana |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathe/pursed-lip |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/breathing-exercises-before-surgery | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/breathing-exercises-for-labor |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/breathing-visualizer | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/coherent-breathing-app | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/embed |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/for/anxiety |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/athletes |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/focus |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/high-blood-pressure |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/holiday-stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/huberman |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/kids |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/lung-capacity |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/meditation |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/panic-attacks | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/for/pranayama | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/for/pregnancy |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/public-speaking |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/running |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/singing |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/sleep | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/for/stress |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/for/travel-anxiety | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/holiday-breathing-exercises | ✓ |  |  |
| 3 | https://deepbreathingexercises.com/pt/physiological-sigh-panic-attack |  | 2026-04-20 | 2026-04-20 |
| 3 | https://deepbreathingexercises.com/pt/privacy | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/1-minute-breathing-exercise | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/2-minute-breathing-exercise | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/4-7-8-breathing-for-insomnia | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/4-7-8-breathing-timer | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/5-minute-breathing-exercise | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/about | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/about/methodology | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/box-breathing-app | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/box-breathing-before-presentation | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/4-7-8 | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/belly | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/box | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/breath-of-fire | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/coherent | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/nadi-shodhana | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathe/pursed-lip | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathing-app | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathing-exercises-before-surgery | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathing-exercises-for-labor | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/breathing-visualizer | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/coherent-breathing-app | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/embed |  | 2026-04-20 | 2026-04-20 |
| 5 | https://deepbreathingexercises.com/for | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/anxiety | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/athletes | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/focus | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/high-blood-pressure | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/holiday-stress | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/huberman | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/kids | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/lung-capacity | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/meditation | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/panic-attacks | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/pranayama | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/pregnancy | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/public-speaking | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/running | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/singing | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/sleep | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/stress | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/for/travel-anxiety | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/holiday-breathing-exercises | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/physiological-sigh-panic-attack | ✓ |  |  |
| 5 | https://deepbreathingexercises.com/privacy | ✓ |  |  |
