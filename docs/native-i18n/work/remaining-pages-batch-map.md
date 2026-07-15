# Remaining native pages batch map

Date: 2026-07-15
Status: prepared, validated, and not launched
Integrator: primary Codex task
Machine-readable source: `remaining-pages-batch-map.json`

This is the launch plan for the 19 publicly translated static routes that are not yet admitted to native preview. It applies the measured `/for` playbook without starting Grok, editing route content, or mixing content improvements into migration parity.

## Baseline

- 37 of 56 publicly translated routes are already in native preview.
- These 19 routes account for the remaining 95 locale-route pairs.
- The preserved catalog contains 1,463 route segments across these routes and 366 untranslated locale cells.
- Eleven routes have zero missing catalog cells. Eight routes contain all 366 current gaps.
- This is a raw preservation-catalog baseline. Compiler recovery, current-source drift, rich-text composition, deduplication, and shared chrome may change the final assignment count.
- Grok Build is authenticated at version `0.2.101`. Available models are `grok-composer-2.5-fast` and `grok-4.5`.

## Integration waves

The integrator owns every source object, compiler, renderer, loader, manifest change, generated artifact, test, and publication decision. Grok may receive only compiler-emitted route contracts.

| Wave    | Surface                    | Routes | Raw missing cells | Status                                  |
| ------- | -------------------------- | -----: | ----------------: | --------------------------------------- |
| `R-W01` | Duration pages             |      4 |                 0 | ready for source-contract extraction    |
| `R-W02` | Editorial and safety pages |      5 |               115 | waits for compiler-emitted contracts    |
| `R-W03` | Application and embed      |      5 |                71 | waits for client-boundary inventory     |
| `R-W04` | Trust and information      |      5 |               180 | waits for compiler-emitted contracts    |
| Total   |                            |     19 |               366 | prepared, no translation workers active |

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

Counts are not executable assignments until the relevant compiler emits source-bound manual contracts. Each route remains one fresh process even when several routes share a lane.

| Batch   | Lane                 | Model                    | Routes                                     | Raw cells | Status                 |
| ------- | -------------------- | ------------------------ | ------------------------------------------ | --------: | ---------------------- |
| `R-C01` | Composer output-only | `grok-composer-2.5-fast` | breathing app, visualizer, embed, stats    |        96 | prepared, not launched |
| `R-R01` | Strong review        | `grok-4.5 --effort high` | presentation, physiological-sigh panic     |       115 | prepared, not launched |
| `R-R02` | Strong review        | `grok-4.5 --effort high` | privacy, support                           |       155 | prepared, not launched |
| `R-A01` | Catalog audit        | `grok-4.5 --effort high` | every remaining route after source binding |   pending | prepared, not launched |

`R-C01` uses one tool-free, schema-constrained, output-only job per route. `R-R01` and `R-R02` use isolated staging inputs and a separate high-effort review pass. `R-A01` may propose objective replacements but may not edit canonical inputs or approve its own proposals.

## Launch prerequisites

1. The integrator extracts the route or family source object and freezes stable message IDs, source hashes, rich-text slots, and client phrase ownership.
2. The deterministic compiler recovers exact approved catalog evidence first and emits route-scoped manual contracts containing only genuine null translation values.
3. The batch map is refreshed from compiler counts. No raw catalog count is copied into an assignment as if it were final.
4. Focused validators cover source drift, locale keys, placeholders, links, markup, protected symbols, numbers, units, phase order, and safety qualifiers.
5. The output-only controller is adapted only after the route-contract schema exists. It must retain the proven `prepare`, `run`, `validate`, then `merge` boundary and never merge a returned file wholesale.
6. Every Grok process uses `--verbatim`, strict sandboxing, no plan, no subagents, no memory, disabled web search, no auto-update, and no shell or MCP tools. Composer receives no file tools.
7. Writable ownership is route-exclusive. Shared chrome, compilers, renderers, generated output, manifests, tests, and documentation remain integrator-owned.
8. The strong catalog audit reviews 100 percent of safety, legal, privacy, timing, phase, unit, and claim-bearing values and at least 10 percent of ordinary cells across every route and locale. Any meaning-changing sample defect expands that route to full review.

## Bounded launch shape

- Begin with `R-W01` contract extraction because it has no known translation gaps and can validate the reusable bespoke-family architecture without spending Grok tokens.
- Once route contracts exist, run up to four independent route jobs concurrently. Do not use Grok native subagents, `--best-of-n`, Grok-created worktrees, ambient repository editing, or continued sessions.
- Validate every result before merge. After all accepted manual inputs land, stop workers and run one deterministic family compilation owned by the integrator.
- Admit a route only after local no-JavaScript, hydration, metadata, internal-link, fail-closed, and production-build checks pass.
- Do not deploy another preview until the production-only IndexNow guard is committed, because every preview build runs the repository `postbuild` hook.

## Non-goals

- No keyword research, copy improvement, claim change, design cleanup, or new-language work.
- No automatic repair of approved catalog translations without objective evidence and independent review.
- No sitemap, hreflang publication-set, Cloudflare, proxy, production, or cutover change.
- No Grok execution until compiler-owned contracts and exact assignment counts exist.
