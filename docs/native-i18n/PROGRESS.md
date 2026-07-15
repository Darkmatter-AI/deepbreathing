# Native internationalization progress

Append meaningful work here in chronological order. Keep entries factual. Link commits, tests, reports, and decisions when available.

## Entry template

### YYYY-MM-DD: Short milestone

Status: Planned, In progress, Blocked, Complete, or Rolled back

What changed:

- Item

Evidence:

- Command, report, screenshot, URL, or commit

Decisions:

- ADR link or `None`

Blockers and risks:

- Item or `None`

Next:

- Item

## 2026-07-15: Migration direction approved

Status: In progress

What changed:

- Confirmed that the long-term goal is to remove MassTranslate rather than continue extending the reverse-proxy integration.
- Confirmed that MassTranslate will not produce future translations for this site.
- Set repository ownership of all existing and future translation content as the target.
- Deferred new languages, keyword research, and translation-tool selection until the native foundation exists.
- Created this documentation set to preserve objective, scope, decisions, phased work, gates, rollback, and execution history.
- Established a planning estimate of 20 to 30 focused engineering days, to be revised after the import and native-rendering proof.

Evidence:

- `CLAUDE.md` read as canonical repository guidance.
- `docs/SEO-EXPERIMENTS.md` and `docs/runbooks/tools-and-data-sources.md` reviewed for existing proxy behavior and SEO constraints.
- Current repository architecture confirms that locale-prefixed routes are advertised by the sitemap but served through the external proxy.
- `src/components/language-switcher.tsx` currently depends on `window.__MT_CONFIG__` and client-only rendering to avoid proxy link rewriting.
- `src/app/api/warm-cache/route.ts` and the two-hour cron exist to protect proxy-served locale pages from cold-cache crawl timeouts.
- `scripts/build-og-translations.mjs` currently scrapes localized production pages to create checked-in social-title data.
- `src/components/resonance/runtime-phrases.ts` demonstrates that a small repository-native shared phrase catalog is already viable.

Decisions:

- [ADR-001](DECISIONS.md#adr-001-the-repository-is-the-translation-source-of-truth)
- [ADR-002](DECISIONS.md#adr-002-masstranslate-will-not-participate-in-runtime-build-or-future-translation-work)
- [ADR-003](DECISIONS.md#adr-003-preserve-the-current-public-url-contract)
- [ADR-004](DECISIONS.md#adr-004-use-checked-in-route-scoped-bundles)
- [ADR-005](DECISIONS.md#adr-005-published-localized-routes-fail-closed)
- [ADR-006](DECISIONS.md#adr-006-use-stable-semantic-message-ids-and-source-hashes)
- [ADR-007](DECISIONS.md#adr-007-render-localized-content-on-the-server-and-hydrate-from-the-same-data)
- [ADR-008](DECISIONS.md#adr-008-one-route-manifest-controls-publication-and-discovery)
- [ADR-009](DECISIONS.md#adr-009-migrate-and-cut-over-in-stages)

Blockers and risks:

- Existing translations still need a deterministic one-time export and semantic mapping into route bundles.
- Catalog placement data may not map cleanly to stable message IDs for every bespoke page.
- Existing translation defects must be separated from migration regressions.
- The exact external proxy rollback procedure must be captured before production routing changes.
- Sitemap and hreflang changes are high-risk because a prior sitemap pathway change caused substantial indexing churn.

Next:

- Complete the public locale-route and MassTranslate-dependency inventory.
- Produce a deterministic translation export and coverage report.
- Resolve the deferred bundle format and native App Router composition decisions.
- Build the representative native-rendering proof without changing production routing.

## 2026-07-15: Isolated implementation baseline

Status: Complete

What changed:

- Created the `codex/native-i18n` branch in a dedicated worktree based on the exact current repository HEAD, so the migration does not disturb unrelated local files or the active App Store branch.
- Established the pre-change validation baseline before modifying serving behavior.

Evidence:

- Worktree: `/Users/abi/.codex/worktrees/native-i18n-deepbreathing`.
- `pnpm exec tsc --noEmit --pretty false` passed.
- The existing full Node test suite had 115 passing and 13 failing tests before migration code was added. The failures concern pre-existing conversion-prompt assertions, SSR build-output assumptions, missing Open Graph assets/fonts, sign-up-button expectations, and reviewer fallback behavior.

Decisions:

- None.

Blockers and risks:

- The 13 existing failures must remain distinguished from native-i18n regressions.

Next:

- Use focused migration tests plus the passing typecheck while preserving the full-suite baseline.

## 2026-07-15: MassTranslate catalog preserved in the repository

Status: Complete

What changed:

- Added a deterministic exporter that reads the production catalog inside a repeatable-read, read-only transaction.
- Checked in route-scoped preservation artifacts for all five current translated locales.
- Preserved orphaned translations separately instead of discarding records that no current page placement references.
- Added per-file checksums, whole-catalog integrity hashes, count reconciliation, and a focused integrity test.

Evidence:

- `src/i18n/catalog/manifest.json` records 59 pages, 11,033 source segments, 7,012 current placements, and all 22,084 translation records.
- All 22,084 translation records are approved; there are zero drafts and zero manual overrides.
- The snapshot includes 280 orphaned translation records: 30 each for German, French, Japanese, and Portuguese, plus 160 for Spanish.
- Current untranslated placements total 86 per locale and 87 for Portuguese. These affect `/`, `/box-breathing-before-presentation`, `/breathing-visualizer`, `/embed`, `/physiological-sigh-panic-attack`, `/privacy`, `/stats`, `/support`, and one Portuguese-only placement on `/breathing-app`.
- `node --test scripts/tests/i18n-catalog-export.test.mjs` passed 4 of 4 tests and verified every artifact checksum, byte count, route filename, placement total, unique translation ID, whole-record hash, database-URL exclusion, and destructive output-path guard.
- Compact artifacts occupy approximately 36 MB on disk and approximately 6.9 MB when compressed.

Decisions:

- [ADR-010](DECISIONS.md#adr-010-preserve-the-raw-catalog-separately-from-semantic-runtime-bundles)

Blockers and risks:

- The raw catalog uses DOM occurrence and context identities. It is preservation evidence, not the final semantic runtime contract.
- Page records identify their source as `en-gb` while the tenant default is `en-us`; native mapping must normalize this explicitly.
- Existing untranslated placements prevent a blanket all-route publication gate from passing.
- The 6,836 unplaced source segments are counted but not exported; 6,677 of them have no translation and 159 have translations already preserved in the orphan files.

Next:

- Map structured route data and shared UI to stable semantic IDs.
- Classify each missing placement as intentional, obsolete, or a required content gap.
- Generate minimal route-scoped runtime bundles from the preservation snapshot.

## 2026-07-15: Locale and path foundation added

Status: Complete

What changed:

- Added a typed six-locale registry for English, Spanish, Brazilian Portuguese, French, German, and Japanese.
- Centralized BCP 47 tags, public prefixes, native labels, HTML language, direction, and locale aliases.
- Added segment-safe helpers for detection, prefix stripping/replacement, localized URLs, and hreflang alternates while keeping English unprefixed.
- Repeated locale prefixes such as `/de/es/...` are repaired rather than propagated.

Evidence:

- `node --test scripts/tests/native-i18n-foundation.test.mjs` passed 9 of 9 tests.
- `pnpm exec tsc --noEmit --pretty false` passed after the foundation was added.
- Focused lint and `git diff --check` passed.

Decisions:

- [ADR-003](DECISIONS.md#adr-003-preserve-the-current-public-url-contract)
- [ADR-007](DECISIONS.md#adr-007-render-localized-content-on-the-server-and-hydrate-from-the-same-data)

Blockers and risks:

- These helpers are not connected to production routes, the sitemap, metadata, or the language switcher yet.

Next:

- Add the validated route manifest and semantic bundle loader before exposing native locale routes.

## 2026-07-15: Route, sitemap, catalog, and dependency inventory completed

Status: Complete

What changed:

- Added a deterministic Phase 0 inventory generated entirely from checked-in app routes, sitemap code, metadata, the preserved catalog manifest, and explicit dependency classification.
- Recorded every static and dynamic page route, current publication matrix, catalog coverage, noindex state, and repository reference to MassTranslate or the proxy-bypass origin.

Evidence:

- The app has 60 static page routes plus the dynamic `/embed/[slug]` pattern.
- The current sitemap publishes 57 English URLs and 56 URLs for each of five translated locales, totaling 337 URLs.
- The catalog covers all 56 currently translated sitemap routes in all five locales.
- `/sensory-studio` is the only static app route absent from the catalog.
- `/brand-lab` and `/og-preview` are cataloged but excluded from the sitemap.
- `/languages` is currently English-only despite having five locale catalog artifacts.
- `/stats` is currently noindex while English and five locale URLs appear in the sitemap; this is recorded as an existing contradiction, not changed in this slice.
- All 42 files found by the explicit proxy and MassTranslate marker scan are classified by active, temporary migration, operational, test, or historical role.
- `node scripts/i18n/build-native-i18n-inventory.mjs --check` passed.
- `node --test scripts/tests/native-i18n-inventory.test.mjs` passed 4 of 4 tests.

Decisions:

- [ADR-008](DECISIONS.md#adr-008-one-route-manifest-controls-publication-and-discovery)

Blockers and risks:

- Cloudflare Worker routes, KV/cache keys, DNS, Vercel aliases and environment values, signed-webhook destinations, and external monitors remain external-state inventory work before cutover.

Next:

- Capture exact external proxy configuration and reversal steps before production routing changes.
- Convert the generated baseline into a client-safe fail-closed route manifest.

## 2026-07-15: Structured translation mapping audited

Status: Complete

What changed:

- Parsed the 14 breathing-pattern and 18 use-case data sources without executing application modules.
- Classified every string leaf and compared translatable content against all five route-scoped preservation catalogs.
- Separated safe one-time seeds, equivalent duplicates, conflicts, and exact source misses.

Evidence:

- The 32 structured routes contain 3,913 literal string leaves, of which 2,917 are translatable content.
- 2,041 leaves have one exact match and 123 have multiple candidates that agree in every locale.
- 2,164 leaves, or 74.2 percent, are safe to seed into explicit semantic fields.
- 727 leaves have no exact current-source match and 26 leaves have context-dependent translation conflicts.
- None of the 2,190 matched leaves has a semantic catalog `fieldKey`.
- Zero matched sources lack a translation in any locale.
- `node --test scripts/tests/i18n-structured-mapping.test.mjs` passed 3 of 3 tests.

Decisions:

- [ADR-006](DECISIONS.md#adr-006-use-stable-semantic-message-ids-and-source-hashes)
- [ADR-010](DECISIONS.md#adr-010-preserve-the-raw-catalog-separately-from-semantic-runtime-bundles)

Blockers and risks:

- The 753 unresolved or conflicting structured fields need explicit repo-owned mapping or reconstruction before their routes can be native-public.
- Some misses are joined or rich-text content rather than genuinely absent translations; they need slot-aware reconstruction instead of new translation or English fallback.

Next:

- Compile the safe subset for `/breathe/buteyko` and `/for/anxiety` into frozen semantic IDs.
- Produce explicit override work for every unresolved field.

## 2026-07-15: Native App Router architecture accepted

Status: Complete

What changed:

- Selected separate URL-neutral English and localized route groups with independent root layouts and one shared document shell.
- Selected a manifest-backed localized optional catch-all plus explicit exceptions for `/stats` and `/embed/[slug]`.
- Defined `proxy`, `native-preview`, and `native` serving modes so native routes can be validated without changing current production traffic.
- Defined server-only long-form bundle boundaries and a small server-seeded client phrase provider.
- Defined the first proof matrix as `/`, `/breathe/buteyko`, `/for/anxiety`, `/about`, and `/4-7-8-breathing-timer` across all five locales.

Evidence:

- `next.config.js` currently contains two unconditional redirects that strip every supported locale prefix before filesystem routing.
- `src/app/layout.tsx` currently hardcodes the root document language as English.
- The raw catalog has no usable semantic `fieldKey` or selector identity for direct runtime loading.
- `docs/native-i18n/ARCHITECTURE.md` records the exact route tree, data flow, manifest states, rendering contract, serving modes, proof set, and validation matrix.

Decisions:

- [ADR-011](DECISIONS.md#adr-011-use-separate-english-and-localized-root-layouts)
- [ADR-012](DECISIONS.md#adr-012-use-explicit-proxy-native-preview-and-native-serving-modes-during-migration)

Blockers and risks:

- The mechanical route-group move is intentionally deferred until the semantic proof and route manifest exist.
- Metadata and discovery changes require a precommitted migration entry in `docs/SEO-EXPERIMENTS.md` before implementation.

Next:

- Complete the fail-closed route manifest and two-route semantic compiler proof.
- Then refactor shared views without changing current English output.

## 2026-07-15: Fail-closed native route manifest added

Status: Complete

What changed:

- Added a client-safe typed manifest for all 60 static routes and the dynamic `/embed/[slug]` exception.
- Separated current publication intent from native migration readiness.
- Added per-locale states for catalog-only, mapping-required, semantic-ready, preview, and cutover-ready.
- Added exact lookup, locale intent, semantic readiness, preview, cutover, and static-parameter helpers.
- Defaulted every translated route to catalog-only or mapping-required, so the native preview and production parameter sets are empty.

Evidence:

- The manifest preserves the current 57 English plus 56-per-locale URL contract without changing the sitemap.
- Exact manifest paths are checked against the generated current-app inventory.
- `/languages` remains English-only, excluded routes remain unpublished, and the `/stats` noindex-in-sitemap contradiction remains explicit.
- `node --test scripts/tests/native-i18n-route-manifest.test.mjs` passed 8 of 8 tests.
- `pnpm exec tsc --noEmit --pretty false` passed.

Decisions:

- [ADR-005](DECISIONS.md#adr-005-published-localized-routes-fail-closed)
- [ADR-008](DECISIONS.md#adr-008-one-route-manifest-controls-publication-and-discovery)

Blockers and risks:

- The manifest is not connected to routing, metadata, the sitemap, or the language switcher yet.
- No locale-route pair may advance to preview until its semantic bundle is complete.

Next:

- Use the manifest as the gate for the native route shell after the semantic proof passes.

## 2026-07-15: Two-route semantic compiler proof added

Status: Complete

What changed:

- Added frozen semantic maps for `/breathe/buteyko` and `/for/anxiety` with 190 descriptive message IDs and reviewed English source hashes.
- Compiled only audit-safe catalog matches into minimal locale message maps.
- Separated source text, hashes, status, and catalog provenance from runtime strings.
- Added an explicit null override scaffold and unresolved report rather than inventing translations or copying English.
- Added a server-only loader with a small static publication gate and literal dynamic imports for one route-locale bundle at a time.

Evidence:

- `/breathe/buteyko` has 99 semantic messages: 77 seeded and 22 unresolved.
- `/for/anxiety` has 91 semantic messages: 64 seeded and 27 unresolved.
- The proof seeds 141 of 190 messages, or 74.2 percent, across all five locales.
- All 10 locale-route pairs are non-publishable and the loader refuses them before importing a bundle.
- Runtime files contain only semantic ID and localized string pairs; no source text, source hash, catalog UUID, DOM context, selector, or lookup API is present.
- `node scripts/i18n/semantic-proof/build-semantic-proof.mjs --check` passed with digest `a1035ad2ac440682f4c47ef15a857a1947dba566c4e5933d11c5bcf33aae4dad`.
- `node --test scripts/tests/native-i18n-semantic-proof.test.mjs` passed 7 of 7 tests.

Decisions:

- [ADR-004](DECISIONS.md#adr-004-use-checked-in-route-scoped-bundles)
- [ADR-005](DECISIONS.md#adr-005-published-localized-routes-fail-closed)
- [ADR-006](DECISIONS.md#adr-006-use-stable-semantic-message-ids-and-source-hashes)
- [ADR-010](DECISIONS.md#adr-010-preserve-the-raw-catalog-separately-from-semantic-runtime-bundles)

Blockers and risks:

- The 49 unresolved fields still need catalog reconstruction or reviewed repo-owned translations.
- This proof is not wired to page rendering and must stay non-public until complete.

Next:

- Resolve the 49 proof fields, then apply the compiler contract to the remaining structured routes.
- Refactor structured views to accept resolved content and locale explicitly.

## 2026-07-15: Shared root document extracted without changing output

Status: Complete

What changed:

- Extracted the root `<html>` and `<body>` shell, font, theme initialization, analytics, page-view tracking, authentication provider, seasonal banner, and performance instrumentation into a reusable Server Component.
- Kept metadata in the current root layout and kept its explicit HTML language as `en`.
- Updated the existing page-view tracker regression test to follow the shared document shell.

Evidence:

- `node --test scripts/tests/native-i18n-site-document-contract.test.mjs scripts/tests/page-view-tracker.test.mjs` passed 8 of 8 tests.
- Focused ESLint and the full TypeScript check passed.

Decisions:

- [ADR-011](DECISIONS.md#adr-011-use-separate-english-and-localized-root-layouts)

Blockers and risks:

- The current application still has one English root layout. The localized root and route-group move remain a later gated slice.

Next:

- Reuse the document shell from separate English and localized root layouts after semantic proof content is complete.

## 2026-07-15: Foundation integration review completed

Status: Complete

What changed:

- Aligned the localized catch-all parameter contract with `[locale]/[[...segments]]`.
- Made localized route ownership explicit so `/stats` cannot be emitted by both its dedicated page and the catch-all.
- Unified the two proof route IDs with the route manifest and added a cross-layer contract test.
- Declared `server-only` as a direct dependency instead of relying on a transitive workspace package.
- Guarded the catalog exporter so its recursive replacement can target only direct `src/i18n/catalog*` artifact directories.
- Updated the analytics and generated-inventory guards after the shared document extraction.

Evidence:

- The focused native-i18n, catalog, document, page-view, and analytics suite passed 45 of 45 tests.
- `node scripts/i18n/build-native-i18n-inventory.mjs --check` and `node scripts/i18n/semantic-proof/build-semantic-proof.mjs --check` passed.
- `pnpm exec tsc --noEmit --pretty false`, focused ESLint, and `git diff --check` passed.
- The full repository suite passed 156 of 167 tests. The remaining 11 failures are in the pre-existing conversion, build-output, metadata-image, signup-button, and reviewer-fallback baseline groups.
- `pnpm exec next build` compiled successfully and passed its lint/type stage. Page-data collection then stopped because this worktree lacks the Better Auth environment and the local presence database; no native-i18n compilation error was reported.
- Independent review found no credential or secret patterns, and reconciled all 22,084 catalog records and checksums.

Decisions:

- No new ADR. The fixes enforce ADR-004, ADR-005, ADR-008, ADR-011, and ADR-012.

Blockers and risks:

- A complete production build still requires an intentionally configured auth and database test environment.
- No localized route is previewable or cutover-ready; routing, sitemap, metadata, and production behavior remain unchanged.

Next:

- Resolve the 49 proof fields and refactor the two shared route views to accept resolved locale content.
- Implement the manifest-gated native preview shell only after the proof bundles are complete.

## 2026-07-15: Proof translations closed with owner-approved Luna workflow

Status: Complete

What changed:

- Recorded standing owner authorization for Luna to translate unrecoverable content and for production cutover after every preview and rollback gate passes.
- Filled all 49 proof-route catalog gaps across German, Spanish, French, Japanese, and Brazilian Portuguese, adding 245 reviewed repository-owned values.
- Preserved the existing locale terminology, medical and safety qualifiers, links, markup, ranges, numbered guidance, arrows, and scientific notation.
- Extended override validation to preserve source numeric values and protected symbols in addition to placeholders, links, and markup.
- Advanced `/breathe/buteyko` and `/for/anxiety` to `semantic-ready` for all five translated locales. Neither route is `preview` or `cutover-ready`.

Evidence:

- The compiler now emits 950 of 950 required localized values: 704 effective catalog-seeded values, 245 explicit gap overrides, and 1 reviewed regional-safety replacement.
- Both routes and all ten locale-route bundles are complete; the unresolved report contains zero messages and zero values.
- One Japanese idiom was adjusted from a numeric `1 day` construction to `daily` after the new source-token validator identified the added number.
- `node scripts/i18n/semantic-proof/build-semantic-proof.mjs --check` passed with digest `438d36c57602197eec088e0a171ae889e901d8a744471852cae1c65c80b48e8b`.
- `node --test scripts/tests/native-i18n-semantic-proof.test.mjs scripts/tests/native-i18n-route-manifest.test.mjs` passed 16 of 16 tests.
- TypeScript and `git diff --check` passed after compilation.

Decisions:

- Translation closure and gated production-cutover authorization are recorded in `DECISIONS.md` under Owner authorizations.

Blockers and risks:

- Complete message bundles do not prove rendered-page parity. The localized route shell, resolved structured content, metadata, client phrases, and browser checks still remain.
- Production routing, sitemap, canonicals, hreflang, and metadata remain unchanged.

Next:

- Refactor the shared pattern and use-case renderers to accept resolved localized content.
- Wire the two semantic-ready routes into a manifest-gated native preview without changing production serving mode.

## 2026-07-15: Structured renderers prepared for localized content

Status: Complete

What changed:

- Added content-first metadata builders for the shared breathing-pattern and use-case route families while preserving their existing slug-based English wrappers.
- Allowed both shared server renderers to receive a resolved typed content object and an explicit canonical path.
- Kept the resolved long-form object inside the Server Component; client islands still receive only the fields they already use.
- Derived route-specific behavior from the resolved content slug so a localized caller cannot accidentally combine one route's content with another route's conditionals.

Evidence:

- `node --test scripts/tests/native-i18n-structured-renderer-contract.test.mjs` passed 2 of 2 tests.
- `pnpm exec tsc --noEmit --pretty false`, focused ESLint, and `git diff --check` passed.
- Existing English route files still call the same slug-based `PatternPage`, `UseCasePage`, `createPatternMetadata`, and `createUseCaseMetadata` interfaces.
- The full repository suite passed 158 of 169 tests. The same 11 pre-existing conversion, build-output, metadata-image, signup-button, and reviewer-fallback failures remain.

Decisions:

- The React/Next performance guidance reinforced keeping long-form content server-side and avoiding serialization of the full route object into `Resonance` or other client components.

Blockers and risks:

- Internal links, common UI phrases, canonical paths, and metadata still need the native locale context before these renderers can be used by a localized route.
- No route, sitemap, metadata output, redirect, or production serving behavior changed.

Next:

- Compile complete proof message maps into resolved typed route content on the server.
- Add the gated localized dispatcher and root layout only after the route-content contract passes English parity tests.

## 2026-07-15: Complete proof-route runtime content compiled offline

Status: Complete

What changed:

- Added a deterministic offline compiler that reconstructs the full typed page shape for `/breathe/buteyko` and `/for/anxiety` in all five translated locales.
- Applied frozen semantic source paths only while generating checked-in content. The request-time application never performs source-text matching, DOM lookup, or generic path mutation.
- Added ten route-scoped JSON page objects plus a checksum-backed publication artifact.
- Added a typed `server-only` loader with literal dynamic imports so a route loads only its selected locale object.
- Recorded the migration hypothesis, current indexed/sitemap baseline, preview gates, and numerical rollback criteria in `docs/SEO-EXPERIMENTS.md` before changing native routing or metadata.

Evidence:

- The compiler produced 10 complete page objects totaling approximately 184 KB.
- `/breathe/buteyko` applies all 99 semantic messages in each locale; `/for/anxiety` applies all 91.
- Generated objects preserve the exact English source shape and all non-translatable routing, mode, author, date, media, URL, citation, keyword, and related-route fields.
- `node --test scripts/tests/native-i18n-route-content.test.mjs` passed 5 of 5 tests.
- `node scripts/i18n/semantic-proof/compile-proof-route-content.mjs --check`, TypeScript, and focused ESLint passed.

Decisions:

- [ADR-013](DECISIONS.md#adr-013-compile-complete-runtime-page-objects-offline)

Blockers and risks:

- The anxiety crisis disclaimer was promoted from an exact catalog seed into an explicit reviewed regional-safety replacement. Official national sources were verified for Germany (`116 123`), Spain (`024`), France (`3114`), Japan (`0570-064-556`), and Brazil (`188`); no localized bundle retains the US-only `988` number.
- The shared renderers still contain English chrome and share text, related-card labels can come from English source maps, internal links are unprefixed, and the interactive breathing controls still need a small locale phrase contract.
- Keywords and synonyms intentionally remain English in this proof and are not a publication blocker for the technical migration, but they remain a future SEO-content gap.
- Production routing, sitemap output, canonicals, hreflang, and current proxy serving remain unchanged.

Next:

- Inventory and type the server-rendered chrome, client phrases, and localized-link contract used by the two proof routes.
- Keep regional safety resources in the explicit reviewed-replacement layer when scaling health-related routes; catalog approval alone is not sufficient for region-sensitive crisis guidance.
- Only then add the manifest-gated localized dispatcher and separate root layout.

## 2026-07-15: Two-route native preview serves repository-owned translations end to end

Status: Complete for the two-route preview slice; the full migration remains in progress

What changed:

- Compiled complete route-scoped server chrome for `/breathe/buteyko` and `/for/anxiety` in all five translated locales, with no request-time catalog lookup or source-text matching.
- Added explicit locale inputs across shared server renderers and interactive client surfaces, including the breathing controls, settings, account prompts, share UI, dates, language switcher, and conversion prompts.
- Moved all page-bearing English routes mechanically into the URL-neutral `(site-en)` group and added the locale-aware `(site-localized)/[locale]` root.
- Added a manifest-gated localized catch-all that owns only the two admitted proof routes, loads long-form content and server chrome through literal server-only imports, and emits localized canonical, hreflang, Open Graph, Twitter, and structured-data output.
- Added `proxy`, `native-preview`, and `native` build modes. The application route gate now mirrors the redirect mode: proxy emits no native pairs, preview emits preview-approved pairs, and native emits only cutover-ready pairs.
- Advanced the two routes to `preview` for all five translated locales. No route is `cutover-ready`, the sitemap is unchanged, and the default production configuration remains `proxy`.

Evidence:

- The server-chrome compiler emits 56 messages per Buteyko locale and 52 per anxiety locale: 540 localized values total, 400 recovered from route/global catalog evidence and 140 explicit reviewed override values. All ten bundles are publishable and the unresolved report is empty.
- The client runtime resolver contains 107 typed phrases for each of six locales. Native callers pass locale explicitly; proxy inference remains only as a compatibility path.
- The focused native-i18n, catalog, route-shell, document, page-view, and analytics suite passed 63 of 63 tests.
- `pnpm exec tsc --noEmit --pretty false` passed. Focused ESLint reported zero errors and the existing `Resonance` `<img>` warning.
- A fully configured `NATIVE_I18N_MODE=native-preview pnpm exec next build` completed successfully, generated all 98 static targets, and listed the ten localized proof paths under the manifest-gated catch-all.
- Inspecting the first production artifacts caught a Buteyko-only `__next_error__` client-render fallback caused by a direct `Resonance` import. Moving that `useSearchParams` experience behind the same client-island boundary as the use-case renderer removed every localized deopt warning. A new renderer contract test pins that boundary.
- `pnpm run verify:native-i18n-preview` verifies that all ten final production HTML artifacts have the correct BCP 47 `lang`, localized title, self-canonical, seven alternate links, no `__next_error__` document, no proxy global, and no US `988` crisis number; it also rejects an unapproved `/es/breathe/box` artifact.
- Local no-JavaScript requests returned 200 for representative Spanish, Portuguese, French, German, and Japanese proof URLs with the correct BCP 47 `lang`, localized title, self-canonical, seven reciprocal alternate links, translated server chrome, and no US `988` crisis number.
- `/es/breathe/box` returned 404 in `native-preview` because it is not admitted by the manifest.
- In default `proxy` mode, `/es/breathe/buteyko` and `/pt/for/anxiety` retained their existing 308 redirects to the unprefixed English route, while `/breathe/buteyko` returned 200.
- A hydrated in-app browser check on `/es/breathe/buteyko?duration=60` preserved the localized title, `lang`, H1, and chrome through load with no hydration error. Selecting the localized `5 min` control updated the URL to `?duration=300` while the canonical remained query-free.
- With the configured build artifacts present, the full repository suite passed 175 of 185 tests. Its ten failures are pre-existing conversion, homepage build-output, OG font/image, and reviewer-fallback baseline groups; the route-group move introduced no remaining regression-test failure.

Decisions:

- [ADR-011](DECISIONS.md#adr-011-use-separate-english-and-localized-root-layouts)
- [ADR-012](DECISIONS.md#adr-012-use-explicit-proxy-native-preview-and-native-serving-modes-during-migration)
- [ADR-013](DECISIONS.md#adr-013-compile-complete-runtime-page-objects-offline)
- [ADR-014](DECISIONS.md#adr-014-separate-long-form-content-server-chrome-and-interactive-phrases)

Blockers and risks:

- A production-equivalent Vercel preview is still required even though the configured local production build now passes.
- The architecture proof set also includes `/`, `/about`, and `/4-7-8-breathing-timer`; those routes remain catalog-only or mapping-required and are not served natively.
- Full browser QA must still cover all ten admitted pairs, a complete breathing-session start/pause cycle with audio enabled, mobile breakpoints, crawler user agents, and accessibility states.
- The current client phrase module includes every locale table in one client-visible module. Measure and split active-locale delivery before it becomes material.
- The production sitemap, Cloudflare route, signed-webhook path, auth origins, cache warmer, and external monitors remain on the legacy path and still need the documented external-state inventory before cutover.

Next:

- Complete the remaining three proof-set routes across all five locales, then run the full proof matrix in a production-equivalent preview.
- Add malformed double-prefix canonicalization for `native` mode and browser/crawl assertions for the cutover candidate.
- Scale the semantic and server-chrome compiler across the remaining 30 structured routes, keeping each family manifest-gated and fail closed.

## 2026-07-15: Bespoke `/about` route admitted to native preview

Status: Complete for `/about`; the full migration remains in progress

What changed:

- Refactored the English route into a thin App Router wrapper and a shared server-rendered `AboutPage` driven by one typed 31-value content object.
- Added a deterministic offline bespoke-route compiler, source object, catalog provenance, complete publication checks, literal `server-only` locale loaders, and values-only generated bundles.
- Recovered 29 of 31 values from exact route or explicitly selected cross-route catalog evidence in German, Spanish, French, and Brazilian Portuguese. Added two complete Luna-reviewed overrides for current editorial copy that did not exist in the preserved catalog.
- Preserved linked prose as typed before/label/after slots. No imported HTML, source-text lookup, or English runtime fallback is used.
- Added two Japanese-only reviewed replacements after rendered composition review found that separately approved author fragments joined ungrammatically around the linked name.
- Advanced `/about` to `preview` for all five translated locales, while leaving it out of `native` and leaving production on the default `proxy` mode.
- Gave `/about` an explicit localized page rather than the structured catch-all after the first production build showed that shared segment ownership doubled its reported first-load JavaScript.

Evidence:

- `node --test scripts/tests/native-i18n-*.test.mjs` passed 57 of 57 tests after the first implementation; the focused about, manifest, and route-shell slice passed 20 of 20 after client-graph isolation.
- The full repository suite passed 182 of 192 tests. The ten failures are the same pre-existing conversion, homepage build-output, OG font/image, and reviewer-fallback baseline groups.
- `pnpm exec tsc --noEmit` and focused ESLint passed with zero errors.
- A fully configured `NATIVE_I18N_MODE=native-preview pnpm exec next build` completed successfully and generated 103 static targets: ten structured catch-all paths plus five explicit `/[locale]/about` paths.
- The explicit localized route reports 85.3 KB first-load JavaScript, effectively matching the 85.1 KB English route and replacing the 170 KB catch-all result from the first build.
- `pnpm run verify:native-i18n-preview` passed for all 15 admitted production HTML artifacts, checking BCP 47 `lang`, title, self-canonical, seven alternates, absence of Next error fallback HTML, absence of the proxy global, and absence of the US-only `988` number.
- Built Spanish HTML contains the localized H1 and fail-closed English targets for incomplete linked routes. Built Japanese HTML contains both reviewed author-composition replacements.
- The catalog compiler emits zero unresolved values. Publication accounting is 29 catalog values plus two reviewed overrides in four locales; Japanese uses 27 catalog values, two reviewed overrides, and two reviewed replacements.

Decisions:

- [ADR-015](DECISIONS.md#adr-015-give-bespoke-routes-typed-content-and-client-footprint-aware-ownership)

Blockers and risks:

- `/about` is preview-ready, not cutover-ready. A Vercel preview and broader browser/accessibility matrix still remain.
- The timer audit found approved but materially poor German and Japanese translations, including changed breathing-count semantics and corrupted wording. Its English source also contains health claims that need editorial review before native publication.
- The homepage remains the broadest route because it combines shared datasets, the primary client experience, conversion UI, locale switching, metadata, and structured data.
- No sitemap, canonical publication set, Cloudflare route, deployment, commit, or production state changed.

Next:

- Model `/4-7-8-breathing-timer` as one typed source object so visible FAQs, metadata, and JSON-LD cannot drift independently.
- Complete the timer's English medical/editorial review before accepting translations for disputed claims; keep the route catalog-only until all five locale bundles pass quality review.
- Migrate the homepage last, using an isolated client boundary and the existing 107-key runtime phrase contract.

## 2026-07-15: Bespoke `/4-7-8-breathing-timer` route admitted to native preview

Status: Complete for the timer; the full migration remains in progress

What changed:

- Recorded the owner's strict-parity scope in ADR-016: preserve English meaning and claims, close genuine translation gaps, and repair only objectively broken target values. Content, evidence, and SEO improvements remain separate so their effects can be measured against this baseline.
- Refactored the English timer into a thin route wrapper and shared server renderer driven by one typed 176-message source object.
- Added a deterministic timer compiler, literal server-only locale loaders, values-only runtime bundles, catalog provenance, reviewed-gap and replacement layers, publication accounting, and an explicit unresolved report.
- Derived metadata, Article schema, visible FAQ content, and FAQ schema from the same typed content. Preserved the existing schema-only HowTo behavior because rendering a new section would change the migration baseline.
- Added an explicit localized timer route so the client-heavy `Resonance` island does not alter the client graph of other localized routes.
- Advanced the timer to `preview` in all five translated locales while leaving every route out of `cutover-ready` and keeping production on `proxy`.

Translation evidence:

- Every locale resolves all 176 messages with zero unresolved values and no runtime English fallback.
- German uses 136 exact catalog values, ten normalized catalog values, 18 reviewed gaps, and 12 reviewed replacements that restore adjustable count semantics where the catalog had changed them to fixed seconds.
- Spanish uses 143 exact, 15 normalized, and 18 reviewed gaps; French and Brazilian Portuguese each use 144 exact, 15 normalized, and 17 reviewed gaps.
- Japanese uses 139 exact, 15 normalized, 19 reviewed gaps, and three replacements for objectively corrupt wording or a name typo.

Validation evidence:

- The focused timer compiler, manifest, and route-shell suite passed 19 of 19 tests. TypeScript, focused ESLint, and `git diff --check` passed.
- A production-equivalent `native-preview` build completed with 108 static pages after loading the existing local environment through Next's environment loader.
- The post-build verifier passed all 20 admitted localized HTML artifacts, including title, BCP 47 `lang`, self-canonical, reciprocal alternates, error-document absence, proxy-global absence, and fail-closed rejection of `/es/breathe/box`.
- The localized timer and English timer both report 167 KB first-load JavaScript.
- Live requests returned 200 for all five timer locales with localized metadata and content. A Japanese browser check preserved localized hydration and changed the selected duration URL to `?duration=300` without a hydration error.
- The Start control did not advance in the local in-app browser on either Japanese or English. That identical behavior is recorded as baseline parity rather than changed in the migration.

Blockers and risks:

- The four-route matrix still needs a configured Vercel preview and the final broad crawler, mobile, accessibility, and audio/browser matrix.
- The homepage is the final proof route and remains the broadest client-boundary test.
- Existing English health claims and schema policy were deliberately preserved. Any evidence cleanup or claim change must be reviewed as a separate content experiment after migration.
- No sitemap, Cloudflare route, deployment, commit, or production state changed.

Next:

- Migrate the homepage under the same strict-parity rule, keeping long-form content server-owned and the interactive client payload bounded.
- Run the complete five-route proof matrix in a configured preview before expanding publication to route families.

## 2026-07-15: Homepage completes the local five-route native preview proof

Status: Complete for local homepage admission; the full migration remains in progress

What changed:

- Added a deterministic homepage compiler, typed source object, occurrence-specific catalog bindings, values-only locale bundles, literal server-only loader, provenance, reviewed override and replacement layers, and a zero-entry unresolved report.
- Refactored the English homepage into a thin wrapper and a shared server renderer without changing the English interactive import, metadata ownership, visual structure, claims, or behavior.
- Added the locale root to the manifest-gated catch-all and advanced `/` to `preview` for all five translated locales while leaving every route out of `cutover-ready`.
- Kept visible content, metadata, WebSite schema, FAQ schema, navigation, cards, safety copy, and footer copy on the server. FAQ schema now derives from the visible FAQ values.
- Isolated `Resonance` only for localized roots after the first build proved that a direct import deopted the entire translated document. English retains the existing direct import, keeping this a migration-boundary fix rather than a homepage optimization.
- Kept internal links localized only when the target is admitted by the route manifest; incomplete targets intentionally remain working English URLs, and `/languages` remains English-only.

Translation evidence:

- Each locale resolves all 159 server-owned homepage messages with zero runtime English fallback.
- Every locale uses four reviewed translations for current source strings absent from the preserved root catalog.
- Reviewed fidelity replacements are limited to objective defects: German 5, Spanish 13, French 4, Japanese 7, and Brazilian Portuguese 6.
- Structural display slugs, URLs, mode enums, colors, schema types, and external destinations remain untranslated.

Validation evidence:

- TypeScript and focused ESLint passed with zero errors.
- The focused homepage, manifest, and route-shell suite passed 20 of 20 tests.
- The complete native-i18n suite passed 77 of 77 tests. The repository-wide suite passed 195 of 205; its ten failures are the unchanged conversion-variant, English homepage build-artifact, OG font/image, and reviewer-fallback baselines.
- A production-equivalent `native-preview` build completed successfully and generated 113 static pages.
- The post-build verifier passed all 25 admitted localized HTML artifacts with correct BCP 47 `lang`, localized title, self-canonical, seven alternates, no Next error document, no legacy proxy global, and no standalone US `988` crisis number.
- All five locale roots returned 200 locally with localized titles; all four earlier proof routes remained 200, while unapproved `/es/breathe/box` remained 404.
- Built localized root HTML ranges from approximately 89.8 KB to 94.7 KB. The localized catch-all reports 170 KB first-load JavaScript versus 167 KB for English `/`, and the client chunk contains none of the checked long-form translation values.
- A hydrated Spanish root retained `lang="es-ES"`, the localized title, localized H1, translated runtime controls, and translated server content without an English hero swap. The existing hero start delegation remained unchanged.

Blockers and risks:

- The full proof set still requires a configured Vercel preview and the complete browser, crawler-user-agent, mobile, accessibility, and audio matrix.
- English `/` retains its documented `useSearchParams` deopt baseline. The localized route avoids propagating that baseline so translated server HTML can pass the migration gate; changing English behavior remains out of scope.
- No sitemap, Cloudflare route, deployment, commit, production environment, or external service state changed.

Next:

- Run the complete five-route proof matrix in a configured Vercel preview.
- Implement and validate the remaining cutover-candidate routing and external-state gates before advancing any route to `cutover-ready`.
- Begin Phase 3 route-family work only after the five-route preview evidence is reviewed.

## 2026-07-15: Complete `/breathe` family reaches local native preview

Status: Complete for deterministic bundles, renderer integration, and manifest-controlled local preview; production-admission evidence remains pending

What changed:

- Added a dedicated 42-field compiler and shared server renderer for the `/breathe` hub.
- Compiled all fourteen structured `/breathe/*` routes into complete locale-specific content and renderer-chrome artifacts.
- Closed genuine catalog gaps with 747 route-scoped reviewed translation cells and applied 45 narrow replacements for objectively defective approved values under ADR-016.
- Added literal server-only loaders, publication gating, localized metadata and structured data, localized internal-link behavior, and manifest admission for the complete family.
- Advanced all 15 family routes to `preview` for all five translated locales. No route advanced to `cutover-ready`, and production remains on `proxy`.
- Hardened the structured compiler after final review: manual values now fail closed on English source drift, scaffolding preserves completed reviewed translations, manifest checks bind each path to its actual ID, kind, and status, and the normal build checks both `/breathe` artifact sets before Next.js runs.

Translation and artifact evidence:

- The structured compiler reports 14 routes, 70 publishable locale-route pairs, and zero unresolved values.
- The hub resolves 42 of 42 fields in every locale with zero unresolved values.
- Structured runtime bundles and chrome are values-only; source paths, catalog IDs, hashes, review reasons, and provenance remain outside runtime payloads.
- The reviewed replacement set contains 45 strict-parity repairs for truncation, malformed grammar, reversed instructions, lost timing or safety meaning, and unrelated keyword injection.
- Running the scaffold path after translation closure preserved all 163 manual and replacement inputs byte-for-byte.

Validation evidence:

- Both deterministic compiler checks pass, and the build preflight fails when either artifact set is stale.
- The complete native-i18n suite passes 91 of 91 tests. TypeScript, focused ESLint, and `git diff --check` pass.
- The repository-wide suite passes 216 of 226 tests. Its ten failures remain the established conversion-variant, English homepage build-artifact/discovery, OG font/image, and reviewer-fallback baselines.
- A production-equivalent `native-preview` build completed successfully and generated 183 static pages. The localized catch-all reports 170 KB first-load JavaScript versus 167 KB for the English structured routes.
- The post-build verifier passed all 95 admitted localized HTML artifacts with correct BCP 47 `lang`, localized title, self-canonical, seven alternates, no Next error document, and no legacy proxy global. It also rejects the unapproved `/es/for/sleep` artifact.
- The Tummo lineage legitimately contains the historical year `988`; the verifier now scopes the US crisis-number guard to `/for/anxiety` and has a regression test for both cases.
- Hydrated checks passed on the Spanish hub, Japanese Ujjayi, and French Hope Cartel routes with stable localized metadata, H1, body copy, family links, and no browser errors.
- Representative routes in Spanish, German, French, Japanese, and Brazilian Portuguese returned 200 locally. Unapproved `/es/for/sleep` returned 404.

Blockers and risks:

- The complete family still needs a configured Vercel preview and the full crawler-user-agent, mobile, accessibility, share, video, timer, and interactive-pacer matrix.
- Stable semantic IDs across every structured field remain a Phase 1 contract improvement. Current source paths are deterministic, build-time-only bindings with pinned source hashes; they are not runtime text lookups.
- Existing English claims, keywords, and design remain intentionally unchanged so later improvements can be measured separately.
- No sitemap, Cloudflare route, deployment, commit, production environment, or external service state changed.

Next:

- Review the complete local `/breathe` evidence and retain it in preview state.
- Migrate the remaining `/for` family under the same strict-parity compiler and renderer controls.
- Run the expanded native matrix in a configured Vercel preview before advancing any route to `cutover-ready`.

## 2026-07-15: Complete `/for` family reaches local native preview

Status: Complete for deterministic bundles, reviewed translation inputs, renderer integration, manifest-controlled local preview, production-equivalent build, artifact verification, and representative hydrated QA; deployment and full browser-matrix evidence remain pending

What changed:

- Added a dedicated 50-field compiler and shared server renderer for the `/for` hub.
- Compiled all eighteen structured `/for/*` routes into complete locale-specific content and renderer-chrome artifacts.
- Closed 639 genuine translation gaps and imported 91 strict-parity replacements for objectively defective approved values.
- Preserved the existing anxiety proof and locale-specific crisis guidance through the generic structured compiler, removing the runtime anxiety-only branch.
- Localized remaining video, holiday-session, application CTA, timer, and contextual-link chrome without changing English content or design.
- Advanced all nineteen family routes to `preview` for all five translated locales. No route advanced to `cutover-ready`, and production remains on `proxy`.
- Created a measured route-family delegation playbook, batch map, isolated Grok CLI controllers, raw-output acceptance rules, and a deterministic replacement importer.

Translation and process evidence:

- The structured compiler reports 18 routes, 90 publishable locale-route pairs, and zero unresolved values.
- The hub resolves 50 of 50 fields in every locale with zero unresolved values.
- Grok Fast completed the 38-cell athletes pilot; output-only Grok Composer completed 455 cells across eleven ordinary routes; Grok 4.5 completed and independently reviewed 146 safety-sensitive cells across five routes.
- Composer's edit-oriented CLI trials accepted zero cells and remained isolated. The measured playbook now routes Composer to one tool-free output contract per route and reserves isolated staged editing plus independent review for Grok 4.5.
- The strong catalog audit proposed 91 objective replacements across sixteen routes. All 91 pass source binding, current-catalog binding, numeric, link, markup, and compiler checks.
- Generated runtime bundles contain values only. Catalog evidence, source paths, hashes, reasons, provenance, and Grok process captures remain outside runtime payloads.

Validation evidence:

- The integrated route, renderer, manifest, hub, compiler, and server-chrome suite passes 42 of 42 tests. TypeScript, targeted ESLint, and `git diff --check` pass.
- The complete native-i18n suite passes 112 of 112 tests after regenerating the expected stale inventory caused by route relocation.
- A production-equivalent `native-preview` build completed successfully and generated 273 static pages. The localized catch-all reports 170 KB first-load JavaScript.
- The post-build verifier passed all 185 admitted localized HTML artifacts with correct BCP 47 language, localized title, self-canonical, seven alternates, route coverage, no Next error document, and no legacy proxy global.
- Representative hydrated checks passed on the Spanish hub and use-case routes in Portuguese, Japanese, French, Spanish, and German, plus a Japanese `/breathe` regression route.
- Admitted family links remained localized. Routes outside native preview intentionally fell back to working English URLs. Unadmitted `/es/holiday-breathing-exercises` returned 404.

Blockers and risks:

- A configured Vercel preview, authenticated-flow check, and complete desktop, mobile, crawler, accessibility, screenshot, share, video, timer, and interactive-pacer matrix remain pending.
- The post-build local browser server was started without the repository's Better Auth environment, so auth-secret warnings make this a translation/routing/hydration check rather than an authenticated-flow check.
- Broader terminology, content-quality, claim, keyword, and SEO review remains intentionally separate so later improvements can be measured against the migration baseline.
- No sitemap, Cloudflare route, deployment, commit, production environment, or external service state changed.

Next:

- Retain both structured families in `preview` and run the expanded matrix in a configured Vercel preview.
- Continue Phase 4 with the next bespoke or application route family under the same deterministic and fail-closed controls.
- Keep content improvements and new-language research out of the serving-path migration until the native foundation is complete.

## 2026-07-15: Hosted native preview passes the admitted route matrix

Status: Complete for the configured hosted-preview checkpoint; the full migration remains in progress

What changed:

- Committed and pushed the native-preview foundation and both structured route families on `codex/native-i18n` at commit `7302e5ebde1fdf8e74e5963e496b800d6566d8ae`.
- Scoped `NATIVE_I18N_MODE`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` to the Vercel Preview environment for the `codex/native-i18n` branch only. Production settings and routing remain unchanged.
- Created a successful Vercel preview deployment and retained the stable branch alias for repeatable review.
- Ran the complete admitted hosted server matrix and representative hydrated browser checks across all five translated locales.
- Ran a focused 390 by 844 mobile check on Japanese Ujjayi without changing application state.

Evidence:

- Stable branch preview: `https://deepbreathing-tmmj-git-codex-native-i18n-darkmatterai.vercel.app`.
- Immutable deployment: `https://deepbreathing-tmmj-pt9tz5xnh-darkmatterai.vercel.app`, deployment ID `dpl_DnKYw1FxLZm1JbiZqgPgpbwrTx2n`.
- The hosted build generated 273 of 273 static pages. Compiler output remained at 70 of 70 `/breathe` pairs, 90 of 90 `/for` pairs, 91 reviewed replacements, and zero unresolved values.
- The hosted server matrix passed all 185 admitted locale-route pairs. Every pair returned 200 with the expected BCP 47 `lang`, localized title, self-canonical production URL, seven hreflang alternates, no Next error document, no legacy `__MT_CONFIG__`, and no unintended standalone US `988` value. Unadmitted `/es/holiday-breathing-exercises` returned 404.
- Hydrated browser checks passed on the Spanish `/for` hub, localized client navigation to `/es/for/public-speaking`, and representative Portuguese, French, German, Japanese, and Spanish routes. Runtime locale, localized metadata and content, canonical, and alternate links remained stable with no browser console errors.
- At 390 by 844, Japanese `/ja/breathe/ujjayi` had a 390-pixel document width, no horizontal overflow, visible localized navigation, settings, duration, share, and start controls, the correct `ja-JP` document language and `ja` runtime locale, and no browser console errors.

Blockers and risks:

- The Preview environment intentionally has no Google OAuth credentials. Authenticated social-login behavior was not changed or validated by this checkpoint.
- The preview deployment's existing `postbuild` hook submitted the unchanged 337-URL production sitemap to IndexNow with status 200. This is a deployment-safety defect in the existing pipeline, not a native translation regression. It must be fixed as a separate narrow change before another preview deployment.
- Full accessibility, audio, share-target, video, timer-session, and interactive-pacer behavior still require dedicated QA before production admission.
- No route is `cutover-ready`. Production remains on the MassTranslate proxy and no production environment, DNS, Cloudflare route, sitemap, or alias changed.

Next:

- Review and approve a narrow preview-only guard that prevents IndexNow submission outside production.
- Continue Phase 4 with the next bespoke or application route family after that deployment-safety decision.
- Keep translation-content improvements, keyword research, and new-language work separate from migration parity.

## 2026-07-15: Preview IndexNow guard and remaining-page batch map prepared

Status: Complete for deployment safety and launch preparation; no Grok translation worker has been launched

What changed:

- Changed the sitemap submission entrypoint to fail closed unless the build has both `VERCEL=1` and `VERCEL_ENV=production`.
- Preserved the existing IndexNow submission workflow for Vercel production builds while making Preview, Development, generic CI, and local postbuild runs skip before any network request.
- Added a machine-readable and human-readable batch map for all 19 intended static translated routes not yet admitted to native preview.
- Partitioned the remaining work into four integration waves and three future Grok translation batches with exclusive route ownership and risk-based model routing.
- Recorded a separate strong catalog-audit lane for approved-value fidelity review after compiler source binding.

Evidence:

- `node --test scripts/tests/ping-sitemap.test.mjs` passes 4 of 4 tests, including the production-only environment boundary.
- `CI=1 VERCEL=1 VERCEL_ENV=preview node scripts/ping-sitemap.mjs` logs `Skipping sitemap ping; production deployment not detected.` and performs no submission.
- `node --experimental-strip-types --test scripts/tests/native-i18n-remaining-pages-batch-map.test.mjs` passes 3 of 3 tests.
- The batch-map test proves that exactly 19 intended static routes remain, every route has one integration-wave owner, every route with raw catalog gaps has one Grok translation owner, and all counts reconcile with the preserved catalog manifest.
- The remaining catalog baseline is 1,463 route segments and 366 untranslated locale cells across 95 locale-route pairs. Eleven routes have no raw catalog gap; eight routes contain all 366 gaps.
- Grok Build `0.2.101` is authenticated with `grok-composer-2.5-fast` and `grok-4.5` available.

Blockers and risks:

- The 366 cells are raw catalog gaps, not executable assignments. Each integration wave must first emit source-bound compiler contracts; current-source drift, composition, deduplication, and shared chrome can change final counts.
- The output-only controller cannot be adapted safely until the first remaining-page contract schema exists.
- No Grok worker may edit application routes, compilers, renderers, generated output, manifests, tests, or documentation.
- The local guard and batch-map changes are not yet committed or deployed. Another preview should not run until the guard is included in the deployed commit.

Next:

- Extract the shared typed contract for the four zero-gap duration pages in `R-W01` and use it to establish the remaining-page compiler schema.
- Refresh Grok assignment counts from compiler-emitted manual contracts, then adapt the proven output-only controller.
- Launch only the exact prepared route jobs after focused validators pass; keep content improvements and production cutover out of scope.

## 2026-07-15: Remaining-page translation gaps closed under output-only Grok controls

Status: Complete for source-bound missing-translation inputs; runtime integration remains pending

What changed:

- Added a deterministic remaining-page gap compiler that joins all five preserved locale artifacts by page placement, verifies the catalog baseline, hashes the current English source, preserves existing approved values, and emits eight route-scoped repository contracts.
- Added tested output-only translation and independent-review controllers with explicit prepare, run, validate, and merge boundaries.
- Kept every Grok process outside the repository with one turn, strict sandboxing, no tools, no web, no memory, no subagents, and schema-constrained JSON output.
- Filled every one of the 366 raw catalog gaps without editing application routes, runtime bundles, route manifests, publication state, English source, or existing approved catalog translations.

Translation and review evidence:

- `R-C01` completed 96 cells with Composer. Independent Grok 4.5 review approved 92 and corrected four target-language terminology or UI-naturalness defects.
- `R-R01` completed 115 cells with Grok 4.5. Independent review approved 114 and corrected one Japanese rendering of “journey.”
- `R-R02` completed 155 cells with Grok 4.5. Independent review approved 154 and corrected one German medical-disclaimer grammar defect without changing its safety meaning.
- Across all lanes, 360 of 366 values were approved as returned and six received narrow strict-parity corrections. Zero contract cells remain unresolved.
- The deferred `R-A01` audit of already approved catalog values was not launched, keeping content and translation improvements outside this missing-value milestone.

Validation evidence:

- The gap-contract and two Grok-controller suites pass 8 of 8 tests.
- Deterministic check mode reports eight contracts, 366 catalog-gap cells, and zero unresolved cells.
- Every accepted value passed source-hash, immutable-field, locale-key, null-only mutation, number, link, markup, placeholder, and protected-token checks.
- Compiler reruns preserve reviewed gap values and fail closed on source or existing-catalog drift.

Process learning:

- Full independent review found six correctable language defects even though every first-pass value passed mechanical validation, so review remains valuable while the process is calibrating.
- The 140-cell support review succeeded but took about 220 seconds. Future review-only artifacts above roughly 100 cells should be split by locale when retry isolation or latency matters, without splitting canonical file ownership.
- Catalog placement IDs are suitable for recovery provenance but are not runtime message IDs. Each route compiler must bind these values to stable semantic fields before preview admission.

Next:

- Commit this translation-input milestone before runtime route integration.
- Start `R-W01` duration-page source extraction and prove the reusable typed renderer boundary.
- Keep all 19 routes outside native preview until their typed bundles, loaders, metadata, hydration, and production-equivalent artifact checks pass.
