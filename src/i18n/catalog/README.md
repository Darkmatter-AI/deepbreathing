# Native translation catalog snapshot

This directory is the checked-in preservation copy of the Deep Breathing
Exercises catalog that was previously served by MassTranslate. It is immutable
import evidence and the input to repository-native semantic bundle generation.
Runtime and build code must never contact MassTranslate.

`manifest.json` records the source tenant, locales, counts, route-to-file map,
per-file SHA-256 checksums, and whole-catalog translation checksums. Each locale
has one page-scoped file per source route. A locale's
`_orphaned-translations.json` preserves catalog translations that are no longer
referenced by a current page occurrence so retiring MassTranslate does not lose
historical work.

Every route segment preserves:

- source text and source hash;
- stable occurrence key and translation context;
- catalog translation text, approval/review state, QA metadata, and provenance;
- any per-page manual override.

Application components must not use DOM selectors, catalog UUIDs, or source-text
replacement as their runtime translation API. A separate generated layer maps
this snapshot to stable semantic IDs and emits only the route and shared values
the application needs.

## Reproduce the export

The exporter only performs `SELECT` statements inside a PostgreSQL
`REPEATABLE READ, READ ONLY` transaction. It replaces this generated directory
only after all queries and integrity checks succeed.

```sh
MASS_TRANSLATE_DATABASE_URL='postgresql://read-capable-url' \
  node scripts/i18n/export-masstranslate-catalog.mjs
node --test scripts/tests/i18n-catalog-export.test.mjs
```

For the production Railway database, open a local Railway SSH tunnel and point
`MASS_TRANSLATE_DATABASE_URL` at its local port. Do not commit or paste the
connection string into this directory.

The generated files deliberately exclude database credentials, the tenant's
user ID, override actor IDs, and untranslated source segments that have no
current page occurrence. Counts for omitted unplaced source segments remain in
the manifest so the boundary is explicit.
