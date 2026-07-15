# Homepage native migration audit

Date: 2026-07-15  
Status: inventory complete; implementation is the next Phase 2 slice

## Scope

The homepage will be migrated under ADR-016 strict parity. This pass preserves the current English meaning, page structure, claims, route links, and interactive behavior. It does not introduce keyword work, claim cleanup, new copy, or a redesign.

## Preserved catalog

Each of the five `_root` locale catalogs contains the same baseline:

| Measure | Count |
|---|---:|
| Captured placements | 198 |
| Unique English source strings | 157 |
| Approved placements | 185 |
| Unapproved placements | 13 |

The unapproved values are not gaps in the server-rendered homepage body. They are the generic browser error plus client/auth phrases such as `Save your session`, `Continue with Google`, `Email address`, and `just now`. The applicable interactive phrases already belong to the explicit 107-key runtime phrase contract, so they must not be duplicated into the homepage server bundle.

The catalog has approved translations for the current homepage metadata, hero, editorial cards, mode picker, FAQ, related links, safety footer, technique index, guide index, timers, information links, situations, credits, and language entry point in all five locales.

## Ownership boundary

### Server-owned homepage bundle

- homepage metadata, Open Graph, Twitter, WebSite schema, and FAQ schema;
- hero label, title, subtitle, and server-rendered action labels;
- editorial sections, lists, cards, FAQs, related links, safety note, and footer columns;
- translated mode names and descriptions shown outside the interactive experience;
- translated technique and guide labels in the footer;
- typed internal destinations, localized only when the manifest admits the target.

### Existing shared client bundle

- session phases and instructions;
- settings, audio, duration, account, authentication, conversion, and share controls;
- language-switcher chrome;
- the localized display name passed to `Resonance` for the default Box mode.

Only locale, admitted localized route paths, the default mode display name, and existing runtime phrases should cross into the homepage client island. The long-form homepage object remains server-only.

## Source normalization risks

The preservation crawl records browser-rendered punctuation in a few places, including non-breaking hyphens and normalized apostrophes, while the JSX source uses ordinary hyphens or entities. The compiler must allow a documented typography-normalization bridge and record that provenance. It must not use loose or request-time source matching.

Repeated strings such as `Pick a mode`, `Start session`, mode names, and footer labels should share intentional semantic values only when their meaning is identical. Route slugs, URLs, mode enums, schema types, and external credit destinations remain structural data rather than translatable messages.

## Implementation gates

1. Extract a typed homepage source contract without changing English output.
2. Compile complete values-only bundles from the five `_root` catalogs with zero unexplained gaps.
3. Keep all client/auth values in the existing shared runtime phrase contract rather than duplicating them.
4. Add an explicit `/[locale]` page and localized homepage metadata, while leaving production in `proxy` and the route out of `cutover-ready`.
5. Derive visible FAQ and FAQ schema from the same content.
6. Localize only manifest-admitted internal links and fail closed to English elsewhere.
7. Pass deterministic compiler, TypeScript, route-shell, metadata, post-build artifact, and full native-i18n tests.
8. Compare localized and English first-load JavaScript, server HTML, hydration, duration query state, mobile layout, and interactive start behavior.

## Known baseline

The pre-homepage repository-wide baseline passed 188 of 198 tests. After adding the homepage compiler tests, the current suite passes 195 of 205. The same ten failures remain in the previously documented conversion-variant, English homepage build-artifact, OG font/image, and reviewer-fallback groups. Homepage implementation must not add a new failure group or silently claim those existing failures as migration regressions.

## Admission outcome

Status: admitted to local `native-preview` for all five translated locales.

- The compiler emits five complete 159-message homepage objects with zero unresolved values.
- Four source strings absent from the preserved root catalog use reviewed translations in every locale.
- Reviewed replacements repair only objectively broken fidelity, including truncated social descriptions, swapped practice cues, changed safety qualifications, untranslated Japanese copy, and session/login ambiguity.
- FAQ schema derives from the visible FAQ object, and route slugs, URLs, mode enums, colors, schema types, and external destinations remain structural.
- The English route keeps its existing direct interactive import. Localized roots isolate only `Resonance`; long-form content stays in server HTML and is absent from the localized client chunk.
- A production-equivalent build generated 113 static pages. The post-build verifier passed all 25 proof artifacts, and the localized catch-all reports 170 KB first-load JavaScript versus 167 KB for English `/`.
- A hydrated Spanish root retained `lang="es-ES"`, localized title and H1, translated runtime chrome, and fail-closed internal links without an English hero swap.

Remaining proof-set work is deployment-level validation: a configured Vercel preview plus the complete browser, crawler-user-agent, mobile, accessibility, and audio matrix. No route is `cutover-ready`, and production remains in `proxy` mode.
