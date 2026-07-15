# `/4-7-8-breathing-timer` native migration audit

Date: 2026-07-15  
Status: complete and admitted to local `native-preview`; production remains in `proxy`

## Scope decision

The route was migrated as a strict content-parity baseline. Existing English meaning and claims were preserved so the serving-path migration can be measured independently from later editorial, evidence, or SEO experiments. The only content changes in this pass were required translation gaps and objectively broken imported values.

This route combines long-form editorial copy, metadata, structured data, a large interactive client island, and query-state behavior. It is therefore a useful architecture and performance proof. The existing SEO record also notes `/ja/4-7-8-breathing-timer` at Bing position 1, which makes fail-closed publication and parity checks especially important.

## Implemented content contract

The English route and all five translated routes now use one typed source contract containing 176 semantic messages per locale. The implementation derives:

- page metadata and social metadata;
- breadcrumb, Article, HowTo, and FAQ JSON-LD;
- visible hero, instructions, sections, tables, FAQs, related cards, safety note, and footer;
- typed internal-link slots;
- the small locale/runtime props passed to `Resonance`.

The visible FAQ values also generate FAQ schema, removing the previous independent duplicate. HowTo schema remains schema-only in this parity pass because rendering a new visible HowTo section would change the current page. That cleanup can be evaluated separately after migration.

The long-form object stays server-only. `Resonance` receives only the locale, published-route list, mode display name, and the existing runtime phrase contract. Internal links are localized only when the destination is admitted by the route manifest and otherwise fail closed to the English URL.

## Translation closure

All five runtime bundles are complete, values-only, and contain no catalog IDs or provenance. The compiler records preservation evidence separately.

| Locale | Catalog exact | Catalog normalized | Reviewed gaps | Reviewed replacements | Unresolved |
|---|---:|---:|---:|---:|---:|
| German | 136 | 10 | 18 | 12 | 0 |
| Spanish | 143 | 15 | 18 | 0 | 0 |
| French | 144 | 15 | 17 | 0 | 0 |
| Japanese | 139 | 15 | 19 | 3 | 0 |
| Brazilian Portuguese | 144 | 15 | 17 | 0 | 0 |

The reviewed replacements are limited to objective fidelity defects:

- Twelve German values restore adjustable `counts` semantics where the catalog incorrectly changed them to fixed seconds.
- Three Japanese values repair `天然 of 精神安定剤`, a `ワイエル博士` typo, and `長い呼気が478呼吸法自律神経`.

The English health-adjacent claims identified during the audit remain unchanged under ADR-016. Reviewing, narrowing, citing, or testing them is explicitly outside this migration pass.

## Admission evidence

The route is `preview` for all five translated locales and remains absent from `native` cutover publication.

1. The deterministic compiler reports 176 resolved values and zero unresolved values for every locale.
2. The explicit localized route renders complete server HTML with localized title, `lang`, canonical, hreflang, Open Graph, Twitter, and JSON-LD output.
3. The production-equivalent `native-preview` build completed with 108 static pages.
4. The post-build verifier passed all 20 admitted localized artifacts and rejected unapproved route-locale pairs.
5. The localized and English timer routes both report 167 KB first-load JavaScript.
6. Live local checks returned 200 for all five localized timer URLs, preserved query state such as `?duration=300`, and returned 404 for an unapproved `/es/breathe/box` route.
7. A Japanese browser check confirmed localized server and hydrated content with no hydration error. The five-minute control updated the localized URL to `?duration=300`.
8. The Start control did not advance in the local in-app browser on either the Japanese or English route. Because the behavior is identical, it is recorded as baseline parity and is not changed in this migration.
9. Focused timer, manifest, and route-shell tests, TypeScript, ESLint, and `git diff --check` passed.

## Remaining cutover gates

- Validate the route in a configured Vercel preview.
- Complete the broader browser, audio, mobile, accessibility, and crawler matrix used for final cutover.
- Preserve the parity baseline before any separate content-improvement experiment changes claims, keywords, or structured-data policy.
