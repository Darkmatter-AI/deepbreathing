# Remaining native pages batch map

Date: 2026-07-15
Status: translation contracts complete; runtime integration pending
Integrator: primary Codex task
Machine-readable source: `remaining-pages-batch-map.json`

This is the execution map for the 19 publicly translated static routes that are not yet admitted to native preview. The three missing-translation batches are complete. Runtime source extraction, typed bundles, renderers, and preview admission remain integrator-owned and pending.

## Baseline

- 37 of 56 publicly translated routes are already in native preview.
- These 19 routes account for the remaining 95 locale-route pairs.
- The preserved catalog contains 1,463 route segments across these routes and 366 untranslated locale cells.
- Eleven routes have zero missing catalog cells. Eight routes contain all 366 current gaps.
- This is a raw preservation-catalog baseline. Compiler recovery, current-source drift, rich-text composition, deduplication, and shared chrome may change the final assignment count.
- Grok Build is authenticated at version `0.2.101`. Available models are `grok-composer-2.5-fast` and `grok-4.5`.

## Integration waves

The integrator owns every source object, compiler, renderer, loader, manifest change, generated artifact, test, and publication decision. Grok may receive only compiler-emitted route contracts.

| Wave    | Surface                    | Routes | Raw missing cells | Status                                             |
| ------- | -------------------------- | -----: | ----------------: | -------------------------------------------------- |
| `R-W01` | Duration pages             |      4 |                 0 | ready for source-contract extraction               |
| `R-W02` | Editorial and safety pages |      5 |               115 | translation inputs ready; integration pending      |
| `R-W03` | Application and embed      |      5 |                71 | translation inputs ready; client inventory pending |
| `R-W04` | Trust and information      |      5 |               180 | translation inputs ready; integration pending      |
| Total   |                            |     19 |               366 | all raw gaps closed; runtime integration pending   |

### `R-W01`: duration pages

- `/1-minute-breathing-exercise`
- `/2-minute-breathing-exercise`
- `/4-7-8-breathing-for-insomnia`
- `/5-minute-breathing-exercise`

These pages have complete raw catalog coverage and similar `Resonance` ownership. Start here to extract one reusable typed duration-page contract and prove whether the four routes can share a compiler and renderer without changing their English behavior.

### `R-W02`: editorial and safety pages

- `/box-breathing-before-presentation`
- `/breathing-exercises-before-surgery`
- `/breathing-exercises-for-labor`
- `/holiday-breathing-exercises`
- `/physiological-sigh-panic-attack`

Medical, pregnancy, panic, timing, phase-order, and emergency-language values go directly to Grok 4.5 and receive an independent high-effort review. Existing approved values are not rewritten unless the separate catalog audit proves an objective fidelity defect.

### `R-W03`: application and embed pages

- `/box-breathing-app`
- `/breathing-app`
- `/breathing-visualizer`
- `/coherent-breathing-app`
- `/embed`

Before translation assignment, record each server/client boundary and decide whether each route needs an explicit localized page to isolate its client graph. The dynamic `/embed/[slug]` exception remains outside this static-route batch and stays fail closed.

### `R-W04`: trust and information pages

- `/about/abi`
- `/about/editorial-policy`
- `/privacy`
- `/stats`
- `/support`

Privacy and support values use the strong-review lane because they describe account, deletion, data, and device behavior. `/stats` remains the existing noindex-in-sitemap contradiction; migration parity must preserve that baseline unless a separate SEO decision changes it.

## Grok translation assignments

The deterministic gap compiler emitted placement-bound contracts for all eight routes with raw catalog gaps. Each route ran in one fresh process, then a separate fresh Grok 4.5 process reviewed every returned locale cell before merge.

| Batch   | Lane                 | Model                    | Routes                                  | Raw cells | Status                                        |
| ------- | -------------------- | ------------------------ | --------------------------------------- | --------: | --------------------------------------------- |
| `R-C01` | Composer output-only | `grok-composer-2.5-fast` | breathing app, visualizer, embed, stats |        96 | complete; 92 approved, 4 corrected in review  |
| `R-R01` | Strong translation   | `grok-4.5`               | presentation, physiological-sigh panic  |       115 | complete; 114 approved, 1 corrected in review |
| `R-R02` | Strong translation   | `grok-4.5`               | privacy, support                        |       155 | complete; 154 approved, 1 corrected in review |
| `R-A01` | Catalog audit        | `grok-4.5`               | existing approved catalog values        |   pending | deferred; outside missing-translation scope   |

All 366 returned values passed immutable-field, locale-key, current-source-hash, number, link, markup, placeholder, and null-only validation. Independent review accepted 360 values as returned and made six narrow parity corrections. `R-A01` remains deferred so this migration does not become an improvement pass over already approved catalog values.

## Completed launch controls

1. The integrator generated eight route-scoped contracts directly from all five preserved locale artifacts and bound every entry to a page placement plus current English source hash.
2. Existing approved values were immutable. Only catalog-null cells could change, and accepted reviewed values now survive deterministic compiler reruns.
3. Focused validators cover source drift, locale keys, placeholders, links, markup, protected symbols, numbers, and null-only mutation.
4. Both controllers retain explicit `prepare`, `run`, `validate`, then `merge` boundaries and never merge a returned file wholesale.
5. Every Grok process used `--verbatim`, strict sandboxing, no plan, no subagents, no memory, disabled web search, no auto-update, one turn, and no file, shell, web, or MCP tools.
6. Every one of the 366 cells received an independent Grok 4.5 review before merge.

## Bounded launch shape

- Begin runtime integration with `R-W01`, which has no catalog gaps and can validate the reusable duration-page architecture without mixing translation work into renderer work.
- Reuse the completed source-bound contracts when `R-W02`, `R-W03`, and `R-W04` compilers bind current runtime fields. Placement IDs remain provenance identifiers and must not become runtime message IDs.
- Keep all future route compilers, renderers, loaders, generated output, manifests, tests, and publication decisions integrator-owned.
- Admit a route only after local no-JavaScript, hydration, metadata, internal-link, fail-closed, and production-build checks pass.
- Do not deploy another preview until the production-only IndexNow guard is committed, because every preview build runs the repository `postbuild` hook.

## Non-goals

- No keyword research, copy improvement, claim change, design cleanup, or new-language work.
- No automatic repair of approved catalog translations without objective evidence and independent review.
- No sitemap, hreflang publication-set, Cloudflare, proxy, production, or cutover change.
- No audit or rewrite of existing approved catalog values during this missing-translation milestone.
