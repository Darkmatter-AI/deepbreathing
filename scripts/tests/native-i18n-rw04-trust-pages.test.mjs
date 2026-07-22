import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repoRoot = new URL("../../", import.meta.url);
const contentRoot = new URL("src/i18n/content/bespoke/trust-pages/", repoRoot);
const abiRouteRoot = new URL("src/app/(site-en)/about/abi/", repoRoot);
const editorialRouteRoot = new URL(
  "src/app/(site-en)/about/editorial-policy/",
  repoRoot,
);

function shapeOf(value) {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, shapeOf(child)]),
    );
  }
  return typeof value;
}

function stringLeavesOf(value, path = [], leaves = []) {
  if (typeof value === "string") {
    leaves.push({ path: path.join("."), value });
    return leaves;
  }
  if (!value || typeof value !== "object") return leaves;
  for (const [key, child] of Object.entries(value)) {
    stringLeavesOf(child, [...path, key], leaves);
  }
  return leaves;
}

test("R-W04 trust English routes are thin source-content wrappers", async () => {
  const [abiPage, editorialPage] = await Promise.all([
    readFile(new URL("page.tsx", abiRouteRoot), "utf8"),
    readFile(new URL("page.tsx", editorialRouteRoot), "utf8"),
  ]);

  assert.match(abiPage, /trust-pages\/source\.json/);
  assert.match(abiPage, /createAbiMetadataFromContent/);
  assert.match(abiPage, /<AbiPage/);
  assert.match(editorialPage, /trust-pages\/source\.json/);
  assert.match(editorialPage, /createEditorialPolicyMetadataFromContent/);
  assert.match(editorialPage, /<EditorialPolicyPage/);
  assert.doesNotMatch(
    `${abiPage}\n${editorialPage}`,
    /__MT_CONFIG__|detectLocaleCode|querySelector/,
  );
});

test("R-W04 trust source contract uses stable semantic paths", async () => {
  const source = JSON.parse(
    await readFile(new URL("source.json", contentRoot), "utf8"),
  );
  assert.deepEqual(Object.keys(source), ["abi", "editorialPolicy"]);

  const leaves = stringLeavesOf(source);
  assert.equal(leaves.length > 0, true);
  for (const leaf of leaves) {
    assert.doesNotMatch(
      leaf.path,
      /(?:selector|sourceText|pageSegment|catalogSegment|occurrence|^|\.)(?:\d+)(?:\.|$)|[ >:[\]#]/,
      leaf.path,
    );
  }

  assert.equal(stringLeavesOf(source.abi).length, 45);
  assert.equal(stringLeavesOf(source.editorialPolicy).length, 52);
  assert.equal(source.abi.hero.imageAlt, "Abi Abiassi");
  assert.equal(
    source.editorialPolicy.hero.lastUpdated,
    "Last updated: May 6, 2026",
  );
});

test("R-W04 trust compiler emits complete deterministic route bundles", async () => {
  const { TRUST_PAGE_LOCALES, buildTrustPageArtifacts } =
    await import("../i18n/bespoke/compile-trust-pages.mjs");
  assert.deepEqual(TRUST_PAGE_LOCALES, [
    "de-de",
    "es-es",
    "fr-fr",
    "ja-jp",
    "pt-br",
  ]);

  const [first, second, source] = await Promise.all([
    buildTrustPageArtifacts(),
    buildTrustPageArtifacts(),
    readFile(new URL("source.json", contentRoot), "utf8").then(JSON.parse),
  ]);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(second.publication, first.publication);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const [routeKey, sourceContent] of Object.entries(source)) {
    const expectedMessages = stringLeavesOf(sourceContent).length;
    const coverage = first.publication.routes[routeKey];
    assert.equal(coverage.expectedMessages, expectedMessages, routeKey);
    for (const locale of TRUST_PAGE_LOCALES) {
      const messages = JSON.parse(
        first.outputs.get(`messages/${locale}/${routeKey}.json`),
      );
      assert.deepEqual(shapeOf(messages), shapeOf(sourceContent), routeKey);
      assert.equal(
        coverage.locales[locale].resolvedMessages,
        expectedMessages,
        `${routeKey}:${locale}`,
      );
      assert.equal(coverage.locales[locale].publishable, true);
      assert.match(coverage.locales[locale].sha256, /^[0-9a-f]{64}$/);
    }
  }
});

test("R-W04 French Abi lineage composes one book title with the 15th-century qualifier", async () => {
  const { buildTrustPageArtifacts } =
    await import("../i18n/bespoke/compile-trust-pages.mjs");
  const { outputs } = await buildTrustPageArtifacts();
  const messages = JSON.parse(outputs.get("messages/fr-fr/abi.json"));
  const lineage = messages.methodology.steps.lineage;
  const composed = [lineage.beforeBook, lineage.bookTitle, lineage.afterBook].join(
    " ",
  );

  assert.equal(
    composed.split(lineage.bookTitle).length - 1,
    1,
    "French lineage must render the emphasized book title exactly once",
  );
  assert.match(
    composed,
    /(?:15(?:e|ᵉ)|XVe|quinzième)\s+siècle/i,
    "French lineage must retain the 15th-century qualifier",
  );
});

test("R-W04 Japanese visible About labels use approved catalog Japanese", async () => {
  const { buildTrustPageArtifacts } =
    await import("../i18n/bespoke/compile-trust-pages.mjs");
  const { outputs } = await buildTrustPageArtifacts();
  const abi = JSON.parse(outputs.get("messages/ja-jp/abi.json"));
  const editorialPolicy = JSON.parse(
    outputs.get("messages/ja-jp/editorialPolicy.json"),
  );

  assert.equal(abi.footer.about, "概要");
  assert.equal(editorialPolicy.footer.about, "概要");
});

test("R-W04 checked-in trust artifacts and fail-closed loader are current", async () => {
  const { checkTrustPageArtifacts } =
    await import("../i18n/bespoke/compile-trust-pages.mjs");
  assert.deepEqual((await checkTrustPageArtifacts()).stale, []);

  const loader = await readFile(
    new URL("server/load-trust-page-content.ts", contentRoot),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 10);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("R-W04 route-owned trust renderers preserve schemas and localize only internal links", async () => {
  const [abiRenderer, editorialRenderer] = await Promise.all([
    readFile(new URL("abi-page.tsx", abiRouteRoot), "utf8"),
    readFile(new URL("editorial-policy-page.tsx", editorialRouteRoot), "utf8"),
  ]);
  const renderers = `${abiRenderer}\n${editorialRenderer}`;

  assert.match(abiRenderer, /export function createAbiMetadataFromContent/);
  assert.match(abiRenderer, /export function AbiPage/);
  assert.match(
    editorialRenderer,
    /export function createEditorialPolicyMetadataFromContent/,
  );
  assert.match(editorialRenderer, /export function EditorialPolicyPage/);
  assert.match(renderers, /resolveNativeInternalHref/);
  assert.match(renderers, /BreadcrumbList/);
  assert.match(abiRenderer, /["']Person["']/);
  assert.match(editorialRenderer, /["']Article["']/);
  assert.match(abiRenderer, /src=["']\/abi\.jpg["']/);
  assert.match(abiRenderer, /https:\/\/www\.linkedin\.com\/in\/abiabiassi\//);
  assert.match(abiRenderer, /https:\/\/x\.com\/abiassi_/);
  assert.match(editorialRenderer, /datePublished\s*=\s*["']2026-01-27["']/);
  assert.match(editorialRenderer, /dateModified\s*=\s*["']2026-05-06["']/);
  assert.match(editorialRenderer, /https:\/\/darkmatter\.is\//);
  assert.match(renderers, /glow-card rounded-\[32px\]/);
  assert.doesNotMatch(renderers, /["']use client["']/);
  assert.doesNotMatch(
    renderers,
    /__MT_CONFIG__|detectLocaleCode|querySelector/,
  );
});
