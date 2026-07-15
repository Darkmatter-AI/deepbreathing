# `/for` family native migration audit

Date: 2026-07-15  
Status: compiler, reviewed inputs, renderer, loader, local manifest-preview integration, production-equivalent build, artifact verification, and representative hydrated QA complete; deployment and full browser-matrix evidence remain pending

## Scope decision

The `/for` family contains nineteen routes:

- the bespoke hub at `/for`;
- eighteen structured use-case routes from `/for/anxiety` through `/for/travel-anxiety`.

This slice follows ADR-016 strict migration parity. It preserves the current English meaning, claims, qualifications, safety language, timings, page structure, destinations, and route behavior. It fills true translation gaps and repairs objectively defective approved translations. It does not include keyword work, content improvement, SEO rewriting, redesign, route changes, or production cutover.

## Family compiler boundary

### `/for` hub

The hub has a separate typed 50-field source object, deterministic compiler, values-only locale bundles, and a literal server-only loader. It covers metadata, breadcrumbs, hero copy, all eighteen cards, calls to action, and footer chrome.

Each locale bundle resolves 45 preserved catalog occurrences and five reviewed overrides. The overrides bind the current English metadata title, current card titles, and current softened or schema-only card copy where the preserved catalog occurrence is stale or absent. All five bundles are complete with zero unresolved values.

### Eighteen structured routes

The shared structured compiler reads `src/data/use-case-pages.ts` as the shape authority and emits a localized object plus route-aware renderer chrome for every route-locale pair. It covers 1,479 translatable content leaves and 7,395 locale cells.

Source paths are build-time bindings, not runtime text lookups. Manual values and reviewed replacements pin the current English source with SHA-256 hashes. Source drift, current-catalog drift, missing values, changed numbers, damaged links or markup, and unsupported locale keys fail closed.

The existing `/for/anxiety` semantic proof remains the source of truth for its five complete content bundles and locale-specific crisis guidance. The runtime route shell no longer contains an anxiety-specific branch; the generic family compiler preserves that proof evidence in the same typed route contract.

## Catalog recovery and translation closure

The route audit found 1,057 of 1,479 structured leaves with safe route-catalog evidence before global recovery. Source-missing leaves created 2,070 raw locale gaps. Anxiety proof values, exact metadata occurrence binding, global approved evidence, and shared chrome reduced the compiler's initial unresolved queue to 639 cells.

Translation closure was split by risk:

| Lane                                | Routes | Cells | Result                                |
| ----------------------------------- | -----: | ----: | ------------------------------------- |
| Grok Fast browser pilot             |      1 |    38 | 38 accepted                           |
| Grok Composer output-only CLI       |     11 |   455 | 455 accepted                          |
| Grok 4.5 high-effort safety lane    |      5 |   146 | 146 accepted after independent review |
| Total reviewed missing translations |     17 |   639 | 639 accepted                          |

The safety lane covered high blood pressure, pregnancy, panic attacks, lung capacity, and pranayama. The review preserved medical qualifiers, emergency guidance, pregnancy caveats, timings, counts, units, citations, links, and claim strength. It returned three non-blocking flags for ambiguous or broken English source and terminology consistency; no broader source repair was mixed into migration scope.

## Reviewed replacements

An independent strict-parity audit proposed 91 objective replacements across sixteen routes:

- Spanish: 61;
- Japanese: 21;
- Brazilian Portuguese: 7;
- French: 2;
- German: 0.

The replacements repair concrete defects such as truncated metadata, untranslated English fragments, corrupted technique names, lost source meaning, and numeric drift. Casing-only video-title differences and metadata/body occurrence conflicts were rejected as binding questions rather than translation defects.

The reviewed proposal is imported deterministically into sixteen compiler-owned route files. All 91 replacements pass source binding, current-catalog binding, numeric review, link and markup safety, and family compilation.

## Runtime and publication contract

The family uses:

- `src/i18n/content/bespoke/for-index/` for the hub;
- `src/i18n/content/use-cases/manual/` for reviewed missing values;
- `src/i18n/content/use-cases/reviewed-replacements/` for objective catalog repairs;
- generated `routes/`, `chrome/`, `provenance/`, `unresolved/`, and `publication.json` artifacts;
- a literal `server-only` route loader;
- the shared server `UseCasePage` renderer with localized route chrome;
- the generic localized catch-all for the hub and all eighteen slugs.

The compiler reports 90 of 90 structured locale-route pairs publishable with zero unresolved values. `/for` and all eighteen structured routes are marked `preview` for every translated locale. None is `cutover-ready`, and production remains on the existing proxy path.

Renderer chrome now owns the previously fixed video, holiday-session, timer, application CTA, and lung-capacity contextual-link labels. Editorial content remains server-owned; full content objects are not serialized into client breathing islands.

## Grok delegation trial

The reusable process and measured rework log are recorded in [`ROUTE-FAMILY-PLAYBOOK.md`](ROUTE-FAMILY-PLAYBOOK.md) and [`work/for-batch-map.md`](work/for-batch-map.md).

The repeatable routing conclusion is:

- use one fresh, tool-free Composer process per ordinary route contract and accept only a complete output copy validated by the integrator;
- use isolated staged edits plus a separate high-effort Grok 4.5 review for safety-sensitive groups;
- do not use native Grok subagents, `--best-of-n`, Grok worktrees, ambient memory, web, MCP, or direct canonical writes for this workflow;
- use `structuredOutput` from the JSON envelope when present rather than parsing concatenated human-readable `.text` fragments;
- preserve raw process evidence and reject whole batches when no translation-only diff can be proven.

Composer's edit-oriented trial accepted zero cells in two attempts. The output-only contract then completed 455 of 455 cells. Sum of per-route elapsed time was 216.995 seconds, bounded-wave wall time was about 92 seconds, and reported usage was 213,596 total tokens. Grok 4.5's mutation and review passes took 108.072 and 74.390 seconds and reported 285,723 total tokens. OAuth output did not provide dollar cost.

## Local validation evidence

- Structured compiler: 18 routes, 90 of 90 publishable locale-route pairs, zero unresolved.
- Focused structured compiler suite: 14 of 14 passing.
- Integrated route, renderer, manifest, hub, compiler, and server-chrome suite: 42 of 42 passing.
- Complete native-i18n suite after inventory regeneration: 112 of 112 tests passing.
- TypeScript, targeted ESLint, and `git diff --check` pass.
- Production-equivalent `NATIVE_I18N_MODE=native-preview` build: 273 static pages.
- Localized catch-all: 175 generated preview paths and 170 kB first-load JavaScript.
- Post-build verifier: 185 localized HTML artifacts accepted.
- Verifier checks include localized HTML language, title, canonical, reciprocal alternates, route coverage, fail-closed errors, and absence of proxy globals.

Representative hydrated checks passed on:

- Spanish `/for` hub;
- Portuguese panic-attacks and travel-anxiety routes;
- Japanese pregnancy route;
- French Huberman route;
- Spanish holiday-stress route;
- German lung-capacity route;
- Japanese Ujjayi as a regression check on the prior family.

These pages rendered the expected localized H1, document language, localized title, self-canonical, and seven alternate links. Admitted internal targets remained locale-prefixed, while routes outside native preview intentionally fell back to English. Unadmitted `/es/holiday-breathing-exercises` returned the expected 404.

The post-build local server was started without loading the repository's Better Auth environment, so it logged missing local auth-secret warnings during browser QA. That does not affect the static translation, metadata, or routing evidence above; it also means this run does not claim an authenticated-flow browser check. The production-equivalent build itself loaded the repository environment.

## Evidence still pending

This audit supports local Phase 3 parity, not production admission. The following remain pending:

- Vercel preview deployment using the intended native-preview environment;
- full desktop and mobile browser matrix across all nineteen routes and five locales;
- accessibility, screenshot, crawler-user-agent, share, video, timer, pacer, and interactive-link checks;
- authenticated-flow checks with the intended preview secrets;
- crawl, performance, external-state, rollback, and observation evidence required by later phases;
- final content-quality or terminology review, which remains deliberately separate from migration parity.

Production routing, sitemap behavior, and the MassTranslate proxy are unchanged.
