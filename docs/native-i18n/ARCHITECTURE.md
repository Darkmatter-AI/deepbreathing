# Native internationalization architecture

Status: Accepted and implemented for the proof set plus complete `/breathe` and `/for` families in local native preview  
Date: 2026-07-15  
Production status: unchanged; no route is `cutover-ready`

This document turns the migration decisions into an exact Next.js design. It is the implementation reference for the native route shell, semantic content compiler, bundle loading, and cutover modes.

## Invariants

- English keeps its current unprefixed URLs.
- Localized URLs keep `/es`, `/pt`, `/fr`, `/de`, and `/ja`.
- The browser and crawler receive the same localized server HTML.
- The root document emits the correct `lang` and `dir` before hydration.
- No request-time DOM walking, selector matching, source-text lookup, HTML rewriting, or post-load translation is allowed.
- Long-form content stays in Server Components. Client islands receive only the active shared phrases they need.
- A locale-route pair is native-public only when its semantic bundle is complete and validated.
- The raw MassTranslate snapshot is import provenance, not a runtime dictionary.
- Production remains on the current proxy path until the complete preview matrix passes. Cutover approval was recorded on 2026-07-15, but it does not bypass any gate.

## Route tree

Use two URL-neutral route groups with separate root layouts:

```text
src/app/
├── (site-en)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...existing page-bearing directories
├── (site-localized)/
│   └── [locale]/
│       ├── layout.tsx
│       ├── [[...segments]]/page.tsx
│       ├── stats/page.tsx
│       └── embed/[slug]/page.tsx
├── api/...
├── avatar/...
├── og/...
├── sitemap.xml/route.ts
├── robots.ts
└── globals.css
```

Route groups do not change public URLs. The English group therefore retains `/`, `/breathe/buteyko`, and every other current English path. The localized optional catch-all owns `/es`, `/pt/breathe/buteyko`, and equivalent paths without adding 56 sets of wrapper files.

The localized route validates the first segment against the locale registry and validates the remaining path against the route manifest. Use `dynamicParams = false` for the manifest-backed static matrix so unsupported locale-route combinations return 404 rather than rendering English.

`/stats` remains an explicit localized route because it uses authenticated dynamic behavior. `/embed/[slug]` remains explicit because its parameter contract differs from the static content matrix.

## Root document

The current single `src/app/layout.tsx` hardcodes `<html lang="en">`. A nested locale layout cannot correct a root `<html>` element, and making the root infer locale from request headers would introduce implicit middleware state and risk making static pages dynamic.

Both root layouts will call a shared server-rendered document shell:

```tsx
<SiteDocument htmlLang="en">...</SiteDocument>
<SiteDocument
  htmlLang={resolvedLocale.htmlLang}
  direction={resolvedLocale.direction}
>
  ...
</SiteDocument>
```

The shell owns `<html>`, `<body>`, analytics, theme initialization, authentication context, and other global providers. Crossing between the two root layouts causes a full document navigation. The language switcher should therefore use ordinary anchors for cross-locale changes so the new document starts with the correct language. Same-locale navigation can keep using `Link`.

## Route views

Do not import App Router `page.tsx` modules into the localized dispatcher. Extract reusable views and let thin English wrappers and the localized dispatcher call the same view:

```text
src/features/breathe/pattern-page.tsx
src/features/for/use-case-page.tsx
src/features/routes/<route>/page-view.tsx
```

Each view accepts resolved content and locale explicitly. Metadata builders accept the same inputs. This keeps App Router conventions at the edge and makes English-versus-localized parity testable without request globals.

## Translation data flow

```text
MassTranslate preservation snapshot
    -> one-time semantic compiler
    -> explicit mapping and override files
    -> validated route and shared bundles
    -> literal server-only loader map
    -> shared route view
    -> localized server HTML
```

The preservation catalog has 35,060 locale placements across 295 route files, but its DOM identities are not a stable application contract. Every current placement has an empty `fieldKey` and `elementSelector`. The structured mapping audit also found that exact source matching can safely seed only 2,164 of 2,917 structured content leaves.

The semantic compiler must therefore:

1. Assign a stable repository-owned message ID to each field.
2. Record source text and source hash separately from locale values.
3. Preserve catalog provenance for review without exposing catalog UUIDs to application components.
4. Seed only unambiguous or translation-equivalent catalog matches.
5. Put source misses and conflicting candidates into explicit override work.
6. Validate variables, rich-text slots, links, Unicode, approval state, and completeness.
7. Mark every incomplete locale-route pair as non-publishable.

Stable IDs do not change when English wording changes. Ordered content needs durable identities such as `body.what-it-is`, `faq.control-pause`, and `step.relax-posture`, rather than runtime array indexes or English-derived lookup.

Rich content uses typed slots instead of imported HTML:

```ts
{
  template: "A slow rhythm can {stressStudy}.",
  slots: {
    stressStudy: {
      kind: "link",
      label: "reduce perceived stress in minutes",
      href: "https://example.com/study"
    }
  }
}
```

### Structured route-family bundles

The `/breathe` and `/for` families share the same compiler boundary while retaining separate typed source models and artifact roots. Each compiler emits complete route objects, route-aware server chrome, provenance, unresolved accounting, publication state, literal server-only loaders, and supported locale/slug types. The `/breathe` and `/for` hubs remain bespoke typed bundles because their page shapes differ from the structured detail models.

The `/for` compiler preserves the earlier anxiety proof through its generic route contract and applies route-scoped manual values or reviewed replacements before catalog evidence. Missing translations and defective existing values remain separate artifacts with different review standards. No Grok or other translation worker participates at runtime or in request handling.

### Bespoke route bundles

Bespoke pages use the same fail-closed principles without forcing their copy into the structured breathing or use-case schemas. `/about` establishes the pattern:

- one typed English source object owns metadata, schema labels, visible prose, link slots, and credits;
- an offline route compiler recovers approved route or explicitly selected global catalog values;
- source misses live in complete reviewed overrides;
- locale-specific quality defects can be superseded by narrow reviewed replacements without erasing the original catalog provenance;
- generated locale bundles contain values only and load through literal `server-only` imports;
- the English wrapper and localized route render the same server view;
- linked prose is represented as typed before/label/after slots, never imported HTML.

An explicit localized page is preferred when a bespoke route has a materially different client graph from the shared catch-all. The first `/about` build proved why: catch-all ownership raised its reported first-load JavaScript from roughly 85 KB to 170 KB by sharing the structured breathing route graph. Moving it to `[locale]/about` restored localized parity at roughly 85 KB while preserving the manifest gate.

The compiler requires identical variable and slot sets across locales. Rendering turns slots into React nodes. `dangerouslySetInnerHTML` is not part of the translation system.

## Bundle boundaries

Long-form route bundles are server-only and loaded with an explicit literal import map so the bundler can split by route and locale. Server loaders must not be re-exported from the client-safe `src/i18n/index.ts` module.

The client locale provider contains only:

- the active locale code;
- the active route identity;
- the small phrase table needed by interactive components on that route.

It does not contain the long-form page bundle or all-language phrase tables. `Resonance`, authentication prompts, the language switcher, share behavior, dates, and the embed generator will receive locale state from this provider rather than `window.__MT_CONFIG__` or a post-mount path guess.

## Route manifest

The client-safe route manifest owns route identity and publication state:

```ts
{
  id: "breathe.buteyko",
  path: "/breathe/buteyko",
  kind: "breathing-pattern",
  indexable: true,
  localizedHandler: "catch-all",
  intendedLocales: ["en-US", "es-ES", "pt-BR", "fr-FR", "de-DE", "ja-JP"],
  nativeStatus: {
    "es-ES": "mapping-required",
    "pt-BR": "mapping-required"
  }
}
```

Native status progresses through:

1. `catalog-only`
2. `mapping-required`
3. `semantic-ready`
4. `preview`
5. `cutover-ready`

The manifest controls static parameters, bundle validation, native preview publication, localized links, metadata alternates, sitemap eligibility, and the language switcher. Merely having a catalog or bundle file cannot publish a route.

The catch-all `generateStaticParams` contract emits `{ locale, segments }`, matching `[locale]/[[...segments]]`. Routes whose `localizedHandler` is `explicit`, currently `/stats` and `/embed/[slug]`, are never emitted into that catch-all matrix.

## Serving modes

The current `next.config.js` redirects strip every recognized locale prefix before filesystem routing. Next.js evaluates redirects before route matching, so native locale routes cannot work while those redirects remain unconditional.

Use an explicit build-time mode:

| Mode             | Locale-prefix behavior                                                       | Intended environment                            |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `proxy`          | Keep the current single-prefix stripping rules                               | Existing production path during migration       |
| `native-preview` | Disable proxy stripping; expose only manifest-approved preview pairs         | Dedicated preview validation                    |
| `native`         | Disable proxy stripping; canonicalize malformed double-prefix paths natively | Cutover candidate and production after approval |

In native mode, malformed URLs such as `/de/es/breathe/box` must redirect to one explicitly chosen locale path, for example `/de/breathe/box`, without relying on an upstream prefix already having been removed.

The mode is a temporary migration control. The completed system removes `proxy` mode and the translation-specific redirects.

### Implemented preview boundary

As of 2026-07-15, the build-time mode and App Router gate agree on three fail-closed behaviors:

- `proxy` emits no native localized static parameters and retains the two existing locale-prefix stripping redirects.
- `native-preview` emits only route-locale pairs whose manifest state is `preview` or `cutover-ready`.
- `native` emits only `cutover-ready` pairs. A route that is merely previewable is not served by a native cutover build.

As of 2026-07-15, 37 routes are in `preview` for all five translated locales, producing a manifest-controlled matrix of 185 locale-route pairs. This includes the original proof and bespoke routes plus the complete fifteen-route `/breathe` family and nineteen-route `/for` family.

The localized catch-all recognizes the homepage, both structured hubs, all fourteen `/breathe/*` routes, and all eighteen `/for/*` routes. `/about` and `/4-7-8-breathing-timer` retain explicit localized routes to isolate their bespoke client graphs. Routes not admitted by the manifest return 404.

Malformed double-prefix canonicalization in `native` mode remains a cutover-candidate task. It is not needed to validate the current preview matrix and must be implemented before Gate 5 passes.

### Bespoke timer content

The timer route uses a dedicated offline compiler and literal server-only locale loaders. Its flat semantic source contains 176 route messages per locale, while provenance, reviewed gaps, replacements, and unresolved reports remain build artifacts rather than runtime payload. The same typed object drives visible long-form content, metadata, Article schema, and FAQ schema. Only locale, localized route availability, the mode display name, and shared runtime phrases cross into the `Resonance` client island.

The route is migrated under strict output parity. Existing English claims and schema policy are preserved as the measurement baseline; later content or evidence improvements must be separate experiments rather than hidden inside the serving migration.

### Bespoke homepage content

The homepage uses a dedicated offline compiler with a typed source object, occurrence-specific catalog bindings, reviewed gap overrides, and reviewed fidelity replacements. Each locale resolves 159 server-owned messages with zero unresolved values. Visible FAQ content is the only FAQ text source; the renderer derives FAQ schema from those same values.

English keeps its existing direct `Resonance` import and behavior. The localized catch-all supplies `Resonance` as an isolated client-only island so `useSearchParams` cannot deopt the translated server document. Only locale, localized route availability, and the localized Box mode name cross that boundary. The complete homepage content object, metadata, schema, cards, navigation, and footer remain server-owned.

## Metadata and discovery

Localized metadata is built from the same resolved route bundle and manifest entry as the body:

- self-canonical localized URL;
- reciprocal hreflang only for manifest-published locales;
- English `x-default`;
- localized title, description, Open Graph, Twitter, structured-data text, and internal URLs;
- query parameters excluded from canonical identity while remaining available to interactive tools.

No sitemap, canonical, hreflang, metadata, redirect, or indexability behavior changes until the migration experiment has a recorded baseline and precommitted guardrails in `docs/SEO-EXPERIMENTS.md`.

## Proof set

The first native preview matrix is:

| Route                    | Why it is included                                                         |
| ------------------------ | -------------------------------------------------------------------------- |
| `/`                      | Homepage, shared navigation, primary interactive experience, conversion UI |
| `/breathe/buteyko`       | Structured breathing pattern, long-form content, metadata, structured data |
| `/for/anxiety`           | Structured use-case family and cross-route links                           |
| `/about`                 | Bespoke editorial route                                                    |
| `/4-7-8-breathing-timer` | Client-heavy bespoke timer and query-state behavior                        |

Each route must pass in all five translated locales before the architecture proof is accepted.

## Implementation slices

### Slice 1: Semantic contract and compiler

- Add the route manifest and bundle schemas.
- Compile `/breathe/buteyko` and `/for/anxiety` first.
- Add explicit override work for misses and conflicts.
- Add source-hash, approval, placeholder, rich-slot, determinism, and coverage tests.
- Add server-only literal loaders and a test that runtime code cannot import the preservation catalog.

### Slice 2: Shared renderers and client initialization

- Refactor the structured page families to accept resolved content and locale.
- Seed interactive components with the active phrase table during server render.
- Make dates, share copy, internal links, and language selection locale-explicit.
- Prove the English render remains behaviorally equivalent.

The implemented proof uses `NativeRouteRenderContext` as the single server-renderer input for locale, canonical path, link mode, available localized targets, and route-scoped server chrome. The full long-form route object and server chrome are never passed wholesale to `Resonance` or another client island.

The current typed runtime phrase resolver contains 107 keys for all six locales and accepts the native locale explicitly. Keeping all locale tables in the client module is a transitional proof implementation. Measure the client chunk before expanding coverage and split active-locale delivery if the table becomes material.

### Slice 3: Native route shell

- Move page-bearing routes mechanically under `(site-en)`.
- Add the shared root document and localized root layout.
- Add the manifest-backed catch-all and explicit dynamic exceptions.
- Add the `native-preview` serving mode.
- Add localized metadata for the complete proof set.

### Slice 4 and later

- The `/breathe` and `/for` hubs and all thirty-two structured detail routes are locally preview-integrated.
- Complete bespoke routes and shared UI.
- Make discovery output manifest-driven.
- Remove proxy-specific operations only after preview and production gates pass.

## Required proof

- Existing unprefixed English paths retain their status and behavior.
- There is no public `/en` route.
- Native proof paths build for all five prefixes.
- No-JavaScript HTML contains localized title, body, labels, `lang`, and `dir`.
- Browser and crawler HTML agree.
- No hydration warning or post-load language swap occurs.
- Canonical and reciprocal alternate output is correct.
- Query parameters continue controlling tools without entering canonical URLs.
- Inactive long-form locale content does not enter client chunks.
- Proxy and native malformed-prefix behavior each have explicit tests during migration.

## References

- [Next.js 13 route groups](https://nextjs.org/docs/13/app/building-your-application/routing/route-groups)
- [Next.js 13 dynamic routes](https://nextjs.org/docs/13/app/building-your-application/routing/dynamic-routes)
- [Next.js 13 routing order](https://nextjs.org/docs/13/app/api-reference/next-config-js/rewrites)
