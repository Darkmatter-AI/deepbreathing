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

// Every marker in the checked-in document must resolve to a real line. This is
// portable and gates the build — it catches a classified marker whose source
// moved or was reworded.
test("every marker in the inventory resolves to a real line", () => {
  const document = fs.readFileSync(INVENTORY_FILE, "utf8");
  assert.doesNotMatch(document, /\(marker missing\)/);
});

/**
 * Byte-equality against a fresh generation. This is a "you forgot to rerun the
 * generator" reminder, and it is deliberately NOT a build gate:
 *
 *  - The document embeds marker line numbers (`docs/UX-BACKLOG.md:100`), so an
 *    unrelated docs edit reddens it until someone regenerates.
 *  - It is not byte-reproducible across platforms. It passes on macOS and failed
 *    on Vercel's Linux for the same commit (deployment 2kNeGSMV..., subtest 127)
 *    while every substantive inventory assertion passed there. The cause is not
 *    identified: it is not filename encoding, case collisions, `localeCompare`
 *    collation (since fixed), or the 17 files `.vercelignore` strips — all four
 *    were ruled out by reproduction. Until it is understood, do not gate on it.
 *
 * Run it locally (it runs by default) and regenerate with
 * `node scripts/i18n/build-native-i18n-inventory.mjs` when it fails.
 */
test(
  "generated native-i18n inventory is current",
  { skip: process.env.CI || process.env.VERCEL ? "not byte-reproducible on CI; see comment above" : false },
  () => {
    const document = fs.readFileSync(INVENTORY_FILE, "utf8");
    assert.equal(document, buildInventoryDocument(ROOT));
  },
);

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
