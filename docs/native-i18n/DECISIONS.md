# Native internationalization decisions

This file records durable architectural decisions. Do not silently reverse an accepted decision. Add a superseding ADR with evidence and update the roadmap.

## ADR-001: The repository is the translation source of truth

Status: Accepted  
Date: 2026-07-15

### Context

Translations currently live primarily outside the application repository. That separates the deployed application from the content needed to reproduce it and makes local development, previews, review, rollback, and debugging dependent on external state.

### Decision

All English and localized content required to build public pages will live in this repository. Translation changes will be reviewed, versioned, and deployed through Git like other product content.

MassTranslate may be read once to import the existing approved catalog during migration. It is not an ongoing source of truth after the import is accepted.

### Consequences

- A clean checkout can reproduce localized pages.
- Translation diffs and rollbacks become inspectable.
- Repository size increases.
- Content updates require an explicit repository workflow.
- Provenance and source hashes must be retained so stale translations are detectable.

## ADR-002: MassTranslate will not participate in runtime, build, or future translation work

Status: Accepted  
Date: 2026-07-15

### Context

The reverse proxy was valuable for dogfooding MassTranslate, but it adds request-path complexity and has produced browser/crawler divergence, hydration errors, cache warming, link-rewrite edge cases, metadata workarounds, and signed-request exceptions. MassTranslate will not produce future translations for this site.

### Decision

The completed system will make no MassTranslate request at runtime, during builds, during deployments, or when authoring future translations.

A temporary, one-time import script is permitted during migration. It must produce deterministic checked-in files and must not be required after the imported data is accepted.

### Consequences

- The application has one localized rendering path.
- Production availability no longer depends on the translation proxy or its cache.
- Proxy-specific workarounds can be retired after cutover.
- The migration must capture every required existing translation before the old source is decommissioned.
- A separate repository-native process will be needed for future translation work.

## ADR-003: Preserve the current public URL contract

Status: Accepted  
Date: 2026-07-15

### Context

Existing localized pages are indexed and earn traffic. Changing paths while changing the rendering system would create unnecessary redirect, canonical, hreflang, analytics, and attribution risk.

### Decision

English remains unprefixed. Existing locale prefixes remain `/es`, `/pt`, `/fr`, `/de`, and `/ja`. Existing page slugs and route shapes remain unchanged during this migration.

Native routing must adapt to the current public contract. The public contract will not be changed to simplify implementation.

### Consequences

- Search engines and users keep the same URLs.
- Migration regressions are easier to isolate from URL churn.
- The App Router implementation must support both unprefixed English and prefixed locales.
- Historical malformed locale URLs may continue to require redirects even after their original proxy cause is gone.

## ADR-004: Use checked-in route-scoped bundles

Status: Accepted  
Date: 2026-07-15

### Context

The site contains long editorial pages as well as a small shared interactive vocabulary. Loading an entire language catalog for every route would increase server work and risk shipping unnecessary content to the browser. Keeping translation strings colocated only inside components would make coverage and publication difficult to validate globally.

### Decision

Long-form and route-specific content will be stored in checked-in bundles scoped to a stable route identity and locale. Reusable application phrases will live in a separate small shared bundle.

Bundles must be schema-valid, deterministic, and loadable without a network request. Route-scoped content should remain server-only unless a client component specifically needs a value.

The exact serialization format remains open until the foundation phase, but the route boundary does not.

### Consequences

- Pages load only the translation data they need.
- Route coverage and staleness can be reported precisely.
- Shared strings need an explicit ownership rule to avoid duplication.
- Bundle schemas and generated types become part of the application contract.
- Cross-route copy changes may touch more than one bundle when the content is intentionally route-specific.

## ADR-005: Published localized routes fail closed

Status: Accepted  
Date: 2026-07-15

### Context

Silent English fallback produced half-English pages in the current system. Those pages are difficult to detect, create a poor product experience, and can send contradictory relevance signals to search engines.

### Decision

A locale-route pair is publishable only when all required content and metadata pass validation. Missing, malformed, or unapproved required translations must fail the build or keep that route out of native publication, the sitemap, hreflang, and language-switcher targets.

Once a route is public, an English source edit does not erase its last-known-good translation. The checked-in translation remains available but is marked stale until reviewed. If the last-known-good bundle itself is invalid, the release must stop rather than silently render English.

### Consequences

- Public localized pages cannot degrade invisibly into mixed-language pages.
- Coverage validation is a release requirement.
- Publication state must be explicit in the route manifest.
- A complete import is required before switching existing indexed URLs to native serving.
- Emergency handling uses the last-known-good localized bundle or a release rollback, not English fallback.

## ADR-006: Use stable semantic message IDs and source hashes

Status: Accepted  
Date: 2026-07-15

### Context

The proxy currently matches English source text and DOM placement. Ordinary copy changes can therefore break translation matching even when the meaning and page structure are unchanged.

### Decision

Each translatable unit will have a stable semantic ID that is not derived from its literal English text. Its record will include a hash of the current English source and enough route or component context to review it safely.

IDs stay stable across wording changes when meaning and usage remain the same. A source change updates the hash and marks locale values stale. Meaning changes may require a new ID.

### Consequences

- English wording can evolve without losing translation identity.
- Staleness becomes machine-detectable.
- Naming and ID review require discipline.
- The one-time import needs a mapping layer from DOM placements and source strings to semantic IDs.

## ADR-007: Render localized content on the server and hydrate from the same data

Status: Accepted  
Date: 2026-07-15

### Context

The current browser path renders English first and mutates the page after load. That creates a language flash, hydration errors, and different observable content for browsers and crawlers.

### Decision

Next.js will select the locale and route bundle before rendering. Server Components will render long-form localized HTML. Client Components will receive the same resolved localized values in their initial props or locale context.

There will be no post-render DOM translation pass.

### Consequences

- Browser, no-JavaScript, preview, and crawler behavior converge.
- Hydration no longer races a translation mutation.
- Client bundle size must be protected by keeping long-form dictionaries on the server.
- Locale selection becomes normal application state rather than proxy-injected global state.

## ADR-008: One route manifest controls publication and discovery

Status: Accepted  
Date: 2026-07-15

### Context

Route existence, sitemap inclusion, hreflang, language-switcher links, and proxy exclusions are currently maintained in multiple places. Drift between them has created double-locale links, noindex sitemap entries, and canonical inconsistencies.

### Decision

A repository-owned route manifest will define the canonical English route, stable route identity, intended locale availability, and required bundle schema.

Static generation, sitemap output, hreflang, the language switcher, coverage reports, and route validation will consume that same manifest.

### Consequences

- A published route cannot accidentally be absent from discovery surfaces or advertised before it is ready.
- English-only routes become explicit.
- The manifest becomes a critical tested artifact.
- Dynamic route families need a clear way to contribute entries without bypassing validation.

## ADR-009: Migrate and cut over in stages

Status: Accepted  
Date: 2026-07-15

### Context

The translation surface spans structured editorial templates, bespoke tool pages, shared client UI, metadata, links, sitemap behavior, and edge operations. A single unvalidated cutover would make regressions difficult to isolate.

### Decision

Implementation proceeds through a representative proof set, structured route families, bespoke routes, SEO parity, operational cleanup, and only then production cutover. Production remains on the existing serving path until the complete native matrix passes its gates.

The old external route is retained as a rollback option through the post-cutover observation window.

### Consequences

- Review and debugging remain bounded.
- Temporary duplication exists during migration.
- The route manifest and feature gating must support side-by-side validation.
- Destructive proxy cleanup happens last.

## ADR-010: Preserve the raw catalog separately from semantic runtime bundles

Status: Accepted  
Date: 2026-07-15

### Context

The only complete copy of the existing translations was the MassTranslate production catalog. Its records contain useful provenance, source hashes, DOM occurrence keys, context keys, approval state, and some translations no longer attached to current pages. That data is necessary to prove that nothing was lost, but DOM placements are not a maintainable application message contract and the full preservation snapshot is too verbose to ship to clients.

### Decision

Keep a deterministic, compact, route-scoped preservation snapshot and its read-only exporter in the repository. Preserve every translation record, including orphaned records, with per-file and whole-catalog checksums.

Treat that snapshot as immutable import evidence. Build a separate semantic mapping and minimal runtime bundle layer from it. Application code will consume typed semantic IDs and route-scoped values, not DOM selectors, catalog UUIDs, or a source-text replacement pass. Long-form bundles stay server-only, and client components receive only the phrases they need.

### Consequences

- The migration can prove complete recovery of the external catalog before the service is retired.
- Historical and orphaned translations remain available for reconciliation.
- The repository carries a one-time preservation artifact in addition to the smaller runtime bundles.
- Native implementation still requires an explicit mapping step; importing the raw snapshot alone does not make a route publishable.
- Runtime behavior cannot silently recreate the old proxy by applying DOM or source-text replacements after render.

## ADR-011: Use separate English and localized root layouts

Status: Accepted  
Date: 2026-07-15

### Context

Native pages need the correct `<html lang>` in server output. The existing top-level layout hardcodes English, and a nested locale layout cannot replace the parent document element. Inferring locale through middleware headers would introduce implicit request state and can make otherwise static routes dynamic.

### Decision

Move page-bearing English routes into a URL-neutral `(site-en)` route group with an English root layout. Add a `(site-localized)/[locale]` route group with a locale-aware root layout and manifest-backed optional catch-all. Both roots use one shared document shell.

Cross-locale language changes use full document navigation so the new root document begins in the selected language. Route handlers remain outside the page groups.

### Consequences

- English URLs do not change.
- Localized server HTML has the correct language before hydration.
- Static generation does not require request-header locale inference.
- The page-directory move is mechanically broad and needs route-precedence and English-parity tests.
- Switching languages reloads the document, which is acceptable for an infrequent locale change.

## ADR-012: Use explicit proxy, native-preview, and native serving modes during migration

Status: Accepted  
Date: 2026-07-15

### Context

The current redirect rules remove every locale prefix before filesystem routing because they were written for requests that had already passed through the proxy. Those redirects run before App Router route matching and would intercept all native locale routes.

### Decision

Keep current production behavior under a temporary `proxy` build mode. Add a `native-preview` mode that disables prefix stripping and publishes only manifest-approved proof routes. Add a `native` mode for the complete cutover candidate, with direct malformed-prefix canonicalization.

Remove the temporary mode and proxy-specific redirects after the production observation window passes.

### Consequences

- Native routing can be proven without changing current production traffic.
- Preview and production configurations remain explicit and testable.
- Redirect tests must cover each migration mode.
- A build deployed with the wrong mode would have large routing impact, so mode validation must fail closed.

## Owner authorizations

Recorded: 2026-07-15

### Translation closure

The owner approved Luna, an agent selected for translation work, to supply repository-owned translations for content that cannot be recovered from the preserved MassTranslate catalog. This work must preserve source meaning, medical and safety nuance, placeholders, links, markup, numbers, and product terminology. It is translation closure only, not keyword optimization or a rewrite of the English source.

Automated validation and repository review remain publication requirements. A supplied translation does not advance a locale-route pair by itself; the semantic bundle, route manifest, rendering parity, and preview gates still apply.

### Production cutover

The owner explicitly approved the eventual production cutover. This removes the need for a second owner approval once the documented preview, crawl, performance, external-state, and rollback gates pass. It does not authorize bypassing a failed gate, skipping the production-equivalent preview, or removing the rollback path before the observation window completes.

Permanent external cleanup remains a separate owner checkpoint.

## ADR-013: Compile complete runtime page objects offline

Status: Accepted  
Date: 2026-07-15

### Context

The semantic locale maps intentionally contain only message IDs and translated strings. A renderer also needs the stable route structure, modes, slugs, dates, URLs, citation destinations, media identifiers, and intentionally untranslated keyword fields. Reconstructing that structure from source paths on every request would recreate a generic lookup layer in the runtime and make invalid shapes possible after deployment.

### Decision

Use an offline deterministic compiler to combine the checked-in English structured page blueprint, frozen semantic source paths, and one complete locale message map. The compiler emits one complete checked-in JSON page object for each route-locale pair and a checksum-backed publication artifact.

Source-path mutation is allowed only inside the offline compiler. Application code consumes the completed page object through a typed `server-only` loader with literal route-locale imports. It does not import semantic maps, source hashes, catalog provenance, English source text, or a generic runtime path setter.

The source structured object remains the shape authority during the proof. The compiler validates identical keys, arrays, primitive types, complete message-ID membership, non-empty values, and preservation of routing, date, URL, media, citation, and keyword fields.

### Consequences

- A request loads one complete route-locale object with no DOM pass, source-text lookup, or runtime structural mutation.
- Long-form content remains outside client bundles unless an existing client island receives an individual field.
- Generated JSON duplicates stable structure across locales; the two-route proof occupies approximately 184 KB, which is acceptable but must be watched while scaling route families.
- English source edits still trip reviewed semantic hashes before regenerated localized objects can be accepted.
- Keywords and other intentionally excluded fields remain English until a separate deliberate localization workflow changes their classification.
- Generated artifacts and the compiler are both required for reproducibility; neither MassTranslate nor a runtime secret is required.

Repository-owned reviewed replacements may supersede an otherwise exact approved catalog seed when the literal value is unsafe for the target locale, such as a country-specific crisis number. These replacements stay separate from catalog-gap overrides, name their safety reason, cover every locale explicitly, preserve link and markup structure, and are checksum inputs to the semantic compiler.

## ADR-014: Separate long-form content, server chrome, and interactive phrases

Status: Accepted  
Date: 2026-07-15

### Context

The compiled route objects own long-form editorial content, metadata, and structured route data, but the shared renderers also contain headings, breadcrumbs, calls to action, footer labels, date labels, and safety chrome. Interactive islands need a smaller overlapping set of labels and instructions. Sending one combined route dictionary to the browser would serialize long-form content unnecessarily, while leaving renderer literals or client locale inference in place would preserve proxy-era partial translation and hydration risks.

### Decision

Compile server-rendered chrome into a separate route-scoped semantic bundle with stable IDs. Resolve catalog values offline, require explicit complete overrides for conflicts and misses, and load one route-locale chrome bundle through a literal `server-only` import map.

Pass one `NativeRouteRenderContext` into shared Server Components. It owns locale, canonical path, serving/link mode, the small published-route list used for fail-closed internal links, and the route's server chrome.

Interactive components receive an explicit locale plus only their required values through the existing typed runtime phrase resolver. Proxy detection remains a temporary compatibility fallback for English/proxy routes, not the native route contract.

### Consequences

- Long-form route objects and server chrome stay out of client props and bundles.
- Shared renderers can preserve their existing English wrappers while localized callers provide one coherent context.
- Missing server chrome prevents a route-locale bundle from advancing to preview.
- Internal links remain localized only when their target is available in the active serving mode; otherwise they fall back to a working English URL.
- The current client runtime phrase module still contains every locale in one client-visible table. This is acceptable for the two-route proof but is transitional bundle-size debt; scaling must measure it and split active-locale delivery if needed.

## ADR-015: Give bespoke routes typed content and client-footprint-aware ownership

Status: Accepted  
Date: 2026-07-15

### Context

Bespoke routes do not share the structured breathing or use-case content models. Treating their preserved DOM segments as a runtime dictionary would reintroduce source-text matching and make rich links unsafe. Putting every localized route behind one catch-all also makes routes with little or no client behavior inherit the client references of interactive routes in the same App Router segment.

The first `/about` production build demonstrated both risks. Its Japanese author fragments were individually approved but became ungrammatical when joined around a link. Its first localized catch-all build also reported roughly 170 KB of first-load JavaScript versus roughly 85 KB for English because the segment shared the structured breathing client graph.

### Decision

Represent each bespoke route as one typed source object covering metadata, structured-data labels, visible prose, and typed rich-text slots. Compile complete locale objects offline from exact catalog evidence, complete reviewed overrides for source misses, and narrow reviewed replacements for locale-specific composition or safety defects. Generated runtime bundles contain values only and load through literal `server-only` imports.

Use the shared localized catch-all only when its client graph is appropriate. Give a bespoke route an explicit localized page when doing so materially isolates its client footprint. The route manifest remains the authority for preview and publication in either case.

### Consequences

- Rich links keep React ownership and cannot inject catalog HTML.
- Cross-route catalog recovery is explicit and checksum-backed rather than a runtime global lookup.
- Approved catalog values can be superseded without hiding why or for which locale.
- More explicit localized route files may exist, but only where they protect a real bundle or behavior boundary.
- Build output and client footprint are part of the route-admission evidence, not a post-cutover optimization.

## ADR-016: Preserve content parity before measuring improvements

Status: Accepted  
Date: 2026-07-15

### Context

The migration can also expose weak English claims, poor historical translations, and SEO opportunities. Mixing those changes into the serving migration would make it difficult to distinguish infrastructure effects from content effects after cutover.

### Decision

Treat native migration as a parity baseline. Preserve the current English meaning and recover approved catalog translations wherever they remain semantically faithful. Add new translations only for genuine source gaps. Replace historical target-language values only when they are objectively corrupted, ungrammatical, or change source semantics such as breathing counts into seconds.

Record content, evidence, keyword, and conversion improvements separately for later experiments. Do not silently soften, strengthen, cite, remove, or optimize claims during the migration.

### Consequences

- Search, conversion, and engagement changes after cutover can be attributed more cleanly to serving architecture.
- The repository may temporarily preserve claims already flagged for later editorial review.
- Reviewed gap translations and fidelity replacements must name migration parity, not editorial improvement, as their reason.
- Content experiments start from the native baseline and receive their own measurement window.

## Deferred decisions

The following need evidence from the foundation work before acceptance:

- Exact `native-preview` deployment wiring and side-by-side comparison workflow.
- Production observation duration and numerical rollback thresholds.
- Future manual or automated translation workflow.
- Future keyword-research workflow.
