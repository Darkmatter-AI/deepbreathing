import assert from "node:assert/strict";
import test from "node:test";

import {
  applyReviewDecisions,
  buildReviewDocument,
  reviewOutputSchema,
  validateReviewDocument,
} from "../i18n/remaining-pages/review-grok-output-translations.mjs";

const canonical = {
  schemaVersion: 1,
  sourceRoute: "/example",
  entries: [
    {
      messageId: "catalog-placement.00000000-0000-0000-0000-000000000000",
      reason: "Missing approved catalog translation for example",
      reviewedSourceHash:
        "14f0efd062f5bd8a2cdd3a708bfcc7b6201ebde39572fb5e254154f01b88b14f",
      scope: "content",
      sourceText: "Practice for 60 seconds.",
      translations: {
        "de-de": null,
        "es-es": "Practica durante 60 segundos.",
        "fr-fr": null,
        "ja-jp": "60秒間練習します。",
        "pt-br": "Pratique por 60 segundos.",
      },
    },
  ],
};
const proposed = structuredClone(canonical);
proposed.entries[0].translations["de-de"] = "Üben Sie 60 Sekunden lang.";
proposed.entries[0].translations["fr-fr"] = "Pratiquez pendant 60 secondes.";

test("review input includes exactly the Composer-filled catalog gaps", () => {
  const review = buildReviewDocument("R-C01", canonical, proposed);
  assert.equal(review.entries.length, 2);
  assert.deepEqual(
    review.entries.map(({ locale }) => locale),
    ["de-de", "fr-fr"],
  );
  assert.ok(review.entries.every((entry) => entry.decision === null));
  assert.ok(
    review.entries.every((entry) => entry.reviewedTranslation === null),
  );

  const schema = reviewOutputSchema(review);
  assert.equal(schema.properties.entries.minItems, 2);
  assert.deepEqual(schema.properties.entries.items.properties.decision.enum, [
    "approve",
    "rework",
  ]);
});

test("review validation binds decisions and safe corrections to exact cells", () => {
  const review = buildReviewDocument("R-C01", canonical, proposed);
  const returned = structuredClone(review);
  returned.entries[0].decision = "approve";
  returned.entries[0].reason = "Faithful and natural.";
  returned.entries[0].reviewedTranslation = returned.entries[0].translation;
  returned.entries[1].decision = "rework";
  returned.entries[1].reason = "Use a direct imperative.";
  returned.entries[1].reviewedTranslation = "Pratiquez durant 60 secondes.";

  const result = validateReviewDocument(review, returned);
  assert.equal(result.accepted, true);
  assert.equal(result.approved, 1);
  assert.equal(result.reworked, 1);

  const reviewedProposal = applyReviewDecisions(proposed, returned);
  assert.equal(
    reviewedProposal.entries[0].translations["fr-fr"],
    "Pratiquez durant 60 secondes.",
  );

  const invalid = structuredClone(returned);
  invalid.entries[0].reviewedTranslation = "Eine Weile üben.";
  assert.equal(validateReviewDocument(review, invalid).accepted, false);
});
