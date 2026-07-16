# Native internationalization roadmap

Started: 2026-07-15  
Planning estimate: 20 to 30 focused engineering days  
Current phase: all four Phase 4 waves are integrated in local `native-preview`; all 19 parent routes, 95 parent locale-route pairs, and 70 localized embed children pass the production-equivalent local proof; zero Phase 4 parent routes remain; production remains in `proxy` mode

This is a living plan. Update checkboxes and the progress log as evidence changes. Estimates are planning ranges, not deadlines.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and gate passed
- `[!]` Blocked or gate failed

## Phase 0: Baseline and guardrails

Goal: establish a reproducible baseline before changing serving behavior.

Deliverables:

- [x] Create the native-i18n objective, roadmap, decision log, and progress log.
- [x] Inventory every currently published locale-route pair.
- [ ] Capture existing English and localized URL behavior, including status, canonical, hreflang, `lang`, title, description, and indexability.
- [x] Record the existing translation catalog counts and any known incomplete pages.
- [~] Identify every repository and infrastructure dependency on MassTranslate.
- [ ] Add or preserve baseline route, sitemap, metadata, and language-switcher tests.
- [ ] Record the exact production proxy configuration and reversal procedure before it changes.
- [x] Define a representative proof set: `/`, `/breathe/buteyko`, `/for/anxiety`, `/about`, and `/4-7-8-breathing-timer`.

Gate 0:

- [x] The public URL inventory is versioned and reproducible.
- [ ] Known baseline defects are distinguished from migration regressions.
- [ ] A production rollback owner and exact routing reversal are documented.
- [x] The proof set covers structured, bespoke, metadata-heavy, and interactive behavior.

## Phase 1: Translation data contract and one-time import

Goal: move all existing translations into deterministic repository-owned bundles without retranslating them.

Deliverables:

- [x] Define the locale registry and public-prefix mapping.
- [~] Define stable message IDs and source hashes.
- [~] Define schemas for shared UI, route content, metadata, structured data, and interpolation placeholders.
- [x] Build a one-time importer for the current MassTranslate catalog or produce an equivalent deterministic export.
- [~] Store imported translations in route-scoped checked-in bundles.
- [~] Reconcile duplicate source segments without losing route context.
- [~] Generate a coverage report by locale and route.
- [x] Flag stale, ambiguous, missing, and malformed translations for review.
- [x] Fill required proof-route catalog misses with owner-approved Luna translations.
- [~] Validate Unicode, rich text, links, variables, numbers, and breathing timing labels.
- [ ] Prove that the bundle build is deterministic from a clean checkout with no network access.

Gate 1:

- [ ] Every currently published locale-route pair maps to a checked-in bundle.
- [ ] Every required message has a stable ID and source hash.
- [ ] Placeholder and schema validation reports zero unexplained failures.
- [ ] Re-running the import produces no unexplained diff.
- [ ] No production runtime secret or MassTranslate request is required to consume the bundles.

Rollback:

- This phase does not change production routing.
- Imported files can be reverted independently from application changes.
- Keep the raw one-time export or a reproducible import artifact until the full migration is accepted.

## Phase 2: Native routing and rendering proof

Goal: prove the architecture on a small representative route set while production remains on the existing path.

Deliverables:

- [x] Add native locale route handling for supported public prefixes. The original five-route proof set works for all five prefixes in `native-preview`; Phase 3 has since expanded preview admission to the complete `/breathe` family, while unapproved pairs still fail closed.
- [x] Preserve all unprefixed English URLs through a URL-neutral `(site-en)` route group.
- [x] Load proof-route long-form content on the server through literal route-locale imports.
- [x] Pass locale-explicit localized values into the proof routes' client components during hydration.
- [x] Implement preview and cutover publication from the shared route manifest.
- [x] Render localized metadata, Open Graph data, canonical, hreflang, and structured data for all five proof routes.
- [x] Make the proof set work in local development and a normal Vercel preview. The five-route matrix passes locally and is included in the successful 185-pair hosted server matrix.
- [~] Add automated parity and hydration tests for the proof set. Static contracts and production HTML verification pass for all 25 pairs, and hydrated browser checks pass on representative structured, timer, and homepage routes; the full browser matrix remains.
- [x] Compile complete route-scoped content objects for `/breathe/buteyko` and `/for/anxiety` with no runtime text matching.
- [x] Add a post-build verifier for the 25 admitted production HTML artifacts and the fail-closed route boundary.
- [x] Audit `/4-7-8-breathing-timer` source reuse, catalog recovery, translation defects, medical/editorial claims, and admission gates in `TIMER-AUDIT.md`.
- [x] Admit `/4-7-8-breathing-timer` under the strict parity decision in ADR-016, with German count semantics and objectively corrupted Japanese values replaced.
- [x] Audit homepage catalog coverage and pin its server/client ownership boundary in `HOMEPAGE-AUDIT.md`.
- [x] Extract and admit the homepage as the final five-locale proof route under ADR-016 strict parity.

Gate 2:

- [x] A no-JavaScript response contains the intended localized body and metadata. Proven locally for all 25 admitted route-locale pairs.
- [~] Browser and crawler user agents receive equivalent localized content. All 185 admitted hosted server responses pass the metadata and body-artifact contract, and representative hydrated browser checks pass across all five translated locales; a dedicated crawler user-agent sweep remains.
- [~] No hydration mismatch or post-load language swap occurs. Representative proof and structured routes across all five translated locales completed hydration with stable title, `lang`, content, and chrome and no browser console error; the full interactive matrix remains.
- [~] Existing public paths, query behavior, and English routes remain stable. Local proxy and English status checks pass; production-equivalent crawl remains.
- [x] The admitted proof routes render without access to MassTranslate.
- [x] Performance is within the agreed local guardrail relative to English pages. `/about` is 85.3 KB versus 85.1 KB English, the localized timer exactly matches English at 167 KB, and the shared localized catch-all is 170 KB versus the 167 KB English homepage.

Rollback:

- Keep the proof path limited to preview or an explicitly gated code path.
- Disable the native route gate to return all production traffic to the existing proxy path.

## Phase 3: Structured route families

Goal: migrate the shared content models that cover most editorial pages.

Deliverables:

- [x] Migrate `/breathe` and all `/breathe/*` pages into deterministic bundles, shared renderers, literal server loaders, and manifest-controlled local preview.
- [x] Migrate `/for` and all `/for/*` pages into deterministic bundles, reviewed inputs, shared renderers, literal server loaders, and manifest-controlled local preview.
- [x] Localize shared pattern/use-case sections, citations, warnings, FAQs, calls to action, and structured data for both structured families.
- [~] Localize the common breathing experience and its client-side controls. Route chrome and locale-explicit runtime phrases are integrated for both structured families; hosted hydration and mobile layout checks pass, while the full interactive browser matrix remains pending.
- [~] Add route-family coverage, metadata, and screenshot tests. Compiler, manifest, route-shell, renderer, hosted production-build, complete 185-pair server matrix, and representative hydrated-browser checks pass; screenshot coverage remains pending.

Gate 3:

- [x] Every locally previewed structured route passes bundle coverage checks in all five existing locales: `/breathe` 70 of 70 and `/for` 90 of 90, plus ten complete hub bundles.
- [~] Route-family HTML contains no unintended English fallback. The post-build verifier accepts all 185 admitted localized artifacts and representative hydrated checks pass; the complete browser and crawler matrix remains pending.
- [~] Internal links stay in the selected locale when a localized target is previewed and intentionally fall back to English otherwise. Manifest behavior, built artifacts, and representative checks across all five locales pass; the family crawl remains pending.
- [~] Health and safety language matches the imported approved translations. Strict-parity review, compiler safety checks, strong review of the `/for` safety lane, and rendered artifact verification pass; broader editorial review remains out of scope.

Rollback:

- Route-family publication remains manifest-controlled.
- A failing family can be removed from the native preview without affecting other completed families.

## Phase 4: Bespoke routes and shared application UI

Goal: complete native coverage for the remaining public site.

Deliverables:

- [x] Migrate bespoke timer, visualizer, application, exercise, informational, and support pages. All 19 Phase 4 parent routes are integrated for all five translated locales. Source-bound contracts preserve all 366 previously missing catalog cells with zero unresolved values, and the embed family adds 70 explicit localized noindex children.
- [ ] Migrate navigation, footer, settings, authentication, session completion, and error-state phrases.
- [ ] Replace `window.__MT_CONFIG__` locale inference with repository-owned locale state.
- [ ] Reconcile the existing runtime phrase table with the new shared bundle.
- [ ] Localize route-specific Open Graph images without scraping production.
- [ ] Define intentional English-only routes in the route manifest.
- [~] Test every route across desktop, mobile, JavaScript-disabled, and hydrated states. The final production-equivalent build generated 433 pages; all 275 admitted static localized artifacts, all 95 Phase 4 live parent responses, and all 70 localized embed children pass. Representative hydrated checks cover every Phase 4 route class and all five translated locales; the complete hosted, mobile, accessibility, crawler, authenticated, and interactive matrices remain pending.

Gate 4:

- [~] All currently published localized routes have native parity. The complete local static artifact set and dynamic stats matrix pass; expanded hosted-preview and final production-equivalent crawl evidence remain pending.
- [ ] No code path depends on DOM text replacement or `window.__MT_CONFIG__`.
- [~] No public localized route silently falls back to English. Deterministic coverage checks and the 275-artifact local verifier pass; full hosted browser and crawler evidence remains pending.
- [ ] All user-visible shared UI strings use the native bundle contract.

Rollback:

- Continue serving production through the existing proxy until the complete native route sweep passes.
- Preserve the last-known-good imported bundle set as a rollback artifact.

## Phase 5: SEO and discovery parity

Goal: make the native route manifest the single source of truth for all public search surfaces.

Deliverables:

- [ ] Generate sitemap URLs only for validated, published locale-route pairs.
- [ ] Generate reciprocal hreflang sets from the same route manifest.
- [ ] Generate self-canonicals and `x-default` consistently.
- [ ] Set native HTML `lang` and direction values.
- [ ] Make the language switcher server-renderable and proxy-independent.
- [ ] Preserve existing locale URLs and redirect behavior without proxy strip/re-add assumptions.
- [ ] Validate query-string canonical behavior.
- [ ] Generate localized Open Graph and social metadata from checked-in content.
- [ ] Update `docs/SEO-EXPERIMENTS.md` with baseline, guardrails, and a measure-after date before production changes.
- [x] Prevent non-production deployments from submitting the production sitemap to IndexNow. The first configured native preview exposed the old broad CI gate; the hook now requires `VERCEL=1` and `VERCEL_ENV=production`, with focused production, preview, development, generic-CI, and local tests.

Gate 5:

- [ ] Every alternate is reciprocal, indexable, and self-canonical.
- [ ] No noindex or unpublished route appears in the sitemap or hreflang.
- [ ] Sitemap and route-manifest tests pass from a clean build.
- [ ] A crawl of the native preview reports no migration-created canonical, hreflang, redirect, or broken-link errors.
- [ ] The indexed URL baseline and regression thresholds are pre-committed in the SEO experiment log.

Rollback:

- Snapshot the production sitemap and alternate output before cutover.
- If routing is rolled back, restore the pre-cutover sitemap behavior with the same deployment.

## Phase 6: Proxy-independent operations

Goal: remove translation-specific operational workarounds once native serving has proven parity.

Deliverables:

- [ ] Remove the locale cache warmer and its cron if no non-translation use remains.
- [ ] Remove production scraping from the localized Open Graph build.
- [ ] Remove double-locale rules that exist only because the proxy strips prefixes, while preserving redirects needed for already-discovered bad URLs.
- [ ] Remove client-side link-rewrite defenses and proxy-only English-route exclusions.
- [ ] Repoint signed webhooks to the canonical host only after signature verification succeeds through the native path.
- [ ] Remove MassTranslate configuration, credentials, environment variables, headers, and monitoring dependencies.
- [ ] Update the tools and data-source runbook to describe the native system.
- [ ] Preserve direct GSC, Bing, IndexNow, and analytics workflows that are independent of translation serving.

Gate 6:

- [ ] A dependency scan finds no runtime, build, deploy, or content-authoring call to MassTranslate.
- [ ] Signed webhooks and API routes work through the intended production hostname.
- [ ] Locale page performance no longer depends on a translation cache warm.
- [ ] Operations documentation no longer instructs maintainers to use the proxy for current behavior.

Rollback:

- Defer destructive external cleanup until the post-cutover observation window ends.
- Keep an export of prior Worker routing and configuration so traffic can be restored if necessary.

## Phase 7: Production cutover

Goal: move the apex locale traffic to native rendering without changing public URLs.

Owner authorization: granted on 2026-07-15. The authorization becomes actionable only after the gates below pass and does not replace any validation or rollback requirement.

Deliverables:

- [~] Run the complete automated route and metadata matrix against a production-equivalent preview. The last hosted checkpoint passes its earlier 185 admitted locale-route pairs. The final local production-equivalent baseline passes all 275 static localized artifacts, all five dynamic localized stats routes, all 95 Phase 4 parent responses, and all 70 localized embed children. The expanded set must still join a configured hosted matrix before cutover.
- [ ] Run focused browser QA for all route families and locales.
- [ ] Capture pre-cutover GSC indexing, search performance, Bing performance, crawl health, page speed, and error baselines.
- [ ] Freeze unrelated routing and sitemap work during cutover.
- [ ] Change the edge routing so locale requests reach Next.js natively.
- [ ] Verify the production URL matrix immediately after cutover.
- [ ] Monitor errors, latency, hydration, indexing, canonicals, and crawler behavior through the observation window.

Gate 7:

- [ ] All representative and high-traffic localized URLs return correct native HTML in production.
- [ ] Error rate and latency stay within the agreed baseline guardrails.
- [ ] No sitemap, canonical, hreflang, or redirect regression appears in the post-cutover crawl.
- [ ] GSC indexed translated pages remain above the pre-committed floor.
- [ ] Product funnel guardrails show no material localized-session regression.
- [ ] The observation window completes before the old proxy is decommissioned.

Production rollback procedure:

1. Route locale-prefixed traffic back through the recorded MassTranslate Worker configuration.
2. Restore the last pre-cutover application deployment if the regression is application-side.
3. Restore the pre-cutover sitemap output if discovery metadata changed.
4. Verify at least one home, structured, bespoke, and interactive route for every locale.
5. Record the trigger, evidence, and outcome in `PROGRESS.md` and the relevant experiment log.
6. Do not resume cutover until the failed gate has a reproducible fix.

Rollback triggers include:

- Widespread 4xx or 5xx responses on existing locale URLs.
- Incorrect canonicals or hreflang on published pages.
- Unintended English body content on native localized routes.
- Hydration failures or broken breathing-session controls.
- Material crawler timeout or indexing regression beyond the pre-committed threshold.
- Signed webhook or critical API failures caused by the routing change.

## Phase 8: Closeout and future language readiness

Goal: finish the migration cleanly and make future locale work ordinary repository work.

Deliverables:

- [ ] Remove the inactive MassTranslate serving path after the observation window.
- [ ] Archive the one-time import artifacts needed for provenance, and remove secrets.
- [ ] Mark obsolete proxy gotchas as historical in canonical docs.
- [ ] Document the manual workflow for editing, validating, reviewing, and publishing translation bundles.
- [ ] Add a language checklist that starts from the native route manifest.
- [ ] Re-estimate the cost of adding Italian or another language using the completed native system.
- [ ] Close the migration with final search, performance, reliability, and maintenance evidence.

Gate 8:

- [ ] The definition of done in `README.md` is satisfied.
- [ ] No unresolved blocker remains hidden in the progress log.
- [ ] A contributor can update an existing translation from a clean checkout without external translation infrastructure.
- [ ] A future locale can be added without introducing a new request-path service.

## Cross-phase validation matrix

Every release candidate should cover:

| Surface       | Required evidence                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Routing       | Existing English and locale URLs retain expected status and destination                          |
| Server HTML   | Intended language present without JavaScript                                                     |
| Hydration     | No mismatch, no language flash, controls remain functional                                       |
| Content       | No missing required messages, placeholders, or accidental English fallback                       |
| SEO           | Correct title, description, canonical, hreflang, `lang`, structured data, and sitemap membership |
| Links         | Internal and language-switcher links resolve without double locale prefixes                      |
| Performance   | Native locale latency and page weight stay within agreed guardrails                              |
| Accessibility | Localized labels, names, and controls remain usable                                              |
| Operations    | Webhooks, APIs, analytics, GSC, Bing, and IndexNow continue working                              |
| Rollback      | The previous serving path and application release can be restored                                |

## Known risks

| Risk                                                         | Mitigation                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| DOM placements do not map cleanly to semantic messages       | Preserve route context during import and review ambiguous mappings instead of guessing                 |
| Imported catalog contains stale or partial translation       | Generate source-hash and coverage reports; fail closed for publication                                 |
| One monolithic dictionary bloats client bundles              | Load long-form content by route on the server; keep only small shared UI data client-visible           |
| URL migration causes indexing churn                          | Preserve paths, stage sitemap changes, baseline GSC, and use explicit guardrails                       |
| Refactoring all routes at once creates an unsafe diff        | Migrate proof routes, shared families, then bespoke routes behind manifest-controlled publication      |
| Proxy removal breaks unrelated edge behavior                 | Inventory headers, redirects, webhooks, analytics, and CDN behavior before cutover                     |
| Last-known-good translation disappears after an English edit | Retain the approved checked-in locale bundle and mark it stale; never replace it with English silently |
| Old malformed locale URLs remain in search indexes           | Keep proven redirects until crawl evidence shows they are no longer needed                             |

## Open implementation questions

These remain unresolved after the foundation spike:

- How much of the English source should move into the same message schema during the first pass.
- How the preserved raw export should be transformed into the final all-route runtime bundles without losing provenance.
- The exact Vercel `native-preview` deployment wiring and side-by-side comparison workflow. Local serving-mode wiring is implemented and tested.
- The duration and exact thresholds of the production observation window.

Resolved implementation choices are recorded in `DECISIONS.md`; proof-route runtime content uses generated, checked-in JSON loaded through a typed server-only boundary.

Record resolutions in `DECISIONS.md` before relying on them broadly.
