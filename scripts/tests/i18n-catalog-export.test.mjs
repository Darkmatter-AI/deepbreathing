import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  CATALOG_SCHEMA_VERSION,
  assertSafeCatalogOutDir,
  routeArtifactPath,
  sha256,
  stableJson,
} from "../i18n/export-masstranslate-catalog.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const catalogReadmeSource = join(repoRoot, "scripts/i18n/catalog-README.md");

test("routeArtifactPath is deterministic and filesystem safe", () => {
  assert.equal(routeArtifactPath("es-es", "/"), "es-es/pages/_root.json");
  assert.equal(
    routeArtifactPath("pt-br", "/breathe/coherent"),
    "pt-br/pages/breathe/coherent.json",
  );
  assert.match(
    routeArtifactPath("fr-fr", "/search?q=sleep"),
    /^fr-fr\/pages\/search__query-[a-f0-9]{12}\.json$/,
  );
});

test("catalog exporter cannot recursively delete an arbitrary path", () => {
  assert.equal(
    assertSafeCatalogOutDir(join(repoRoot, "src/i18n/catalog-test")),
    join(repoRoot, "src/i18n/catalog-test"),
  );

  for (const unsafePath of [
    "/",
    repoRoot,
    join(repoRoot, "src/i18n"),
    join(repoRoot, "src/i18n/route-manifest.ts"),
    join(repoRoot, "src/i18n/catalog/nested"),
    join(repoRoot, "tmp/catalog"),
  ]) {
    assert.throws(
      () => assertSafeCatalogOutDir(unsafePath),
      /Refusing destructive catalog export/,
      unsafePath,
    );
  }
});

test("generated catalog documentation survives a reproducible export", async () => {
  assert.equal(
    await readFile(join(catalogRoot, "README.md"), "utf8"),
    await readFile(catalogReadmeSource, "utf8"),
  );
});

test("checked-in MassTranslate snapshot is complete and checksum-valid", async () => {
  const manifest = JSON.parse(await readFile(join(catalogRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, CATALOG_SCHEMA_VERSION);
  assert.deepEqual(manifest.source.locales, ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"]);
  assert.equal(manifest.routes.length, manifest.counts.pages);
  assert.equal(manifest.files.length, manifest.counts.artifactFiles);

  const uniqueTranslations = new Map();
  let routeFileCount = 0;
  let orphanFileCount = 0;
  let placements = 0;

  for (const file of manifest.files) {
    const content = await readFile(join(catalogRoot, file.path), "utf8");
    assert.equal(sha256(content), file.sha256, `${file.path} checksum`);
    assert.equal(Buffer.byteLength(content), file.bytes, `${file.path} byte count`);
    assert.doesNotMatch(content, /postgres(?:ql)?:\/\//i, `${file.path} must not contain a database URL`);

    const artifact = JSON.parse(content);
    assert.equal(artifact.schemaVersion, CATALOG_SCHEMA_VERSION);
    assert.equal(artifact.locale, file.locale);

    const records = file.type === "route" ? artifact.segments : artifact.records;
    if (file.type === "route") {
      routeFileCount += 1;
      placements += records.length;
      assert.equal(artifact.route, file.route);
      assert.equal(file.path, routeArtifactPath(file.locale, file.route));
    } else {
      orphanFileCount += 1;
      assert.equal(file.type, "orphaned");
    }

    for (const record of records) {
      assert.match(record.sourceHash, /^[a-f0-9]{64}$/);
      if (!record.translation) continue;

      const id = record.translation.catalogTranslationId;
      const integrityRecord = {
        locale: artifact.locale,
        contextKey: record.contextKey,
        sourceHash: record.sourceHash,
        sourceText: record.sourceText,
        translation: record.translation,
      };
      const serialized = stableJson(integrityRecord);
      if (uniqueTranslations.has(id)) {
        assert.equal(uniqueTranslations.get(id), serialized, `translation ${id} is consistent everywhere`);
      } else {
        uniqueTranslations.set(id, serialized);
      }
    }
  }

  assert.equal(routeFileCount, manifest.counts.pages * manifest.source.locales.length);
  assert.equal(orphanFileCount, manifest.source.locales.length);
  assert.equal(placements, manifest.counts.currentPlacements * manifest.source.locales.length);
  assert.equal(uniqueTranslations.size, manifest.counts.translationRecords);

  const ids = [...uniqueTranslations.keys()].sort();
  assert.equal(sha256(`${ids.join("\n")}\n`), manifest.integrity.translationIdsSha256);

  const translationRecords = ids.map((id) => ({
    id,
    ...JSON.parse(uniqueTranslations.get(id)),
  }));
  assert.equal(
    sha256(stableJson(translationRecords)),
    manifest.integrity.translationRecordsSha256,
  );
});
