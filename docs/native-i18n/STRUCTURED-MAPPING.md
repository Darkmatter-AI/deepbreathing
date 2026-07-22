# Structured content mapping audit

## Verdict

The checked-in MassTranslate catalog is suitable as a one-time seed for the unambiguous subset of structured content. It is not safe as a universal source-and-context code generator, and it must not become a runtime source-text replacement system.

Of 2,917 translatable content leaves across the 32 structured routes:

- 2,041 have one exact source-text placement and a usable translation in every locale.
- 123 have multiple placements, but every placement agrees on one translation per locale.
- 26 have multiple, conflicting translations and require a deliberate field-level choice.
- 727 have no exact source-text match in the corresponding route catalog and require explicit migration work.

That makes 2,164 leaves, or 74.2%, safe to seed automatically. The remaining 753 leaves must fail closed until they have an explicit repo-owned value.

The catalog does not provide semantic field identity for this bridge. None of the 2,190 matched leaves has a populated `fieldKey`; available contexts are DOM-level values such as `heading`, `p`, `product`, or head metadata. Those contexts help a human resolve the 26 conflicts, but they do not reliably identify a TypeScript field. Code generation should therefore emit translations against stable repo field paths, then discard source-text lookup from the runtime design.

## Reproduce the audit

Run:

```sh
node scripts/i18n/audit-structured-i18n-mapping.mjs --summary
node --test scripts/tests/i18n-structured-mapping.test.mjs
```

Omit `--summary` to emit the complete deterministic JSON audit, including every string leaf, match candidate, context, occurrence key, and per-locale translation set.

Snapshot inputs:

| Input | Value |
|---|---:|
| Catalog tenant | `deepbreathingexercises_com_ac8ae5` |
| Catalog snapshot updated through | `2026-07-15T07:05:12.173Z` |
| Locales | `de-de`, `es-es`, `fr-fr`, `ja-jp`, `pt-br` |
| Structured routes | 32 |
| Audit digest | `a2198562bae800bcf7f2c324914829606087ac6f320b6d7e2391ee7f1bdbb75d` |

The test pins the digest and exact counts. Any content or catalog change must intentionally refresh this document and the test baseline.

## Classification policy

The audit parses the TypeScript source with the existing TypeScript compiler. It does not execute the page modules or depend on import aliases.

Every literal string leaf is assigned exactly one category:

| Category | Count | Treatment |
|---|---:|---|
| Content | 2,917 | Must receive a locale value |
| Identifier or identity | 375 | Keep stable: slugs, video IDs, people, publication/source names, quote attributions, and ISO durations |
| Keyword | 408 | Keep out of this migration: `keywords` and `synonyms` |
| URL | 144 | Keep stable: `url`, `href`, and `ogImage` |
| Date | 69 | Keep stable ISO source values; format them at render time |
| **Total** | **3,913** | Exhaustive string-leaf count |

`duration` is content when it is human-readable, such as `5 minutes`, and an identifier when it is an ISO value such as `PT5M`.

## Exact-match results

The reference structure is the first sorted locale, `de-de`. All five locale catalogs have the same 727 source misses. Match states are deliberately strict:

- `unique`: one exact `sourceText` placement in the route catalog.
- `ambiguous`: more than one exact placement. This can represent legitimate reuse in metadata and visible content.
- `missing`: no exact placement. The audit does not use fuzzy, normalized, substring, DOM, or runtime replacement.

| Result | Leaves | Share of content |
|---|---:|---:|
| Unique exact match | 2,041 | 70.0% |
| Ambiguous exact match | 149 | 5.1% |
| Missing exact match | 727 | 24.9% |
| **Content total** | **2,917** | **100%** |

Of the 149 ambiguous leaves, 123 have translation-equivalent candidates and are safe to seed. The other 26 leaves represent 13 distinct English strings with context-dependent translations.

An exact miss does not prove that users saw untranslated text. Structured values may be joined, split around inline markup, normalized by HTML rendering, or differ from the production source captured by MassTranslate. For example, 33 missing leaves are individual `howTo.tools` or `howTo.supplies` values that the templates join before rendering. The strict result means only that the leaf is not safe for automatic exact-match code generation.

The largest missing groups are:

| Top-level field | Missing leaves |
|---|---:|
| `howTo` | 154 |
| `faqs` | 127 |
| `meta` | 92 |
| `body` | 61 |
| `research` | 49 |
| `science` | 46 |
| `solution` | 25 |
| `problem` | 24 |
| `relatedUseCases` | 20 |
| `hero` | 19 |
| `relatedTechnique` | 18 |
| `useCases` | 14 |
| `benefits` | 12 |
| `ownedVideo` | 10 |
| `related` | 10 |
| `relatedGuides` | 10 |
| `practiceTips` | 8 |
| `voiceSearch` | 8 |
| `video` | 7 |
| `references` | 6 |
| `lineage` | 5 |
| `disclaimer` | 1 |
| `frequency` | 1 |

## Per-locale usability

Every exact match has at least one non-empty translation in every locale. There are zero cases where a source matched but its translation was absent. The remaining risk is source misses and conflicting candidates.

| Locale | Source misses | Matched but translation absent | Conflict leaves | No safe automatic value |
|---|---:|---:|---:|---:|
| `de-de` | 727 | 0 | 16 | 743 |
| `es-es` | 727 | 0 | 20 | 747 |
| `fr-fr` | 727 | 0 | 12 | 739 |
| `ja-jp` | 727 | 0 | 13 | 740 |
| `pt-br` | 727 | 0 | 16 | 743 |

`No safe automatic value` counts source misses plus leaves with more than one translated candidate in that locale. It is a code-generation gate, not a statement about current live-page completeness.

## Dataset breakdown

| Dataset | Routes | String leaves | Content leaves | Unique | Ambiguous | Missing | Equivalent ambiguity | Conflict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Breathing pages | 14 | 1,909 | 1,438 | 1,007 | 118 | 313 | 100 | 18 |
| Use-case pages | 18 | 2,004 | 1,479 | 1,034 | 31 | 414 | 23 | 8 |
| **Total** | **32** | **3,913** | **2,917** | **2,041** | **149** | **727** | **123** | **26** |

## Route breakdown

`Equivalent` is the subset of ambiguous matches whose translations agree. `Conflict` is the subset whose translated candidates disagree.

| Route | Content | Unique | Ambiguous | Missing | Equivalent | Conflict |
|---|---:|---:|---:|---:|---:|---:|
| /breathe/4-7-8 | 104 | 66 | 4 | 34 | 4 | 0 |
| /breathe/9d-breathwork | 90 | 68 | 1 | 21 | 1 | 0 |
| /breathe/belly | 106 | 78 | 6 | 22 | 1 | 5 |
| /breathe/box | 113 | 71 | 13 | 29 | 12 | 1 |
| /breathe/breath-of-fire | 102 | 89 | 5 | 8 | 5 | 0 |
| /breathe/buteyko | 99 | 68 | 9 | 22 | 9 | 0 |
| /breathe/coherent | 98 | 52 | 11 | 35 | 8 | 3 |
| /breathe/hope-cartel-9d-breathwork | 87 | 76 | 1 | 10 | 1 | 0 |
| /breathe/nadi-shodhana | 118 | 75 | 21 | 22 | 20 | 1 |
| /breathe/physiological-sigh | 131 | 79 | 9 | 43 | 6 | 3 |
| /breathe/pursed-lip | 95 | 74 | 8 | 13 | 7 | 1 |
| /breathe/tummo | 106 | 76 | 13 | 17 | 13 | 0 |
| /breathe/ujjayi | 95 | 71 | 6 | 18 | 2 | 4 |
| /breathe/wim-hof | 94 | 64 | 11 | 19 | 11 | 0 |
| /for/anxiety | 91 | 59 | 5 | 27 | 5 | 0 |
| /for/athletes | 87 | 60 | 0 | 27 | 0 | 0 |
| /for/focus | 85 | 58 | 2 | 25 | 2 | 0 |
| /for/high-blood-pressure | 77 | 58 | 0 | 19 | 0 | 0 |
| /for/holiday-stress | 78 | 62 | 0 | 16 | 0 | 0 |
| /for/huberman | 88 | 67 | 1 | 20 | 0 | 1 |
| /for/kids | 78 | 54 | 4 | 20 | 4 | 0 |
| /for/lung-capacity | 82 | 68 | 0 | 14 | 0 | 0 |
| /for/meditation | 85 | 54 | 7 | 24 | 4 | 3 |
| /for/panic-attacks | 85 | 56 | 0 | 29 | 0 | 0 |
| /for/pranayama | 80 | 63 | 3 | 14 | 0 | 3 |
| /for/pregnancy | 88 | 65 | 0 | 23 | 0 | 0 |
| /for/public-speaking | 78 | 50 | 6 | 22 | 6 | 0 |
| /for/running | 74 | 30 | 2 | 42 | 2 | 0 |
| /for/singing | 81 | 59 | 0 | 22 | 0 | 0 |
| /for/sleep | 83 | 62 | 0 | 21 | 0 | 0 |
| /for/stress | 78 | 57 | 1 | 20 | 0 | 1 |
| /for/travel-anxiety | 81 | 52 | 0 | 29 | 0 | 0 |

## Conflicts requiring a field-level decision

These 26 leaves cannot select a translation by English source text alone. The complete JSON output includes every candidate translation and its catalog occurrence key.

| Route | Field path | English source | Locales with conflicts |
|---|---|---|---|
| /breathe/belly | `hero.title` | Belly Breathing: Diaphragmatic Breathing Exercises | `de-de`, `es-es`, `fr-fr`, `ja-jp` |
| /breathe/belly | `meta.twitterTitle` | Belly Breathing: Diaphragmatic Breathing Exercises | `de-de`, `es-es`, `fr-fr`, `ja-jp` |
| /breathe/belly | `practiceTips[2].title` | Keep it gentle | `de-de`, `fr-fr`, `ja-jp`, `pt-br` |
| /breathe/belly | `howTo.totalTime` | 5–10 minutes | `de-de`, `es-es` |
| /breathe/belly | `howTo.steps[5].duration` | 5–10 minutes | `de-de`, `es-es` |
| /breathe/box | `video.title` | Box Breathing with Mark Divine (Navy SEAL Commander) | `es-es`, `pt-br` |
| /breathe/coherent | `howTo.totalTime` | 5–10 minutes | `de-de`, `es-es` |
| /breathe/coherent | `howTo.steps[5].duration` | 5–10 minutes | `de-de`, `es-es` |
| /breathe/coherent | `video.title` | James Nestor on the Perfect Breath | `es-es` |
| /breathe/nadi-shodhana | `practiceTips[1].title` | Keep it gentle | `de-de`, `fr-fr`, `ja-jp`, `pt-br` |
| /breathe/physiological-sigh | `body[8].heading` | Physiological Sigh for Panic Attacks | `de-de`, `ja-jp`, `pt-br` |
| /breathe/physiological-sigh | `relatedGuides[0].title` | Physiological Sigh for Panic Attacks | `de-de`, `ja-jp`, `pt-br` |
| /breathe/physiological-sigh | `video.title` | The Physiological Sigh Explained: Stanford's Stress-Relief Technique | `es-es`, `pt-br` |
| /breathe/pursed-lip | `video.title` | Pursed Lip Breathing Technique - American Lung Association | `de-de`, `es-es`, `fr-fr`, `pt-br` |
| /breathe/ujjayi | `hero.title` | Ujjayi Breathing: The Ocean Breath Technique | `es-es`, `fr-fr`, `ja-jp`, `pt-br` |
| /breathe/ujjayi | `meta.ogTitle` | Ujjayi Breathing: The Ocean Breath Technique | `es-es`, `fr-fr`, `ja-jp`, `pt-br` |
| /breathe/ujjayi | `howTo.totalTime` | 5–15 minutes | `es-es` |
| /breathe/ujjayi | `howTo.steps[4].duration` | 5–15 minutes | `es-es` |
| /for/huberman | `video.title` | Dr. Andrew Huberman Explains the Physiological Sigh | `pt-br` |
| /for/meditation | `hero.title` | Can't Meditate? Start with Coherent Breathing | all five |
| /for/meditation | `meta.ogTitle` | Can't Meditate? Start with Coherent Breathing | all five |
| /for/meditation | `meta.twitterTitle` | Can't Meditate? Start with Coherent Breathing | all five |
| /for/pranayama | `hero.title` | Pranayama Breathing: The Complete Guide to Yogic Breathing | all five |
| /for/pranayama | `meta.twitterTitle` | Pranayama Breathing: The Complete Guide to Yogic Breathing | all five |
| /for/pranayama | `video.title` | James Nestor on the Perfect Breath | `es-es` |
| /for/stress | `video.title` | Dr. Andrew Huberman Explains the Physiological Sigh | `pt-br` |

## Migration gate

For structured route code generation:

1. Generate repo-owned field-path bundles only for `safe_unique` and `safe_equivalent_ambiguity` leaves.
2. Resolve the 26 conflict leaves against their exact DOM/head occurrence and record the choice by semantic field path.
3. Fill or reconstruct all 727 exact misses explicitly. Do not silently use English for a published locale.
4. Require every translatable field path to have a value in all five locales before enabling that route.
5. Keep URLs, dates, keywords, and identifiers out of translation output.
6. Remove source-text and DOM-context lookup from the runtime. The catalog remains provenance for the import, not an application dependency.
