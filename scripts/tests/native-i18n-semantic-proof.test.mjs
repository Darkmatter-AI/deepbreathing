import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildAudit,
  stableJson,
} from "../i18n/audit-structured-i18n-mapping.mjs";
import {
  buildProofArtifacts,
  checkGeneratedArtifacts,
  MESSAGE_ID_PATTERN,
  UUID_PATTERN,
  validateMessageSafety,
} from "../i18n/semantic-proof/build-semantic-proof.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const proofRoot = join(repoRoot, "src/i18n/content/proof");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("builds the two-route semantic proof deterministically", async () => {
  const first = await buildProofArtifacts();
  const second = await buildProofArtifacts();

  assert.deepEqual(second.manifest, first.manifest);
  assert.deepEqual([...second.outputs], [...first.outputs]);
  assert.deepEqual(first.manifest.summary, {
    expectedMessages: 190,
    localeMessageValues: 950,
    overrideMessages: 49,
    reviewedReplacementMessages: 1,
    routes: 2,
    safeSeedMessages: 141,
    unresolvedMessages: 0,
  });
  assert.equal(Math.round((141 / 190) * 1_000) / 10, 74.2);
  assert.equal(first.manifest.routes["/breathe/buteyko"].expectedMessages, 99);
  assert.equal(first.manifest.routes["/breathe/buteyko"].safeSeedMessages, 77);
  assert.equal(first.manifest.routes["/breathe/buteyko"].overrideMessages, 22);
  assert.equal(first.manifest.routes["/breathe/buteyko"].reviewedReplacementMessages, 0);
  assert.equal(first.manifest.routes["/breathe/buteyko"].unresolvedMessages, 0);
  assert.equal(first.manifest.routes["/for/anxiety"].expectedMessages, 91);
  assert.equal(first.manifest.routes["/for/anxiety"].safeSeedMessages, 64);
  assert.equal(first.manifest.routes["/for/anxiety"].overrideMessages, 27);
  assert.equal(first.manifest.routes["/for/anxiety"].reviewedReplacementMessages, 1);
  assert.equal(first.manifest.routes["/for/anxiety"].unresolvedMessages, 0);
  assert.equal(first.outputs.size, 15);
});

test("keeps semantic IDs frozen, complete, and descriptive for ordered content", async () => {
  const mapping = JSON.parse(await readFile(join(proofRoot, "semantic-map.json"), "utf8"));
  const audit = await buildAudit();
  const routes = Object.fromEntries(mapping.routes.map((route) => [route.sourceRoute, route]));
  assert.equal(routes["/breathe/buteyko"].messages.length, 99);
  assert.equal(routes["/for/anxiety"].messages.length, 91);

  const messages = mapping.routes.flatMap((route) => route.messages);
  assert.equal(new Set(messages.map((message) => message.messageId)).size, 190);
  for (const route of mapping.routes) {
    const page = audit.pages.find((candidate) => candidate.route === route.sourceRoute);
    const sourceByPath = new Map(
      page.leaves
        .filter((leaf) => leaf.category === "content")
        .map((leaf) => [leaf.path, leaf.sourceText]),
    );
    for (const message of route.messages) {
      assert.deepEqual(Object.keys(message).sort(), ["messageId", "reviewedSourceHash", "sourcePath"]);
      assert.match(message.reviewedSourceHash, /^[0-9a-f]{64}$/);
      assert.equal(message.reviewedSourceHash, sha256(sourceByPath.get(message.sourcePath)));
    }
  }
  for (const message of messages) {
    assert.match(message.messageId, MESSAGE_ID_PATTERN);
    assert.doesNotMatch(message.messageId, /\[/);
    assert.equal(
      message.messageId.split(/[.-]/).some((segment) => /^\d+$/.test(segment)),
      false,
    );
    if (/\[\d+\]/.test(message.sourcePath)) {
      assert.doesNotMatch(message.messageId, /(?:^|\.)(?:item-?)?\d+(?:\.|$)/);
    }
  }

  assert.equal(
    routes["/breathe/buteyko"].messages.find(
      (message) => message.sourcePath === "howTo.steps[2].instruction",
    ).messageId,
    "breathe.buteyko.how-to.steps.measure-control-pause.instruction",
  );
  assert.equal(
    routes["/for/anxiety"].messages.find(
      (message) => message.sourcePath === "science.points[2].explanation",
    ).messageId,
    "for.anxiety.science.points.rumination-loop.explanation",
  );
});

test("keeps every audit gap explicit and fully supplied in the override scaffold", async () => {
  const overrides = JSON.parse(await readFile(join(proofRoot, "overrides.json"), "utf8"));
  const messages = overrides.routes.flatMap((route) => route.messages);

  assert.deepEqual(overrides.locales, ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"]);
  assert.equal(messages.length, 49);
  assert.equal(messages.filter((message) => message.reason === "catalog_source_miss").length, 49);
  for (const message of messages) {
    assert.deepEqual(Object.keys(message.translations).sort(), overrides.locales);
    assert.equal(Object.values(message.translations).every(
      (value) => typeof value === "string" && value.trim() !== "",
    ), true);
  }
});

test("supersedes unsafe regional crisis resources through an explicit reviewed layer", async () => {
  const replacements = JSON.parse(
    await readFile(join(proofRoot, "reviewed-replacements.json"), "utf8"),
  );
  const messages = replacements.routes.flatMap((route) => route.messages);
  assert.equal(messages.length, 1);
  const [replacement] = messages;
  assert.equal(replacement.messageId, "for.anxiety.disclaimer");
  assert.equal(replacement.sourcePath, "disclaimer");
  assert.equal(replacement.reason, "regional_safety_resource");
  assert.deepEqual(
    Object.keys(replacement.translations).sort(),
    ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"],
  );
  assert.match(replacement.translations["de-de"], /116 123/);
  assert.match(replacement.translations["es-es"], /024/);
  assert.match(replacement.translations["fr-fr"], /3114/);
  assert.match(replacement.translations["ja-jp"], /0570-064-556/);
  assert.match(replacement.translations["pt-br"], /188/);
  assert.equal(Object.values(replacement.translations).some((value) => /988/.test(value)), false);
});

test("runtime message maps contain only semantic IDs and localized values", async () => {
  const manifest = JSON.parse(await readFile(join(proofRoot, "manifest.json"), "utf8"));
  const runtimeFiles = manifest.files.filter((file) => file.role === "runtime-messages");
  assert.equal(runtimeFiles.length, 10);

  const forbiddenRuntimeKeys = new Set([
    "catalogSegmentId",
    "catalogTranslationId",
    "contextKey",
    "elementSelector",
    "fieldKey",
    "occurrenceKey",
    "pageSegmentId",
    "sourceHash",
    "sourceText",
  ]);
  for (const file of runtimeFiles) {
    const raw = await readFile(join(proofRoot, file.path), "utf8");
    const messages = JSON.parse(raw);
    assert.equal(Array.isArray(messages), false);
    for (const [messageId, value] of Object.entries(messages)) {
      assert.match(messageId, MESSAGE_ID_PATTERN);
      assert.equal(typeof value, "string");
      assert.notEqual(value.trim(), "");
      assert.equal(forbiddenRuntimeKeys.has(messageId), false);
    }
    for (const key of forbiddenRuntimeKeys) assert.equal(Object.hasOwn(messages, key), false);
    assert.doesNotMatch(raw, UUID_PATTERN);
    assert.doesNotMatch(raw, /querySelector|lookupBySource|replaceSourceText|source-text/i);
  }

  const publicationFile = manifest.files.find((file) => file.role === "runtime-publication-gate");
  assert.ok(publicationFile);
  const publicationRaw = await readFile(join(proofRoot, publicationFile.path), "utf8");
  assert.doesNotMatch(publicationRaw, UUID_PATTERN);
  assert.doesNotMatch(
    publicationRaw,
    /catalog|contextKey|elementSelector|occurrenceKey|sourceHash|sourceText|querySelector|lookupBySource/i,
  );
});

test("records source provenance separately and publishes only complete proof bundles", async () => {
  const manifest = JSON.parse(await readFile(join(proofRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.allLocaleRoutesPublishable, true);
  for (const route of Object.values(manifest.routes)) {
    for (const locale of Object.values(route.locales)) {
      assert.equal(locale.publishable, true);
      assert.equal(locale.presentMessages + locale.missingMessages, locale.expectedMessages);
      assert.equal(locale.missingMessages, 0);
    }
  }

  const unresolved = JSON.parse(
    await readFile(join(proofRoot, "unresolved-report.json"), "utf8"),
  );
  assert.deepEqual(unresolved.routes, []);
  assert.equal(unresolved.summary.routes, 0);
  assert.equal(unresolved.summary.unresolvedMessages, 0);
  assert.equal(unresolved.summary.unresolvedValues, 0);

  const buteykoMetadata = JSON.parse(
    await readFile(join(proofRoot, "source-metadata/breathe-buteyko.json"), "utf8"),
  );
  assert.equal(buteykoMetadata.messages.length, 99);
  assert.equal(buteykoMetadata.messages.every((message) => message.sourceText && message.sourceHash), true);
  assert.equal(
    buteykoMetadata.messages.filter((message) => message.status.startsWith("seeded-safe-")).length,
    77,
  );
  assert.equal(
    buteykoMetadata.messages.filter((message) => message.status === "repo-override-complete").length,
    22,
  );
  assert.equal(
    buteykoMetadata.messages.some(
      (message) => message.provenance.kind === "masstranslate-catalog-exact-match",
    ),
    true,
  );

  const loader = await readFile(
    join(proofRoot, "server/load-proof-messages.ts"),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.match(loader, /import publication from "\.\.\/publication\.json"/);
  assert.doesNotMatch(loader, /manifest\.json|source-metadata|catalog/);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 10);
  assert.equal((loader.match(/from "\.\.\/messages\//g) ?? []).length, 0);
  assert.match(loader, /export async function loadProofMessages/);
  assert.match(loader, /await bundleLoaders\[route\]\[locale\]\(\)/);
  assert.match(loader, /!coverage\.publishable \|\| coverage\.missingMessages !== 0/);
  assert.match(loader, /refusing English fallback/);
});

test("validates placeholders and rich-text structure", () => {
  assert.doesNotThrow(() => validateMessageSafety(
    'Hello {name}. Hold 4–7 seconds → 8% CO₂. [Read](https://example.com). <a href="/more"><strong>Now</strong></a> %s',
    'Olá {name}. Segure por 4–7 segundos → 8 % CO₂. [Ler](https://example.com). <a href="/more"><strong>Agora</strong></a> %s',
    "translation",
    { preserveSourceTokens: true },
  ));
  assert.throws(
    () => validateMessageSafety("Hello {name}", "Olá {person}"),
    /placeholders/,
  );
  assert.throws(
    () => validateMessageSafety("[Read](https://example.com)", "[Ler](https://invalid.example)"),
    /Markdown/,
  );
  assert.throws(
    () => validateMessageSafety("Plain text", "<script>alert(1)</script>"),
    /HTML tag structure|unsafe/,
  );
  assert.throws(
    () => validateMessageSafety('<a href="/safe">Read</a>', '<a href="/other">Ler</a>'),
    /HTML link/,
  );
  assert.throws(
    () => validateMessageSafety("Plain text", "Broken](https://example.com"),
    /malformed Markdown/,
  );
  assert.throws(
    () => validateMessageSafety(
      "Hold for 4 seconds",
      "Segure por 5 segundos",
      "translation",
      { preserveSourceTokens: true },
    ),
    /numeric values/,
  );
  assert.throws(
    () => validateMessageSafety(
      "Inhale → exhale CO₂",
      "Inspire e expire CO2",
      "translation",
      { preserveSourceTokens: true },
    ),
    /protected symbols/,
  );
});

test("pins file checksums, manifest digest, and checked-in generation", async () => {
  const manifest = JSON.parse(await readFile(join(proofRoot, "manifest.json"), "utf8"));
  for (const file of manifest.files) {
    const content = await readFile(join(proofRoot, file.path));
    assert.equal(content.byteLength, file.bytes, file.path);
    assert.equal(sha256(content), file.sha256, file.path);
  }
  const { digest, ...withoutDigest } = manifest;
  assert.equal(sha256(stableJson(withoutDigest)), digest);
  await checkGeneratedArtifacts();

  const check = spawnSync(
    process.execPath,
    ["scripts/i18n/semantic-proof/build-semantic-proof.mjs", "--check"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /"mode": "check"/);
});
