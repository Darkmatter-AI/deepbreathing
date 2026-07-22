import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildInventoryDocument,
  collectInventory,
} from "../i18n/build-native-i18n-inventory.mjs";

const ROOT = process.cwd();
const INVENTORY_FILE = path.join(ROOT, "docs", "native-i18n", "INVENTORY.md");
const LOCALE_PREFIXES = ["es", "pt", "fr", "de", "ja"];
const CATALOG_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

test("generated native-i18n inventory is current", () => {
  const document = fs.readFileSync(INVENTORY_FILE, "utf8");
  assert.equal(document, buildInventoryDocument(ROOT));
  assert.doesNotMatch(document, /\(marker missing\)/);
});

test("Phase 0 route and sitemap baseline stays explicit", () => {
  const inventory = collectInventory(ROOT);

  assert.equal(inventory.routes.length, 60);
  assert.deepEqual(
    inventory.dynamicPages.map(({ route, robots }) => ({ route, robots })),
    [{ route: "/embed/[slug]", robots: "noindex" }],
  );
  assert.equal(inventory.sitemapEntries.length, 337);

  const englishPublished = inventory.routes.filter((route) => route.publication.en);
  assert.equal(englishPublished.length, 57);
  for (const prefix of LOCALE_PREFIXES) {
    assert.equal(
      inventory.routes.filter((route) => route.publication[prefix]).length,
      56,
      `${prefix} sitemap count`,
    );
  }

  assert.deepEqual(
    inventory.routes.filter((route) => route.sitemapExcluded).map((route) => route.route),
    ["/brand-lab", "/og-preview", "/sensory-studio"],
  );
  assert.deepEqual(
    inventory.routes.filter((route) => route.robots === "noindex").map((route) => route.route),
    ["/brand-lab", "/og-preview", "/sensory-studio", "/stats"],
  );
  assert.deepEqual(
    inventory.routes.filter((route) => route.englishOnly).map((route) => route.route),
    ["/languages"],
  );
});

test("final catalog covers all currently translated sitemap routes", () => {
  const inventory = collectInventory(ROOT);

  assert.equal(inventory.catalogRoutes.length, 59);
  assert.equal(inventory.manifest.counts.pages, 59);
  assert.equal(inventory.manifest.counts.translationRecords, 22_084);
  assert.equal(inventory.manifest.counts.orphanTranslationRecords, 280);

  for (const route of inventory.catalogRoutes) {
    assert.deepEqual(Object.keys(route.files).sort(), CATALOG_LOCALES);
  }

  assert.deepEqual(inventory.discrepancies, {
    appStaticNotCatalog: ["/sensory-studio"],
    catalogNotAppStatic: [],
    sitemapEnglishNotCatalog: [],
    catalogNotSitemapEnglish: ["/brand-lab", "/og-preview"],
    translatedSitemapNotCatalog: [],
    noindexInSitemap: ["/stats"],
    englishOnlyCataloged: ["/languages"],
  });
});

test("every explicit MassTranslate marker is classified", () => {
  const inventory = collectInventory(ROOT);
  assert.deepEqual(
    inventory.unclassifiedMarkerFiles,
    [],
    `unclassified marker files: ${inventory.unclassifiedMarkerFiles.join(", ")}`,
  );
});
