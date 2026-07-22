#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAudit,
  stableJson,
} from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const proofRoot = join(repoRoot, "src/i18n/content/proof");
const semanticMapPath = join(proofRoot, "semantic-map.json");
const overridesPath = join(proofRoot, "overrides.json");
const reviewedReplacementsPath = join(proofRoot, "reviewed-replacements.json");

const TARGET_ROUTES = ["/breathe/buteyko", "/for/anxiety"];
const EXPECTED_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const GENERATED_ROOTS = ["messages", "source-metadata"];
const GENERATED_FILES = ["manifest.json", "publication.json", "unresolved-report.json"];
const MESSAGE_ID_PATTERN = /^(?:breathe\.buteyko|for\.anxiety)(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const UNSAFE_TAGS = new Set(["embed", "iframe", "object", "script", "style"]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function sortedUnique(values) {
  return [...new Set(values)].sort(compareText);
}

function assertExactMembers(actual, expected, label) {
  const actualSorted = [...actual].sort(compareText);
  const expectedSorted = [...expected].sort(compareText);
  assert(
    JSON.stringify(actualSorted) === JSON.stringify(expectedSorted),
    `${label} mismatch. Expected ${expectedSorted.join(", ")}; received ${actualSorted.join(", ")}`,
  );
}

function messageFileStem(routeId) {
  return routeId.replaceAll(".", "-");
}

function interpolationTokens(value) {
  const braceTokens = value.match(/\{\{?[A-Za-z_][A-Za-z0-9_.-]*\}?\}/g) ?? [];
  const printfTokens = value.match(/%(?:\([A-Za-z_][A-Za-z0-9_.-]*\))?[sdif]/g) ?? [];
  return [...braceTokens, ...printfTokens].sort(compareText);
}

function numericTokens(value) {
  return (value.match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((token) => token.replace(",", "."))
    .sort(compareText);
}

function protectedSymbolTokens(value) {
  return (value.match(/[→←↔%]|[₀₁₂₃₄₅₆₇₈₉]+/g) ?? []).sort(compareText);
}

function containsAllTokens(actual, required) {
  const remaining = [...actual];
  for (const token of required) {
    const index = remaining.indexOf(token);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

function htmlTagTokens(value) {
  return [...value.matchAll(/<(\/)?([A-Za-z][A-Za-z0-9-]*)\b([^>]*)>/g)]
    .map((match) => ({
      kind: match[1] ? "close" : match[3].trimEnd().endsWith("/") ? "self" : "open",
      raw: match[0],
      tag: match[2].toLowerCase(),
    }));
}

function htmlTagStructure(value) {
  return htmlTagTokens(value).map((token) => `${token.kind}:${token.tag}`);
}

function htmlResourceDestinations(value) {
  return htmlTagTokens(value).flatMap((token) =>
    [...token.raw.matchAll(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi)]
      .map((match) => `${token.tag}:${match[1].toLowerCase()}:${match[3]}`),
  );
}

function markdownLinks(value) {
  return [...value.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map((match) => `${match[1] === "!" ? "image" : "link"}:${match[2]}`);
}

export function validateMessageSafety(
  source,
  translation,
  label = "translation",
  { preserveSourceTokens = false } = {},
) {
  assert(typeof translation === "string" && translation.trim().length > 0, `${label} must be non-empty`);
  assert(!translation.includes("\0"), `${label} contains a null byte`);

  assert(
    JSON.stringify(interpolationTokens(translation)) === JSON.stringify(interpolationTokens(source)),
    `${label} changed interpolation placeholders`,
  );
  if (preserveSourceTokens) {
    assert(
      containsAllTokens(numericTokens(translation), numericTokens(source)),
      `${label} changed numeric values`,
    );
    assert(
      containsAllTokens(protectedSymbolTokens(translation), protectedSymbolTokens(source)),
      `${label} changed protected symbols`,
    );
  }
  assert(
    JSON.stringify(markdownLinks(translation)) === JSON.stringify(markdownLinks(source)),
    `${label} changed Markdown link or image destinations`,
  );
  assert(
    JSON.stringify(htmlTagStructure(translation)) === JSON.stringify(htmlTagStructure(source)),
    `${label} changed HTML tag structure`,
  );
  assert(
    JSON.stringify(htmlResourceDestinations(translation)) === JSON.stringify(htmlResourceDestinations(source)),
    `${label} changed HTML link or media destinations`,
  );
  for (const { tag } of htmlTagTokens(translation)) {
    assert(!UNSAFE_TAGS.has(tag), `${label} contains unsafe <${tag}> markup`);
  }
  assert(!/\son[A-Za-z]+\s*=/i.test(translation), `${label} contains an HTML event handler`);
  assert(
    htmlResourceDestinations(translation).every((destination) => !/:javascript:/i.test(destination)),
    `${label} contains a javascript URL`,
  );

  const markdownMarkers = translation.match(/\]\(/g)?.length ?? 0;
  const hasMalformedMarkdownLink = markdownMarkers !== markdownLinks(translation).length;
  assert(!hasMalformedMarkdownLink, `${label} contains malformed Markdown link syntax`);
}

function validateSemanticMap(mapping, auditedPages) {
  assert(mapping?.schemaVersion === 1, "semantic-map.json must use schemaVersion 1");
  assert(Array.isArray(mapping.routes), "semantic-map.json routes must be an array");
  assertExactMembers(mapping.routes.map((route) => route.sourceRoute), TARGET_ROUTES, "Semantic map routes");

  const allMessageIds = [];
  for (const routeMap of mapping.routes) {
    assert(typeof routeMap.routeId === "string", `${routeMap.sourceRoute} is missing routeId`);
    assert(Array.isArray(routeMap.messages), `${routeMap.sourceRoute} messages must be an array`);
    const page = auditedPages.find((candidate) => candidate.route === routeMap.sourceRoute);
    assert(page, `Audit is missing ${routeMap.sourceRoute}`);
    const contentLeaves = page.leaves.filter((leaf) => leaf.category === "content");
    const contentPaths = contentLeaves.map((leaf) => leaf.path);
    const contentByPath = new Map(contentLeaves.map((leaf) => [leaf.path, leaf]));
    assertExactMembers(
      routeMap.messages.map((message) => message.sourcePath),
      contentPaths,
      `${routeMap.sourceRoute} semantic paths`,
    );

    for (const message of routeMap.messages) {
      assert(
        Object.keys(message).sort(compareText).join(",") === "messageId,reviewedSourceHash,sourcePath",
        `${routeMap.sourceRoute}:${message.sourcePath} has unsupported mapping properties`,
      );
      assert(
        /^[0-9a-f]{64}$/.test(message.reviewedSourceHash),
        `${routeMap.sourceRoute}:${message.sourcePath} has an invalid reviewedSourceHash`,
      );
      const currentLeaf = contentByPath.get(message.sourcePath);
      assert(
        message.reviewedSourceHash === sha256(currentLeaf.sourceText),
        `${routeMap.sourceRoute}:${message.sourcePath} English source changed. ` +
        `Keep or replace ${message.messageId} deliberately, then update reviewedSourceHash after review`,
      );
      assert(MESSAGE_ID_PATTERN.test(message.messageId), `Invalid semantic message ID ${message.messageId}`);
      assert(
        message.messageId.startsWith(`${routeMap.routeId}.`),
        `${message.messageId} does not belong to ${routeMap.routeId}`,
      );
      assert(!message.messageId.includes("["), `${message.messageId} contains an array index`);
      assert(
        !message.messageId.split(/[.-]/).some((segment) => /^\d+$/.test(segment)),
        `${message.messageId} contains a bare numeric segment`,
      );
      if (/\[\d+\]/.test(message.sourcePath)) {
        assert(
          !/(?:^|\.)(?:item-?)?\d+(?:\.|$)/.test(message.messageId),
          `${message.messageId} uses an ordered item number instead of a semantic name`,
        );
      }
      allMessageIds.push(message.messageId);
    }
  }
  assert(allMessageIds.length === new Set(allMessageIds).size, "Semantic message IDs must be globally unique");
}

function validateOverrides(overrides, mapping, auditedPages, locales) {
  assert(overrides?.schemaVersion === 1, "overrides.json must use schemaVersion 1");
  assertExactMembers(overrides.locales ?? [], locales, "Override locales");
  assert(Array.isArray(overrides.routes), "overrides.json routes must be an array");
  assertExactMembers(overrides.routes.map((route) => route.sourceRoute), TARGET_ROUTES, "Override routes");

  for (const routeMap of mapping.routes) {
    const page = auditedPages.find((candidate) => candidate.route === routeMap.sourceRoute);
    const routeOverrides = overrides.routes.find((candidate) => candidate.sourceRoute === routeMap.sourceRoute);
    assert(routeOverrides, `Overrides are missing ${routeMap.sourceRoute}`);
    assert(routeOverrides.routeId === routeMap.routeId, `Override route ID mismatch for ${routeMap.sourceRoute}`);
    const idByPath = new Map(routeMap.messages.map((message) => [message.sourcePath, message.messageId]));
    const unsafeLeaves = page.leaves.filter(
      (leaf) => leaf.category === "content" && !leaf.bridge.startsWith("safe_"),
    );
    assertExactMembers(
      routeOverrides.messages.map((message) => message.sourcePath),
      unsafeLeaves.map((leaf) => leaf.path),
      `${routeMap.sourceRoute} override paths`,
    );

    for (const override of routeOverrides.messages) {
      const leaf = unsafeLeaves.find((candidate) => candidate.path === override.sourcePath);
      assert(leaf, `Unexpected override ${routeMap.sourceRoute}:${override.sourcePath}`);
      assert(override.messageId === idByPath.get(override.sourcePath), `Override message ID drift at ${override.sourcePath}`);
      const expectedReason = leaf.bridge === "unsafe_translation_conflict"
        ? "catalog_translation_conflict"
        : "catalog_source_miss";
      assert(override.reason === expectedReason, `Override reason drift at ${override.sourcePath}`);
      assertExactMembers(Object.keys(override.translations ?? {}), locales, `Override locales at ${override.sourcePath}`);
      for (const locale of locales) {
        const value = override.translations[locale];
        assert(value === null || typeof value === "string", `${override.messageId}:${locale} must be string or null`);
        if (value !== null) {
          validateMessageSafety(
            leaf.sourceText,
            value,
            `${override.messageId}:${locale}`,
            { preserveSourceTokens: true },
          );
        }
      }
    }
  }
}

function validateReviewedReplacements(replacements, mapping, auditedPages, locales) {
  assert(replacements?.schemaVersion === 1, "reviewed-replacements.json must use schemaVersion 1");
  assertExactMembers(replacements.locales ?? [], locales, "Reviewed replacement locales");
  assert(Array.isArray(replacements.routes), "reviewed-replacements.json routes must be an array");
  assertExactMembers(
    replacements.routes.map((route) => route.sourceRoute),
    TARGET_ROUTES,
    "Reviewed replacement routes",
  );

  const seenMessageIds = new Set();
  for (const routeMap of mapping.routes) {
    const page = auditedPages.find((candidate) => candidate.route === routeMap.sourceRoute);
    const routeReplacements = replacements.routes.find(
      (candidate) => candidate.sourceRoute === routeMap.sourceRoute,
    );
    assert(routeReplacements, `Reviewed replacements are missing ${routeMap.sourceRoute}`);
    assert(
      routeReplacements.routeId === routeMap.routeId,
      `Reviewed replacement route ID mismatch for ${routeMap.sourceRoute}`,
    );
    const messageByPath = new Map(routeMap.messages.map((message) => [message.sourcePath, message]));
    const leafByPath = new Map(page.leaves.map((leaf) => [leaf.path, leaf]));

    for (const replacement of routeReplacements.messages) {
      assert(
        Object.keys(replacement).sort(compareText).join(",") ===
          "messageId,reason,sourcePath,translations",
        `${routeMap.sourceRoute}:${replacement.sourcePath} has unsupported replacement properties`,
      );
      const mappingEntry = messageByPath.get(replacement.sourcePath);
      const leaf = leafByPath.get(replacement.sourcePath);
      assert(mappingEntry, `Unexpected reviewed replacement ${routeMap.sourceRoute}:${replacement.sourcePath}`);
      assert(leaf?.category === "content", `${replacement.sourcePath} is not translatable content`);
      assert(leaf.bridge.startsWith("safe_"), `${replacement.sourcePath} is already an unresolved override`);
      assert(
        replacement.messageId === mappingEntry.messageId,
        `Reviewed replacement message ID drift at ${replacement.sourcePath}`,
      );
      assert(!seenMessageIds.has(replacement.messageId), `Duplicate reviewed replacement ${replacement.messageId}`);
      seenMessageIds.add(replacement.messageId);
      assert(
        ["regional_safety_resource", "translation_quality_correction"].includes(
          replacement.reason,
        ),
        `Unsupported reviewed replacement reason at ${replacement.sourcePath}`,
      );
      assertExactMembers(
        Object.keys(replacement.translations ?? {}),
        locales,
        `Reviewed replacement locales at ${replacement.sourcePath}`,
      );
      for (const locale of locales) {
        const value = replacement.translations[locale];
        validateMessageSafety(leaf.sourceText, value, `${replacement.messageId}:${locale}`);
        if (replacement.reason === "regional_safety_resource") {
          assert(
            numericTokens(leaf.sourceText).length > 0,
            `${replacement.messageId} regional replacement source has no numeric resource`,
          );
          assert(
            numericTokens(value).length > 0,
            `${replacement.messageId}:${locale} must name a reviewed regional resource`,
          );
          assert(
            JSON.stringify(numericTokens(value)) !== JSON.stringify(numericTokens(leaf.sourceText)),
            `${replacement.messageId}:${locale} did not replace the source-region resource`,
          );
        }
      }
    }
  }
}

function provenanceFor(leaf, locales, snapshotUpdatedThrough) {
  if (leaf.bridge.startsWith("safe_")) {
    return {
      auditBridge: leaf.bridge,
      catalogCandidates: Object.fromEntries(
        locales.map((locale) => [
          locale,
          leaf.localeMatches[locale].candidates.map((candidate) => ({
            catalogSegmentId: candidate.catalogSegmentId,
            contextKey: candidate.contextKey,
            occurrenceKey: candidate.occurrenceKey,
            sourceHash: candidate.sourceHash,
          })),
        ]),
      ),
      catalogSnapshotUpdatedThrough: snapshotUpdatedThrough,
      kind: "masstranslate-catalog-exact-match",
      match: leaf.match,
    };
  }
  return {
    auditBridge: leaf.bridge,
    catalogSnapshotUpdatedThrough: snapshotUpdatedThrough,
    kind: leaf.bridge === "unsafe_translation_conflict"
      ? "masstranslate-catalog-conflict-requires-override"
      : "masstranslate-catalog-source-miss-requires-override",
    match: leaf.match,
  };
}

function statusFor(leaf, override, replacement, locales) {
  if (replacement) return "repo-reviewed-regional-safety-replacement";
  if (leaf.bridge === "safe_unique") return "seeded-safe-unique";
  if (leaf.bridge === "safe_equivalent_ambiguity") return "seeded-safe-equivalent-ambiguity";
  const supplied = locales.filter((locale) => override.translations[locale] !== null).length;
  if (supplied === locales.length) return "repo-override-complete";
  if (supplied > 0) return "repo-override-partial";
  return leaf.bridge === "unsafe_translation_conflict"
    ? "unresolved-catalog-conflict"
    : "unresolved-catalog-source-miss";
}

function translationFor(leaf, override, replacement, locale) {
  if (replacement) {
    const translation = replacement.translations[locale];
    validateMessageSafety(leaf.sourceText, translation, `${leaf.path}:${locale}`);
    return translation;
  }
  if (!leaf.bridge.startsWith("safe_")) return override.translations[locale];
  const localeMatch = leaf.localeMatches[locale];
  assert(localeMatch.translationTexts.length === 1, `${leaf.path}:${locale} must resolve to exactly one safe value`);
  const translation = localeMatch.translationTexts[0];
  const selectedCandidates = localeMatch.candidates.filter(
    (candidate) => candidate.translation?.text === translation,
  );
  assert(selectedCandidates.length > 0, `${leaf.path}:${locale} lacks selected catalog provenance`);
  assert(
    selectedCandidates.every(
      (candidate) => candidate.translation?.isApproved === true && candidate.translation?.needsReview === false,
    ),
    `${leaf.path}:${locale} is not approved and review-clean`,
  );
  validateMessageSafety(leaf.sourceText, translation, `${leaf.path}:${locale}`);
  return translation;
}

function makeFile(content, role) {
  return {
    bytes: Buffer.byteLength(content),
    content,
    role,
    sha256: sha256(content),
  };
}

export async function buildProofArtifacts() {
  const [audit, mappingText, overridesText, reviewedReplacementsText] = await Promise.all([
    buildAudit(),
    readFile(semanticMapPath, "utf8"),
    readFile(overridesPath, "utf8"),
    readFile(reviewedReplacementsPath, "utf8"),
  ]);
  const mapping = JSON.parse(mappingText);
  const overrides = JSON.parse(overridesText);
  const reviewedReplacements = JSON.parse(reviewedReplacementsText);
  const auditedPages = audit.pages.filter((page) => TARGET_ROUTES.includes(page.route));
  const locales = [...audit.locales].sort(compareText);

  assertExactMembers(locales, EXPECTED_LOCALES, "Proof locales");
  assertExactMembers(auditedPages.map((page) => page.route), TARGET_ROUTES, "Audited proof routes");
  validateSemanticMap(mapping, auditedPages);
  validateOverrides(overrides, mapping, auditedPages, locales);
  validateReviewedReplacements(reviewedReplacements, mapping, auditedPages, locales);

  const outputs = new Map();
  const routeCoverage = {};
  const unresolvedRoutes = [];
  let expectedMessages = 0;
  let localeMessageValues = 0;
  let overrideMessages = 0;
  let reviewedReplacementMessages = 0;
  let safeSeedMessages = 0;
  let unresolvedMessages = 0;

  for (const routeMap of mapping.routes) {
    const page = auditedPages.find((candidate) => candidate.route === routeMap.sourceRoute);
    const routeOverrides = overrides.routes.find((candidate) => candidate.sourceRoute === routeMap.sourceRoute);
    const routeReplacements = reviewedReplacements.routes.find(
      (candidate) => candidate.sourceRoute === routeMap.sourceRoute,
    );
    const mappingByPath = new Map(routeMap.messages.map((message) => [message.sourcePath, message]));
    const overrideByPath = new Map(routeOverrides.messages.map((message) => [message.sourcePath, message]));
    const replacementByPath = new Map(
      routeReplacements.messages.map((message) => [message.sourcePath, message]),
    );
    const contentLeaves = page.leaves.filter((leaf) => leaf.category === "content");
    const safeLeaves = contentLeaves.filter((leaf) => leaf.bridge.startsWith("safe_"));
    const overrideLeaves = contentLeaves.filter((leaf) => !leaf.bridge.startsWith("safe_"));
    const unresolvedLeaves = overrideLeaves.filter((leaf) => {
      const override = overrideByPath.get(leaf.path);
      return locales.some((locale) => override.translations[locale] === null);
    });
    const reviewedReplacementLeaves = safeLeaves.filter((leaf) => replacementByPath.has(leaf.path));
    expectedMessages += contentLeaves.length;
    safeSeedMessages += safeLeaves.length;
    overrideMessages += overrideLeaves.length;
    reviewedReplacementMessages += reviewedReplacementLeaves.length;
    unresolvedMessages += unresolvedLeaves.length;

    const sourceMetadata = {
      messages: contentLeaves.map((leaf) => {
        const mappingEntry = mappingByPath.get(leaf.path);
        const override = overrideByPath.get(leaf.path);
        const replacement = replacementByPath.get(leaf.path);
        return {
          messageId: mappingEntry.messageId,
          provenance: provenanceFor(leaf, locales, audit.inputs.catalogSnapshotUpdatedThrough),
          sourceHash: sha256(leaf.sourceText),
          sourcePath: leaf.path,
          sourceText: leaf.sourceText,
          status: statusFor(leaf, override, replacement, locales),
        };
      }),
      routeId: routeMap.routeId,
      schemaVersion: 1,
      sourceRoute: routeMap.sourceRoute,
    };
    const metadataPath = `source-metadata/${messageFileStem(routeMap.routeId)}.json`;
    outputs.set(metadataPath, makeFile(stableJson(sourceMetadata), "build-time-source-metadata"));

    const localeCoverage = {};
    for (const locale of locales) {
      const messages = {};
      for (const leaf of contentLeaves) {
        const mappingEntry = mappingByPath.get(leaf.path);
        const override = overrideByPath.get(leaf.path);
        const replacement = replacementByPath.get(leaf.path);
        const translation = translationFor(leaf, override, replacement, locale);
        if (translation !== null) messages[mappingEntry.messageId] = translation;
      }
      const messagePath = `messages/${locale}/${messageFileStem(routeMap.routeId)}.json`;
      const messageFile = makeFile(stableJson(messages), "runtime-messages");
      outputs.set(messagePath, messageFile);
      localeMessageValues += Object.keys(messages).length;
      const missingMessageIds = contentLeaves
        .map((leaf) => mappingByPath.get(leaf.path).messageId)
        .filter((messageId) => !(messageId in messages));
      localeCoverage[locale] = {
        expectedMessages: contentLeaves.length,
        messageFile: messagePath,
        missingMessageIds,
        missingMessages: missingMessageIds.length,
        presentMessages: Object.keys(messages).length,
        publishable: missingMessageIds.length === 0,
        sha256: messageFile.sha256,
      };
    }

    routeCoverage[routeMap.sourceRoute] = {
      expectedMessages: contentLeaves.length,
      locales: localeCoverage,
      overrideMessages: overrideLeaves.length,
      reviewedReplacementMessages: reviewedReplacementLeaves.length,
      routeId: routeMap.routeId,
      safeSeedMessages: safeLeaves.length,
      unresolvedMessages: unresolvedLeaves.length,
    };
    if (unresolvedLeaves.length > 0) {
      unresolvedRoutes.push({
        messages: unresolvedLeaves.map((leaf) => {
          const mappingEntry = mappingByPath.get(leaf.path);
          const override = overrideByPath.get(leaf.path);
          return {
            auditBridge: leaf.bridge,
            messageId: mappingEntry.messageId,
            missingLocales: locales.filter((locale) => override.translations[locale] === null),
            reason: override.reason,
            sourceHash: sha256(leaf.sourceText),
            sourcePath: leaf.path,
            sourceText: leaf.sourceText,
          };
        }),
        routeId: routeMap.routeId,
        sourceRoute: routeMap.sourceRoute,
      });
    }
  }

  const unresolvedReport = {
    routes: unresolvedRoutes,
    schemaVersion: 1,
    summary: {
      locales,
      routes: unresolvedRoutes.length,
      unresolvedMessages,
      unresolvedValues: unresolvedRoutes.reduce(
        (total, route) => total + route.messages.reduce(
          (routeTotal, message) => routeTotal + message.missingLocales.length,
          0,
        ),
        0,
      ),
    },
  };
  outputs.set(
    "unresolved-report.json",
    makeFile(stableJson(unresolvedReport), "build-time-unresolved-report"),
  );

  const publication = {
    locales,
    routes: Object.fromEntries(
      Object.entries(routeCoverage).map(([sourceRoute, route]) => [
        sourceRoute,
        {
          locales: Object.fromEntries(
            Object.entries(route.locales).map(([locale, coverage]) => [
              locale,
              {
                expectedMessages: coverage.expectedMessages,
                missingMessages: coverage.missingMessages,
                presentMessages: coverage.presentMessages,
                publishable: coverage.publishable,
              },
            ]),
          ),
          routeId: route.routeId,
        },
      ]),
    ),
    schemaVersion: 1,
  };
  outputs.set("publication.json", makeFile(stableJson(publication), "runtime-publication-gate"));

  const files = [...outputs.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([path, file]) => ({
      bytes: file.bytes,
      path,
      role: file.role,
      sha256: file.sha256,
    }));
  const manifestWithoutDigest = {
    allLocaleRoutesPublishable: Object.values(routeCoverage).every((route) =>
      Object.values(route.locales).every((locale) => locale.publishable),
    ),
    files,
    generatedFrom: {
      catalogSnapshotUpdatedThrough: audit.inputs.catalogSnapshotUpdatedThrough,
      semanticMapSha256: sha256(mappingText),
      structuredAuditDigest: audit.digest,
      tenantId: audit.inputs.tenantId,
      overridesSha256: sha256(overridesText),
      reviewedReplacementsSha256: sha256(reviewedReplacementsText),
    },
    locales,
    routes: routeCoverage,
    schemaVersion: 1,
    summary: {
      expectedMessages,
      localeMessageValues,
      overrideMessages,
      reviewedReplacementMessages,
      routes: mapping.routes.length,
      safeSeedMessages,
      unresolvedMessages,
    },
  };
  const manifest = {
    ...manifestWithoutDigest,
    digest: sha256(stableJson(manifestWithoutDigest)),
  };
  outputs.set("manifest.json", makeFile(stableJson(manifest), "coverage-manifest"));

  return { manifest, outputs, unresolvedReport };
}

async function listFiles(root, base = root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path, base));
    else if (entry.isFile()) files.push(relative(base, path));
  }
  return files.sort(compareText);
}

async function managedDiskFiles() {
  const nested = (
    await Promise.all(GENERATED_ROOTS.map(async (root) =>
      (await listFiles(join(proofRoot, root))).map((path) => `${root}/${path}`),
    ))
  ).flat();
  const topLevel = [];
  for (const path of GENERATED_FILES) {
    try {
      await readFile(join(proofRoot, path));
      topLevel.push(path);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return [...nested, ...topLevel].sort(compareText);
}

export async function checkGeneratedArtifacts(result) {
  result ??= await buildProofArtifacts();
  const expectedPaths = [...result.outputs.keys()].sort(compareText);
  const actualPaths = await managedDiskFiles();
  assertExactMembers(actualPaths, expectedPaths, "Generated proof files");
  for (const [path, expected] of result.outputs) {
    const actual = await readFile(join(proofRoot, path), "utf8");
    assert(actual === expected.content, `${path} is stale; run semantic proof generation`);
  }
  return result;
}

export async function writeGeneratedArtifacts(result) {
  result ??= await buildProofArtifacts();
  const expectedPaths = new Set(result.outputs.keys());
  for (const path of await managedDiskFiles()) {
    if (!expectedPaths.has(path)) await rm(join(proofRoot, path));
  }
  for (const [path, file] of result.outputs) {
    const destination = join(proofRoot, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
  }
  return result;
}

function usage() {
  return `Usage: node scripts/i18n/semantic-proof/build-semantic-proof.mjs [--check | --write]\n\n` +
    `--check  Verify checked-in generated proof artifacts without writing (default).\n` +
    `--write  Regenerate artifacts from the frozen semantic map and override scaffold.\n`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(usage());
    return;
  }
  const unknown = args.filter((arg) => arg !== "--check" && arg !== "--write");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`);
  assert(!(args.includes("--check") && args.includes("--write")), "Choose either --check or --write");

  const result = args.includes("--write")
    ? await writeGeneratedArtifacts()
    : await checkGeneratedArtifacts();
  process.stdout.write(stableJson({
    digest: result.manifest.digest,
    mode: args.includes("--write") ? "write" : "check",
    summary: result.manifest.summary,
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

export { MESSAGE_ID_PATTERN, UUID_PATTERN };
