# `/breathe` family native migration audit

Date: 2026-07-15  
Status: Phase 3 compiler, artifact, renderer, loader, and local manifest-preview integration complete; production admission evidence remains pending

## Scope decision

The `/breathe` family contains 15 routes:

- one bespoke hub at `/breathe`;
- fourteen structured technique routes: `/breathe/4-7-8`, `/breathe/9d-breathwork`, `/breathe/belly`, `/breathe/box`, `/breathe/breath-of-fire`, `/breathe/buteyko`, `/breathe/coherent`, `/breathe/hope-cartel-9d-breathwork`, `/breathe/nadi-shodhana`, `/breathe/physiological-sigh`, `/breathe/pursed-lip`, `/breathe/tummo`, `/breathe/ujjayi`, and `/breathe/wim-hof`.

This migration slice follows ADR-016 strict parity. It preserves the current English meaning, claims, timings, safety qualifications, page structure, destinations, and route behavior. It does not include keyword work, claim improvements, new content, redesign, or unrelated cleanup. Keeping those changes out of the serving-path migration preserves a measurable baseline for later experiments.

## Family compiler boundary

### `/breathe` hub

The hub uses its own typed 42-field source object and deterministic bespoke compiler. The contract covers metadata, breadcrumb text, hero copy, technique-card titles and descriptions, calls to action, and footer text. Each of the five locale bundles resolves the same 42 fields.

The hub compiler supports reviewed occurrence bindings, overrides, and replacements. Each current locale bundle resolves 38 exact catalog values, three normalized values, and one reviewed override; no hub replacement is currently required. Its generated runtime bundles contain values only and load through a literal `server-only` locale map. The hub remains separate from the structured technique compiler because its page shape and renderer ownership differ from the shared pattern-page model.

### Fourteen structured routes

The structured compiler reads the checked-in `breathing-pages.ts` object graph as the shape authority and emits a complete localized object plus renderer chrome for each route-locale pair. It covers 1,438 translatable content values across the fourteen routes.

Structured source paths are build-time bindings. They are used by the offline compiler to place reviewed values into the typed source object; they are not runtime message lookups and do not recreate a source-text replacement layer in production. Every manual value and reviewed replacement pins the English source with a SHA-256 hash. Source drift fails closed until the binding is reviewed again.

This family slice does not claim that every structured field now has a globally stable semantic message ID. Completing stable semantic IDs across every family field remains a Phase 1 contract improvement. The current build-time path contract is deterministic and reviewable, but it is deliberately not presented as completion of that broader gate.

## Catalog audit

The preserved MassTranslate catalogs are used only as offline recovery evidence. They are not a runtime dependency.

| Measure | Count |
|---|---:|
| Structured routes | 14 |
| Literal string leaves | 1,909 |
| Translatable content values | 1,438 |
| Unique exact matches | 1,007 |
| Ambiguous matches | 118 |
| Missing exact matches | 313 |
| Equivalent ambiguities | 100 |
| Conflicting ambiguities | 18 |

The compiler accepts approved route-catalog evidence first, with documented typography normalization where the source is otherwise equivalent. When route evidence is absent, a global catalog match may recover an identical value. Conflicting candidates do not resolve silently. Remaining gaps require repo-owned reviewed input.

Metadata is not selected by a broad source-text match. The structured compiler binds title, description, Open Graph, and Twitter fields to their exact preserved head occurrences. A route-scoped reviewed replacement may override an objectively defective head value, but the replacement must retain the pinned source, current catalog value, and review reason.

## Repo-owned artifact model

The structured family lives under `src/i18n/content/breathe/`:

- `routes/<locale>/<slug>.json` contains the complete localized structured page object;
- `chrome/<locale>/<slug>.json` contains shared renderer labels and route-aware chrome;
- `manual/<slug>.json` contains route-scoped reviewed translations for unresolved content and chrome;
- `manual/_shared.json` deduplicates genuinely shared unresolved renderer chrome;
- `reviewed-replacements/<slug>.json` contains narrow locale-specific repairs of objectively defective approved values;
- `provenance/<slug>.json` records how each emitted value was resolved;
- `unresolved/<slug>.json` records values that remain blocked;
- `publication.json` records route-locale completeness and publishability;
- `server/load-breathe-content.ts` provides the typed server-only loader;
- `types.ts` exports the supported locale and slug contracts.

Manual files are route-scoped so identical English strings in different editorial contexts cannot be joined accidentally. The shared file is limited to renderer messages whose meaning is intentionally identical.

The reviewed replacement set contains 45 objective corrections. These repairs address concrete fidelity defects such as truncation, malformed grammar, reversed breathing instructions, lost timing details, corrupted safety meaning, or injected unrelated keywords. They are not editorial rewrites. Each replacement records its route, locale, source path, source text and hash, current catalog value, replacement, and reason.

## Resolution and runtime contract

For structured content, the compiler resolves values in this order:

1. route-scoped reviewed replacement;
2. route-scoped reviewed manual value;
3. exact metadata head occurrence for metadata fields;
4. preserved proof value for the existing Buteyko proof route;
5. approved route-catalog exact or typography-normalized evidence;
6. approved global-catalog exact or typography-normalized evidence;
7. unresolved `null` plus a publication blocker.

Renderer chrome follows the same fail-closed principle, while reusing already reviewed shared proof chrome where the meaning is identical. Generated runtime bundles do not contain catalog segment IDs, source paths, hashes, review reasons, or provenance.

`loadBreatheContent(slug, locale)`, `loadBreatheChrome(slug, locale)`, and `loadBreatheRoute(slug, locale)` begin behind a `server-only` boundary and use literal imports for every supported route-locale artifact. The loader checks `publication.json` before returning content and throws when the pair is not publishable.

The compiler also asserts that every structured slug maps to its expected route-manifest entry. Catalog presence alone cannot admit a URL. A route-locale pair must be represented by the manifest and marked publishable, otherwise the native path fails closed. This audit does not change the production cutover state.

## Translation safety and parity controls

Manual and replacement values are compiler-validated for:

- non-empty text and null-byte rejection;
- interpolation placeholder parity;
- Markdown link and image destination parity, including malformed-link rejection;
- HTML tag structure and `href` or `src` destination parity;
- rejection of active tags, event handlers, and JavaScript URLs;
- preservation of protected arrows, percentages, and subscript symbols;
- preservation of source numerics, with an explicit reviewed-reason path for legitimate unit conversion or locale-specific numeral presentation;
- source-hash parity and supported locale membership.

These checks protect structure and meaning. They do not authorize content improvements beyond the strict-parity scope.

## Validation gates

The local compiler layer has focused coverage for:

1. all fourteen structured routes and all five locales;
2. manifest route-ID coverage;
3. literal server-only imports and publication gating;
4. exact metadata occurrence binding unless a reviewed replacement exists;
5. deduplicated manual inputs and unresolved-slot accounting;
6. emitted `null` values matching publication unresolved counts;
7. preservation of the existing Buteyko proof content;
8. explicit normalized, global, proof, manual, and replacement provenance;
9. manual and replacement translation safety rules;
10. deterministic checked-in artifact generation.

The repository exposes these family commands:

```sh
pnpm run build:native-i18n-breathe-index
pnpm run check:native-i18n-breathe-index
pnpm run build:native-i18n-breathe-pages
pnpm run check:native-i18n-breathe-pages
node --test scripts/tests/native-i18n-breathe-content.test.mjs
pnpm exec tsc --noEmit
git diff --check
```

Manual translation closure and deterministic regeneration are complete. The structured compiler reports 14 routes, 70 publishable locale-route pairs, and zero unresolved values. The hub compiler reports current artifacts, five publishable 42-field locale bundles, and zero unresolved values. The normal build runs both deterministic checks before invoking Next.js.

## Current local evidence

- All fourteen structured routes are publishable in all five translated locales: 70 of 70 locale-route pairs with zero unresolved values.
- The `/breathe` hub resolves all 42 fields in all five locales with zero unresolved values.
- All 15 family routes are marked `preview`; none is `cutover-ready`.
- The native migration suite passes 91 of 91 tests, TypeScript and focused ESLint pass, and diff-format validation passes.
- A production-equivalent `native-preview` build completed with 183 static pages; the localized catch-all remains 170 KB first-load JavaScript versus 167 KB for English structured routes.
- The post-build verifier passed all 95 admitted localized HTML artifacts, including correct language, canonical, alternates, titles, fail-closed error checks, and proxy-global absence.
- Hydrated checks passed on the Spanish hub, Japanese Ujjayi, and French Hope Cartel routes with localized content and links and no browser errors. Representative URLs in every locale returned 200, while unapproved `/es/for/sleep` returned 404.

## Evidence still pending

The compiler and artifact layer are not production-admission evidence by themselves. The following gates remain explicitly pending for the complete family:

- Vercel preview deployment evidence using the intended native-preview configuration;
- mobile layout, accessibility, internal-link, share, video, timer, and interactive-pacer checks;
- the complete hydrated browser and crawler-user-agent matrix across all five locales;
- production observation and rollback evidence after any future cutover.

Until those gates pass, this record supports local Phase 3 completion only. It does not claim Vercel readiness, full browser parity, production readiness, or production cutover. Production remains on the existing serving path.
