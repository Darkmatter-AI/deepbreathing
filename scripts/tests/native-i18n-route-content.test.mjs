import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import {
  buildProofRouteContentArtifacts,
  checkGeneratedRouteContentArtifacts,
  getAtSourcePath,
  PROOF_CONTENT_LOCALES,
  PROOF_CONTENT_ROUTES,
} from "../i18n/semantic-proof/compile-proof-route-content.mjs";

const proofRoot = new URL("../../src/i18n/content/proof/", import.meta.url);

function shapeOf(value) {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

test("compiles complete route-scoped content deterministically", async () => {
  const first = await buildProofRouteContentArtifacts();
  const second = await buildProofRouteContentArtifacts();

  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.outputs.size, 11);
  assert.deepEqual(Object.keys(first.publication.routes), PROOF_CONTENT_ROUTES);

  for (const route of PROOF_CONTENT_ROUTES) {
    const routePublication = first.publication.routes[route];
    assert.equal(
      routePublication.expectedMessages,
      route === "/breathe/buteyko" ? 99 : 91,
    );
    assert.deepEqual(
      Object.keys(routePublication.locales),
      PROOF_CONTENT_LOCALES,
    );
    for (const locale of PROOF_CONTENT_LOCALES) {
      const localePublication = routePublication.locales[locale];
      assert.equal(localePublication.publishable, true);
      assert.match(localePublication.sha256, /^[0-9a-f]{64}$/);
      assert.ok(localePublication.bytes > 1_000);
    }
  }
});

test("reconstructs the source shape and applies every semantic message exactly by path", async () => {
  const build = await buildProofRouteContentArtifacts();

  for (const route of PROOF_CONTENT_ROUTES) {
    const source = build.sourcePages[route];
    const routeMap = build.semanticMap.routes.find(
      (candidate) => candidate.sourceRoute === route,
    );
    assert.ok(routeMap);

    for (const locale of PROOF_CONTENT_LOCALES) {
      const localized = build.bundles[route][locale];
      const messages = build.messages[route][locale];
      assert.deepEqual(shapeOf(localized), shapeOf(source));
      assert.equal(Object.keys(messages).length, routeMap.messages.length);

      for (const mapping of routeMap.messages) {
        assert.equal(
          getAtSourcePath(localized, mapping.sourcePath),
          messages[mapping.messageId],
          `${route}:${locale}:${mapping.sourcePath}`,
        );
      }
    }
  }
});

test("preserves non-translatable routing, media, citation, and timing fields", async () => {
  const build = await buildProofRouteContentArtifacts();
  const checks = {
    "/breathe/buteyko": [
      "slug",
      "mode",
      "meta.author",
      "meta.datePublished",
      "meta.dateModified",
      "meta.ogImage",
      "research.studies[0].url",
      "related[0].slug",
      "keywords[0]",
    ],
    "/for/anxiety": [
      "slug",
      "mode",
      "breathingPageSlug",
      "meta.author",
      "meta.datePublished",
      "meta.dateModified",
      "references[0].source",
      "references[0].url",
      "relatedTechnique.slug",
      "relatedUseCases[0].slug",
      "relatedGuides[0].href",
      "keywords[0]",
    ],
  };

  for (const route of PROOF_CONTENT_ROUTES) {
    for (const locale of PROOF_CONTENT_LOCALES) {
      for (const sourcePath of checks[route]) {
        assert.equal(
          getAtSourcePath(build.bundles[route][locale], sourcePath),
          getAtSourcePath(build.sourcePages[route], sourcePath),
          `${route}:${locale}:${sourcePath}`,
        );
      }
    }
  }
});

test("checked-in route content is current and contains no mapping provenance", async () => {
  const result = await checkGeneratedRouteContentArtifacts();
  assert.deepEqual(result, { checked: 11, stale: [] });

  const publication = JSON.parse(
    await readFile(
      new URL("route-content-publication.json", proofRoot),
      "utf8",
    ),
  );
  for (const route of Object.values(publication.routes)) {
    for (const locale of Object.values(route.locales)) {
      const raw = await readFile(new URL(locale.path, proofRoot), "utf8");
      assert.doesNotMatch(
        raw,
        /catalogSegmentId|contextKey|elementSelector|messageId|occurrenceKey|reviewedSourceHash|sourcePath|sourceText/,
      );
    }
  }
});

test("server loader uses literal route-locale imports and fails closed", async () => {
  const loaderPath = new URL(
    "../../src/i18n/content/proof/server/load-proof-content.ts",
    import.meta.url,
  );
  const loader = await readFile(loaderPath, "utf8");

  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/routes\//g) ?? []).length, 10);
  assert.doesNotMatch(
    loader,
    /messages\/|semantic-map|source-metadata|source-text|querySelector/,
  );
  assert.match(loader, /route-content-publication\.json/);
  assert.match(loader, /!coverage\.publishable/);
  assert.match(loader, /refusing incomplete content/);
  assert.match(loader, /ProofContentByRoute\[Route\]/);
});
