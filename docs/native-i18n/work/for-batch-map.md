# `/for` family translation batch map

Date: 2026-07-15
Status: translation and reviewed-replacement lanes complete; route integration in progress
Integrator: primary Codex task

This is the single-writer assignment record for the first measured run of the native route-family migration playbook. Counts below are compiler-emitted unresolved cells after the initial catalog recovery and the completed `athletes` pilot.

| Batch    | Lane                          | Routes                                                                            | Expected locale cells | Writable files                                                                                                 | Status                                       |
| -------- | ----------------------------- | --------------------------------------------------------------------------------- | --------------------: | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `F-C01a` | Grok Fast pilot               | `athletes`                                                                        |                    38 | `src/i18n/content/use-cases/manual/athletes.json`                                                              | complete; 38/38 accepted, focused gates pass |
| `F-C01b` | Composer CLI output-only      | `running`, `travel-anxiety`                                                       |                   206 | `src/i18n/content/use-cases/manual/{running,travel-anxiety}.json`                                              | complete; 206/206 accepted                   |
| `F-C02`  | Composer CLI output-only      | `meditation`, `focus`, `public-speaking`, `stress`                                |                   130 | `src/i18n/content/use-cases/manual/{meditation,focus,public-speaking,stress}.json`                             | complete; 130/130 accepted                   |
| `F-C03`  | Composer CLI output-only      | `singing`, `sleep`, `huberman`, `kids`, `holiday-stress`                          |                   119 | `src/i18n/content/use-cases/manual/{singing,sleep,huberman,kids,holiday-stress}.json`                          | complete; 119/119 accepted                   |
| `F-R01`  | Grok 4.5 edit + strong review | `high-blood-pressure`, `pregnancy`, `panic-attacks`, `lung-capacity`, `pranayama` |                   146 | `src/i18n/content/use-cases/manual/{high-blood-pressure,pregnancy,panic-attacks,lung-capacity,pranayama}.json` | complete; 146/146 accepted, 3 review flags   |
| `F-R02`  | Strong catalog audit          | existing approved-value fidelity audit                                            |       91 replacements | `docs/native-i18n/work/for-reviewed-replacements.proposed.json` and compiler-owned replacement files           | complete; 91/91 accepted across 16 routes    |
| `F-I01`  | Integrator                    | shared renderer chrome                                                            |                     0 | `src/i18n/content/use-cases/manual/_shared.json`                                                               | complete; no unresolved shared entries       |

`/for/anxiety` is excluded from translation batches. Its complete five-locale proof bundles and reviewed regional safety replacements remain the source of truth during structured-family compilation.

## Audit baseline

- 18 structured routes plus the bespoke `/for` hub.
- 1,479 translatable structured leaves and 7,395 locale cells.
- 1,057 leaves have safe catalog evidence.
- 414 source-missing leaves create 2,070 raw locale gaps.
- Existing anxiety proof closes 135 of those gaps.
- Exact head-occurrence binding resolves 25 of 28 conflicting locale cells.
- Conservative remaining structured workload before compiler/global recovery: 1,938 locale cells plus reviewed replacements.
- The hub has complete catalog coverage but requires a reviewed override for the current metadata title because its preserved `head:title` occurrence is stale.

## Measured run

- Initial scaffold: 5 of 90 locale routes publishable, 639 unresolved cells.
- `F-C01a` used Grok Fast with the compiler-owned `athletes.json` contract pasted into the signed-in web session because browser file upload was unavailable.
- The returned JSON filled all 38 missing cells without changing source text, message IDs, hashes, links, numbers, or schema shape.
- Compiler check after the pilot: 10 of 90 locale routes publishable, 601 unresolved cells.
- Focused structured-family tests after the pilot: 14 of 14 passing.
- Installed Grok Build version: `0.2.101`; available models were `grok-composer-2.5-fast` and `grok-4.5`.
- Native Grok subagents, `--best-of-n`, ambient worktree execution, memory, web, MCP, and Grok-created worktrees were not used.
- The first file-editing CLI attempt exposed a version-specific tool-name mismatch. Lowercase documented names removed the native file tools; the three Composer batches accepted 0 cells.
- A corrected `Read,Glob,Grep,StrReplace` edit attempt let Composer inspect files but it ended after three turns before applying edits; it also accepted 0 cells. Both failures remained isolated in disposable staging directories.
- The Composer contract was changed to one fresh, tool-free, output-only job per route. The worker returned a complete compiler contract; the integrator extracted only validated null-to-string changes.
- Output-only Composer completed 455/455 cells across 11 routes. Sum of per-job elapsed time was 216.995 seconds; bounded-wave wall time was about 92 seconds. Reported model usage was 213,596 total tokens. OAuth output did not report dollar cost.
- Grok 4.5 filled 146/146 safety-lane cells in 108.072 seconds, then completed an independent high-effort review in 74.390 seconds. The two passes reported 285,723 total tokens and three non-blocking ambiguity flags. No review edit was required.
- The strong catalog audit proposed 91 objective replacements across 16 routes. All 91 passed source binding, current-catalog binding, numeric/markup checks, and compiler ingestion.
- Final structured compiler state before route integration: 90 of 90 locale-route pairs publishable, zero unresolved cells, focused tests 14 of 14 passing.

## Rework log

| Event        | Batch            | Detection            | Class                         | Disposition                                              | Preventive change                                                                                                |
| ------------ | ---------------- | -------------------- | ----------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FOR-RW-001` | `F-C01b/C02/C03` | first CLI run        | `compiler-gap`                | rejected; no staged changes                              | Use installed model-facing tool names, not assumed lowercase names.                                              |
| `FOR-RW-002` | `F-C01b/C02/C03` | corrected edit retry | `missing-cell`                | rejected; 0/455 cells accepted                           | Route Composer translation to one-turn output-only contracts instead of file editing.                            |
| `FOR-RW-003` | `F-R01`          | initial strong run   | `missing-cell` in report only | staged translations preserved and independently reviewed | Separate translation mutation from review/report capture; validate `structuredOutput`, not concatenated `.text`. |
| `FOR-RW-004` | `F-R01`          | strong review        | `source-drift` flags          | accepted without source changes; 3 flags recorded        | Keep broken-source and terminology flags visible, but do not mix source repair into parity migration.            |

## Assignment rule

The compiler must emit source-bound route files before any translation assignment begins. Once emitted, this table will record exact compiler counts, start and finish times, returned flags, validator failures, review escalations, and accepted rework. Generated route, chrome, provenance, unresolved, publication, type, and loader artifacts remain integrator-owned.
