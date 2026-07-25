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
  // Drift-detection baseline, not a correctness claim. Re-pin it deliberately when
  // structured content legitimately changes, and read the classification diff below
  // to confirm the change is the one you intended. Re-pinned 2026-07-25 after the
  // suite got a runner: content 2917 -> 2923, keyword 408 -> 411.
  assert.equal(first.digest, "298e0c6f2525e499790a76605e14a22f359d7f4fcee397578597903a195b5c2e");
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
    content: 2923,
    date: 69,
    identifier: 375,
    keyword: 411,
    url: 144,
  });
  assert.equal(
    Object.values(summary.classification).reduce((total, count) => total + count, 0),
    summary.stringLeaves,
  );
  assert.equal(summary.stringLeaves, 3922);

  assert.deepEqual(summary.contentMatches, {
    ambiguous: 149,
    missing: 737,
    unique: 2037,
  });
  assert.equal(
    Object.values(summary.contentMatches).reduce((total, count) => total + count, 0),
    summary.classification.content,
  );
  // `incomplete` rose 727 -> 737 and `safe_unique` fell 2041 -> 2037 when this was
  // re-pinned on 2026-07-25: ~10 newer content leaves have no translation yet.
  // `unsafe_translation_conflict` held at 26, so nothing became less safe — that is
  // the number to watch, since it counts leaves whose translations actively disagree.
  assert.deepEqual(summary.contentBridge, {
    incomplete: 737,
    safe_equivalent_ambiguity: 123,
    safe_unique: 2037,
    unsafe_translation_conflict: 26,
  });
  assert.deepEqual(summary.contextEvidence, {
    ambiguousLeaves: 149,
    ambiguousLeavesWithConflictingTranslations: 26,
    ambiguousLeavesWithEquivalentTranslations: 123,
    distinctConflictingSourceTexts: 13,
    matchedLeaves: 2186,
    matchedLeavesWithSemanticFieldKey: 0,
  });

  for (const locale of audit.locales) {
    assert.equal(summary.perLocale[locale].matchedButMissingTranslation, 0);
    assert.equal(summary.perLocale[locale].sourceMissing, 737);
  }
});
