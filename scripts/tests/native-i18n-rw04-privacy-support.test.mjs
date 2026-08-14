import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PRIVACY_SUPPORT_LOCALES,
  buildPrivacySupportArtifacts,
  checkPrivacySupportArtifacts,
} from "../i18n/bespoke/compile-privacy-support-content.mjs";

const repoRoot = new URL("../../", import.meta.url);
const contentRoot = new URL(
  "../../src/i18n/content/bespoke/privacy-support/",
  import.meta.url,
);
const expectedLocales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const forbiddenRuntimeFields =
  /catalog|occurrence|placement|messageId|reason|reviewedSourceHash|sourceHash|sourceText/i;

async function read(relativePath) {
  return readFile(new URL(relativePath, repoRoot), "utf8");
}

function stringLeaves(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringLeaves);
  }
  return [];
}

function assertSemanticKeys(value, path = "root") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.match(key, /^[a-z][A-Za-z0-9]*$/, `${path}.${key}`);
    assert.doesNotMatch(key, /sel|ctx|copy|[0-9]{4}/i, `${path}.${key}`);
    assertSemanticKeys(child, `${path}.${key}`);
  }
}

test("R-W04 privacy/support compiler emits complete semantic value-only bundles", async () => {
  assert.deepEqual(PRIVACY_SUPPORT_LOCALES, expectedLocales);
  const first = await buildPrivacySupportArtifacts();
  const second = await buildPrivacySupportArtifacts();
  assert.deepEqual([...second], [...first]);

  const privacySource = JSON.parse(
    await readFile(new URL("source/privacy.json", contentRoot), "utf8"),
  );
  const supportSource = JSON.parse(
    await readFile(new URL("source/support.json", contentRoot), "utf8"),
  );
  const publication = JSON.parse(first.get("publication.json"));
  const unresolved = JSON.parse(first.get("unresolved.json"));
  const stale = JSON.parse(first.get("stale-gap-contracts.json"));

  assertSemanticKeys(privacySource);
  assertSemanticKeys(supportSource);
  assert.equal(stringLeaves(privacySource).length, 32);
  assert.equal(stringLeaves(supportSource).length, 36);
  assert.equal(publication.routes.privacy.reviewedGapCells, 15);
  assert.equal(publication.routes.privacy.renderedGapCells, 15);
  assert.equal(publication.routes.privacy.staleGapCells, 0);
  assert.equal(publication.routes.support.reviewedGapCells, 140);
  assert.equal(publication.routes.support.renderedGapCells, 125);
  assert.equal(publication.routes.support.staleGapCells, 15);
  assert.equal(publication.unresolvedCells, 0);
  assert.deepEqual(unresolved, []);
  assert.equal(stale.length, 3);
  assert.equal(stale.reduce((total, item) => total + item.cells, 0), 15);

  for (const route of ["privacy", "support"]) {
    for (const locale of expectedLocales) {
      const raw = first.get(`messages/${route}/${locale}.json`);
      assert.ok(raw, `missing ${route}:${locale}`);
      assert.doesNotMatch(raw, forbiddenRuntimeFields);
      const content = JSON.parse(raw);
      assert.ok(stringLeaves(content).every((value) => value.length > 0));
      assert.equal(publication.routes[route].locales[locale].publishable, true);
      assert.match(
        publication.routes[route].locales[locale].sha256,
        /^[0-9a-f]{64}$/,
      );
    }
  }
});

test("R-W04 privacy/support retains high-stakes current English claims", async () => {
  const [privacy, support] = await Promise.all([
    readFile(new URL("source/privacy.json", contentRoot), "utf8").then(JSON.parse),
    readFile(new URL("source/support.json", contentRoot), "utf8").then(JSON.parse),
  ]);

  assert.equal(privacy.hero.lastUpdated, "Last updated July 11, 2026.");
  assert.match(privacy.sections.accounts.body, /Apple or Google/);
  assert.match(privacy.sections.accounts.body, /stays on your device/);
  assert.match(privacy.sections.useAndShare.body, /do not sell personal information/);
  assert.match(privacy.sections.deletion.afterAction, /permanently delete/);
  assert.match(privacy.sections.device.body, /do not use the microphone, HealthKit/);
  assert.match(support.commonQuestions.deletion.afterAction, /confirmation link/);
  assert.match(support.commonQuestions.data.bodyBeforeLink, /do not sell data/);
  assert.match(support.commonQuestions.medical.answer, /not a medical device/);
  assert.match(support.safety.body, /Do not practice breath retention in or near water/);
});

test("R-W04 privacy/support artifacts are current", async () => {
  assert.deepEqual(await checkPrivacySupportArtifacts(), []);
});

test("R-W04 privacy/support loader is literal and fail closed", async () => {
  const loader = await read(
    "src/i18n/content/bespoke/privacy-support/server/load-privacy-support-content.ts",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\/privacy\//g) ?? []).length, 5);
  assert.equal((loader.match(/import\("\.\.\/messages\/support\//g) ?? []).length, 5);
  assert.match(loader, /loadPrivacyContent/);
  assert.match(loader, /loadSupportContent/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("R-W04 privacy/support use thin wrappers and parity renderers", async () => {
  const [privacyPage, privacyRenderer, supportPage, supportRenderer] =
    await Promise.all([
      read("src/app/(site-en)/privacy/page.tsx"),
      read("src/app/(site-en)/privacy/privacy-page.tsx"),
      read("src/app/(site-en)/support/page.tsx"),
      read("src/app/(site-en)/support/support-page.tsx"),
    ]);

  for (const [page, component] of [
    [privacyPage, "PrivacyPage"],
    [supportPage, "SupportPage"],
  ]) {
    assert.match(page, /source\//);
    assert.match(page, new RegExp(component));
    assert.doesNotMatch(page, /<main|<section|<header/);
  }

  assert.match(privacyRenderer, /createPrivacyMetadataFromContent/);
  assert.match(supportRenderer, /createSupportMetadataFromContent/);
  for (const renderer of [privacyRenderer, supportRenderer]) {
    assert.match(renderer, /BreadcrumbList/);
    assert.match(renderer, /resolveNativeInternalHref/);
    assert.match(renderer, /<JsonLd/);
    assert.doesNotMatch(renderer, /dangerouslySetInnerHTML|["']use client["']/);
  }
  assert.equal((privacyRenderer.match(/glow-card/g) ?? []).length, 7);
  assert.equal((supportRenderer.match(/glow-card/g) ?? []).length, 3);
  assert.match(privacyRenderer, /&ldquo;/);
  assert.match(privacyRenderer, /&rdquo;/);
  assert.match(supportRenderer, /&ldquo;/);
  assert.match(supportRenderer, /&rdquo;/);
  assert.match(supportRenderer, /mailto:hi@abiassi\.com/);
  assert.match(supportRenderer, /https:\/\/darkmatter\.is\//);
});
