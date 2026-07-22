import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildRemainingPageGapContracts,
  contractFileName,
  stableJson,
} from "../i18n/remaining-pages/compile-remaining-page-gaps.mjs";

const repoRoot = new URL("../../", import.meta.url);
const locales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const expectedMissingCells = {
  "/box-breathing-before-presentation": 60,
  "/breathing-app": 1,
  "/breathing-visualizer": 65,
  "/embed": 5,
  "/physiological-sigh-panic-attack": 55,
  "/privacy": 15,
  "/stats": 25,
  "/support": 140,
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readCatalogRoute(locale, route) {
  return JSON.parse(
    await readFile(
      new URL(
        `src/i18n/catalog/${locale}/pages/${route.slice(1)}.json`,
        repoRoot,
      ),
      "utf8",
    ),
  );
}

test("compiler owns every catalog gap exactly once without inventing route scope", async () => {
  const contracts = await buildRemainingPageGapContracts();
  assert.deepEqual(
    contracts.map(({ sourceRoute }) => sourceRoute).sort(),
    Object.keys(expectedMissingCells).sort(),
  );

  let totalCatalogGapCells = 0;
  for (const contract of contracts) {
    const expected = expectedMissingCells[contract.sourceRoute];
    const catalogs = Object.fromEntries(
      await Promise.all(
        locales.map(async (locale) => [
          locale,
          await readCatalogRoute(locale, contract.sourceRoute),
        ]),
      ),
    );
    const catalogGaps = contract.entries.reduce((total, entry) => {
      const pageSegmentId = entry.messageId.slice("catalog-placement.".length);
      return (
        total +
        locales.filter((locale) => {
          const placement = catalogs[locale].segments.find(
            (segment) => segment.pageSegmentId === pageSegmentId,
          );
          assert.ok(placement, `${entry.messageId}:${locale}`);
          return placement.translation === null;
        }).length
      );
    }, 0);
    assert.equal(catalogGaps, expected, contract.sourceRoute);
    const unresolved = contract.entries.reduce(
      (total, entry) =>
        total +
        Object.values(entry.translations).filter((value) => value === null)
          .length,
      0,
    );
    assert.ok(unresolved <= expected, contract.sourceRoute);
    totalCatalogGapCells += catalogGaps;
  }
  assert.equal(totalCatalogGapCells, 366);
});

test("contracts are placement-bound, source-hashed, and preserve catalog values", async () => {
  const contracts = await buildRemainingPageGapContracts();

  for (const contract of contracts) {
    assert.equal(contract.schemaVersion, 1);
    const catalogs = Object.fromEntries(
      await Promise.all(
        locales.map(async (locale) => [
          locale,
          await readCatalogRoute(locale, contract.sourceRoute),
        ]),
      ),
    );
    const placementsByLocale = Object.fromEntries(
      locales.map((locale) => [
        locale,
        new Map(
          catalogs[locale].segments.map((segment) => [
            segment.pageSegmentId,
            segment,
          ]),
        ),
      ]),
    );
    const seenMessageIds = new Set();

    for (const entry of contract.entries) {
      assert.match(entry.messageId, /^catalog-placement\.[0-9a-f-]{36}$/);
      assert.ok(!seenMessageIds.has(entry.messageId), entry.messageId);
      seenMessageIds.add(entry.messageId);
      const pageSegmentId = entry.messageId.slice("catalog-placement.".length);
      assert.equal(entry.reviewedSourceHash, sha256(entry.sourceText));
      assert.ok(entry.scope === "chrome" || entry.scope === "content");
      assert.deepEqual(Object.keys(entry.translations), locales);

      let hasGap = false;
      for (const locale of locales) {
        const segment = placementsByLocale[locale].get(pageSegmentId);
        assert.ok(segment, `${entry.messageId}:${locale} missing placement`);
        assert.equal(segment.sourceText, entry.sourceText);
        const expectedTranslation = segment.translation?.text ?? null;
        if (expectedTranslation === null) {
          assert.ok(
            entry.translations[locale] === null ||
              (typeof entry.translations[locale] === "string" &&
                entry.translations[locale].length > 0),
            `${entry.messageId}:${locale} invalid reviewed gap value`,
          );
          hasGap = true;
        } else {
          assert.equal(entry.translations[locale], expectedTranslation);
        }
      }
      assert.equal(hasGap, true, `${entry.messageId} has no catalog gap`);
    }
  }
});

test("checked-in contracts exactly match deterministic compiler output", async () => {
  const contracts = await buildRemainingPageGapContracts();

  for (const contract of contracts) {
    const checkedIn = await readFile(
      new URL(
        `src/i18n/content/remaining-pages/manual/${contractFileName(contract.sourceRoute)}`,
        repoRoot,
      ),
      "utf8",
    );
    assert.equal(checkedIn, stableJson(contract), contract.sourceRoute);
  }
});
