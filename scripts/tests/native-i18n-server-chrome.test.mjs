import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildProofServerChromeArtifacts,
  checkProofServerChromeArtifacts,
  PROOF_CHROME_LOCALES,
  PROOF_CHROME_ROUTES,
} from "../i18n/semantic-proof/compile-proof-server-chrome.mjs";

const proofRoot = new URL("../../src/i18n/content/proof/", import.meta.url);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("server chrome source map is reviewed and complete for both proof routes", async () => {
  const build = await buildProofServerChromeArtifacts();

  assert.deepEqual(
    build.sourceMap.routes.map((route) => route.sourceRoute),
    PROOF_CHROME_ROUTES,
  );
  assert.deepEqual(
    build.sourceMap.routes.map((route) => route.messages.length),
    [56, 52],
  );

  for (const route of build.sourceMap.routes) {
    assert.equal(new Set(route.messages.map((message) => message.messageId)).size, route.messages.length);
    for (const message of route.messages) {
      assert.equal(message.reviewedSourceHash, sha256(message.sourceText));
      assert.match(message.messageId, /^chrome\./);
    }
  }
});

test("compiled server chrome is complete, deterministic, and provenance-free", async () => {
  const first = await buildProofServerChromeArtifacts();
  const second = await buildProofServerChromeArtifacts();
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.equal(first.unresolved.unresolved.length, 0);
  assert.equal(first.outputs.size, 12);

  for (const route of PROOF_CHROME_ROUTES) {
    const routeCoverage = first.publication.routes[route];
    assert.deepEqual(Object.keys(routeCoverage.locales), PROOF_CHROME_LOCALES);
    for (const locale of PROOF_CHROME_LOCALES) {
      const coverage = routeCoverage.locales[locale];
      assert.equal(coverage.publishable, true);
      assert.equal(coverage.resolvedMessages, routeCoverage.expectedMessages);
      assert.match(coverage.sha256, /^[0-9a-f]{64}$/);
      const raw = await readFile(new URL(coverage.path, proofRoot), "utf8");
      assert.doesNotMatch(
        raw,
        /catalogSegmentId|contextKey|occurrenceKey|reviewedSourceHash|sourceRoute|sourceText/,
      );
    }
  }
});

test("checked-in server chrome artifacts and server-only loader fail closed", async () => {
  assert.deepEqual(await checkProofServerChromeArtifacts(), {
    checked: 12,
    stale: [],
    unresolved: 0,
  });

  const loader = await readFile(
    new URL("../../src/i18n/content/proof/server/load-proof-server-chrome.ts", import.meta.url),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/server-chrome\//g) ?? []).length, 10);
  assert.doesNotMatch(loader, /server-chrome-map|catalog\//);
  assert.match(loader, /refusing incomplete chrome/);
  assert.match(loader, /resolvedMessages !== routeCoverage\.expectedMessages/);
});

test("structured renderers use explicit server chrome without serializing the bundle to Resonance", async () => {
  const [pattern, useCase, context, localizedDate] = await Promise.all([
    readFile(new URL("../../src/app/(site-en)/breathe/pattern-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/app/(site-en)/for/use-case-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/i18n/render-context.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/components/seo/localized-date.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(context, /serverMessages\?: ProofServerChromeMessages/);
  assert.match(pattern, /renderContext\?\.serverMessages\?\.\[messageId\] \?\? fallback/);
  assert.match(useCase, /renderContext\?\.serverMessages\?\.\[messageId\] \?\? fallback/);
  assert.doesNotMatch(pattern, /<Resonance[^>]+serverMessages=/);
  assert.doesNotMatch(useCase, /<Resonance[^>]+serverMessages=/);
  assert.match(localizedDate, /new Intl\.DateTimeFormat\(locale/);
  assert.match(localizedDate, /timeZone: "UTC"/);
});
