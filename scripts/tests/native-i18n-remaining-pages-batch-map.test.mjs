import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === "./index" &&
      context.parentURL?.endsWith("/src/i18n/route-manifest.ts")
    ) {
      return nextResolve("./index.ts", context);
    }

    return nextResolve(specifier, context);
  },
});

const { NATIVE_ROUTE_MANIFEST } =
  await import("../../src/i18n/route-manifest.ts");
const { TRANSLATED_LOCALES } = await import("../../src/i18n/index.ts");

const batchMap = JSON.parse(
  await readFile(
    new URL(
      "../../docs/native-i18n/work/remaining-pages-batch-map.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const catalogManifest = JSON.parse(
  await readFile(
    new URL("../../src/i18n/catalog/manifest.json", import.meta.url),
    "utf8",
  ),
);

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function catalogBaseline(route) {
  const files = catalogManifest.files.filter(
    (file) => file.type === "route" && file.route === route,
  );
  assert.equal(files.length, 5, `${route}: expected five catalog artifacts`);

  return {
    segments: files[0].segments,
    missingByLocale: Object.fromEntries(
      files.map((file) => [file.locale, file.missingSegments]),
    ),
    missingTotal: files.reduce(
      (total, file) => total + file.missingSegments,
      0,
    ),
  };
}

test("batch map covers every intended static route not yet in native preview", () => {
  const expectedRoutes = NATIVE_ROUTE_MANIFEST.filter(
    (route) =>
      !route.dynamic &&
      TRANSLATED_LOCALES.every(
        ({ code }) =>
          route.publicationIntent[code] &&
          route.nativeStatus[code] !== "preview" &&
          route.nativeStatus[code] !== "cutover-ready",
      ),
  )
    .map((route) => route.path)
    .sort();
  const mappedRoutes = batchMap.routes.map(({ path }) => path).sort();

  assert.equal(batchMap.status, "prepared-not-launched");
  assert.equal(expectedRoutes.length, 19);
  assert.deepEqual(mappedRoutes, expectedRoutes);
  assertUnique(mappedRoutes, "remaining route paths");
});

test("route counts match the preserved catalog baseline", () => {
  let missingTotal = 0;

  for (const route of batchMap.routes) {
    const expected = catalogBaseline(route.path);
    assert.equal(route.catalogSegments, expected.segments, route.path);
    assert.deepEqual(
      route.catalogMissingByLocale,
      expected.missingByLocale,
      route.path,
    );
    assert.equal(route.catalogMissingCells, expected.missingTotal, route.path);
    missingTotal += route.catalogMissingCells;
  }

  assert.equal(missingTotal, 366);
});

test("integration waves and Grok lanes have exclusive route ownership", () => {
  const remainingRoutes = batchMap.routes.map(({ path }) => path).sort();
  const waveRoutes = batchMap.integrationWaves
    .flatMap(({ routes }) => routes)
    .sort();
  assert.deepEqual(waveRoutes, remainingRoutes);
  assertUnique(waveRoutes, "integration-wave routes");

  const missingRoutes = batchMap.routes
    .filter(({ catalogMissingCells }) => catalogMissingCells > 0)
    .map(({ path }) => path)
    .sort();
  const assignedRoutes = batchMap.grokTranslationBatches
    .flatMap(({ routes }) => routes)
    .sort();
  assert.deepEqual(assignedRoutes, missingRoutes);
  assertUnique(assignedRoutes, "Grok translation routes");

  for (const batch of batchMap.grokTranslationBatches) {
    const expectedCells = batch.routes.reduce(
      (total, path) =>
        total +
        batchMap.routes.find((route) => route.path === path)
          .catalogMissingCells,
      0,
    );
    assert.equal(batch.catalogMissingCells, expectedCells, batch.id);
    assert.ok(
      batch.model === "grok-composer-2.5-fast" || batch.model === "grok-4.5",
      `${batch.id}: unexpected model`,
    );
  }

  for (const route of batchMap.routes) {
    if (route.catalogMissingCells === 0) {
      assert.equal(route.grokTranslationBatch, null, route.path);
      continue;
    }

    const batch = batchMap.grokTranslationBatches.find(
      ({ id }) => id === route.grokTranslationBatch,
    );
    assert.ok(batch, `${route.path}: missing Grok batch`);
    assert.ok(batch.routes.includes(route.path), route.path);
  }

  assert.equal(
    batchMap.grokTranslationBatches.reduce(
      (total, batch) => total + batch.catalogMissingCells,
      0,
    ),
    366,
  );
});
