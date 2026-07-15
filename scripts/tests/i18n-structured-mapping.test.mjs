import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAudit,
  classifyLeaf,
  stableJson,
} from "../i18n/audit-structured-i18n-mapping.mjs";

test("classifies structured string leaves before translation matching", () => {
  assert.equal(classifyLeaf(["hero", "title"], "Box Breathing"), "content");
  assert.equal(classifyLeaf(["meta", "dateModified"], "2026-02-25"), "date");
  assert.equal(classifyLeaf(["related", 0, "slug"], "coherent"), "identifier");
  assert.equal(classifyLeaf(["references", 0, "source"], "Cleveland Clinic"), "identifier");
  assert.equal(classifyLeaf(["references", 0, "url"], "https://example.com"), "url");
  assert.equal(classifyLeaf(["keywords", 0], "breathing exercise"), "keyword");
  assert.equal(classifyLeaf(["ownedVideo", "duration"], "PT5M"), "identifier");
  assert.equal(classifyLeaf(["howTo", "steps", 0, "duration"], "5 minutes"), "content");
});

test("audits all structured routes deterministically against the checked-in catalog", async () => {
  const first = await buildAudit();
  const second = await buildAudit();

  assert.deepEqual(second, first);
  assert.equal(stableJson(second), stableJson(first));
  assert.equal(first.digest, "a2198562bae800bcf7f2c324914829606087ac6f320b6d7e2391ee7f1bdbb75d");
  assert.deepEqual(first.locales, ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"]);
  assert.deepEqual(first.summary.datasets, { breathing: 14, "use-case": 18 });
  assert.equal(first.summary.pages, 32);
  assert.equal(first.routes.length, 32);
  assert.equal(new Set(first.routes.map((route) => route.route)).size, 32);
});

test("accounts for every string leaf and preserves the current mapping baseline", async () => {
  const audit = await buildAudit();
  const { summary } = audit;

  assert.deepEqual(summary.classification, {
    content: 2917,
    date: 69,
    identifier: 375,
    keyword: 408,
    url: 144,
  });
  assert.equal(
    Object.values(summary.classification).reduce((total, count) => total + count, 0),
    summary.stringLeaves,
  );
  assert.equal(summary.stringLeaves, 3913);

  assert.deepEqual(summary.contentMatches, {
    ambiguous: 149,
    missing: 727,
    unique: 2041,
  });
  assert.equal(
    Object.values(summary.contentMatches).reduce((total, count) => total + count, 0),
    summary.classification.content,
  );
  assert.deepEqual(summary.contentBridge, {
    incomplete: 727,
    safe_equivalent_ambiguity: 123,
    safe_unique: 2041,
    unsafe_translation_conflict: 26,
  });
  assert.deepEqual(summary.contextEvidence, {
    ambiguousLeaves: 149,
    ambiguousLeavesWithConflictingTranslations: 26,
    ambiguousLeavesWithEquivalentTranslations: 123,
    distinctConflictingSourceTexts: 13,
    matchedLeaves: 2190,
    matchedLeavesWithSemanticFieldKey: 0,
  });

  for (const locale of audit.locales) {
    assert.equal(summary.perLocale[locale].matchedButMissingTranslation, 0);
    assert.equal(summary.perLocale[locale].sourceMissing, 727);
  }
});
