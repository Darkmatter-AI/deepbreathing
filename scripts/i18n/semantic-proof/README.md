# Semantic compiler proof

This isolated proof compiles the safe subset of the checked-in MassTranslate
snapshot into repository-native messages for exactly two structured routes:

- `/breathe/buteyko`
- `/for/anxiety`

It does not change routing, metadata, sitemap output, page components, or the
production serving path.

## Contracts

- `src/i18n/content/proof/semantic-map.json` is the reviewed, frozen mapping
  from current TypeScript source paths to semantic message IDs. Every entry
  locks the reviewed English source hash. The compiler never invents or renames
  an ID, and an English edit requires an intentional hash review/update.
- `src/i18n/content/proof/overrides.json` contains the explicit repo-owned
  translations for catalog misses and conflicts. Luna supplied all 245 values
  with owner approval. English is never copied into a locale value.
- `source-metadata/` and `unresolved-report.json` are build-time provenance.
  They retain English source text, hashes, audit status, and catalog evidence.
- `messages/<locale>/` contains the minimal runtime maps. These files contain
  only semantic message ID to localized text pairs.
- `manifest.json` records schema, counts, provenance, and file checksums.
- `publication.json` is the minimal runtime gate. All ten proof locale-route
  bundles are complete, but the route manifest keeps them at `semantic-ready`;
  none is exposed through native preview or production routing yet.
- `server/load-proof-messages.ts` keeps the publication gate static and small,
  then uses explicit literal dynamic imports so a request can load only one
  route-locale message map. It refuses every incomplete pair and is deliberately
  not wired into the application yet.

## Commands

Regenerate deterministic artifacts after an intentional source-map or override
edit:

```sh
node scripts/i18n/semantic-proof/build-semantic-proof.mjs --write
```

Verify that checked-in artifacts match their inputs without writing:

```sh
node scripts/i18n/semantic-proof/build-semantic-proof.mjs --check
node --test scripts/tests/native-i18n-semantic-proof.test.mjs
```

The compiler validates approved catalog status, placeholders, Markdown link
destinations, HTML tag structure, forbidden active markup, numeric values,
protected symbols, schema coverage, semantic ID stability, and generated
checksums.
