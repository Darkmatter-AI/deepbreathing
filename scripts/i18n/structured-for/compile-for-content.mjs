#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { buildAudit, stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outputRoot = join(repoRoot, "src/i18n/content/use-cases");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const manualRoot = join(outputRoot, "manual");
const replacementRoot = join(outputRoot, "reviewed-replacements");
const sourceFilePath = join(repoRoot, "src/data/use-case-pages.ts");
const proofRoot = join(repoRoot, "src/i18n/content/proof");
const routeManifestPath = join(repoRoot, "src/i18n/route-manifest.ts");

export const FOR_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

const MODE_NAMES = {
  Belly: "Belly Breathing",
  Box: "Box Breathing",
  BreathOfFire: "Breath of Fire",
  Buteyko: "Buteyko Breathing",
  Coherent: "Coherent Breathing",
  NadiShodhana: "Nadi Shodhana",
  PursedLip: "Pursed Lip Breathing",
  Relax: "4-7-8 Relax",
  Sigh: "Physiological Sigh",
  Tummo: "Tummo Breathing",
  Ujjayi: "Ujjayi Breathing",
  WimHof: "Wim Hof Breathing",
};

const HEAD_OCCURRENCES = {
  "meta.title": "head:title",
  "meta.description": "head:meta:name:description",
  "meta.ogTitle": "head:meta:property:og:title",
  "meta.ogDescription": "head:meta:property:og:description",
  "meta.twitterTitle": "head:meta:name:twitter:title",
  "meta.twitterDescription": "head:meta:name:twitter:description",
};

const ANXIETY_PROOF_HEAD_PATHS = new Set([
  "meta.ogDescription",
  "meta.twitterDescription",
]);

const BASE_CHROME = {
  "chrome.shared.brand-eyebrow": "DEEP BREATHING EXERCISES",
  "chrome.shared.breadcrumb-home": "Home",
  "chrome.shared.date-last-updated": "Last updated",
  "chrome.shared.date-reviewed-by": "Reviewed by",
  "chrome.shared.quick-sessions": "Quick sessions",
  "chrome.shared.quick-sessions-description":
    "Short on time? Try a timed session:",
  "chrome.shared.one-minute": "1 minute",
  "chrome.shared.two-minutes": "2 minutes",
  "chrome.shared.five-minutes": "5 minutes",
  "chrome.shared.share-exercise": "Share this exercise",
  "chrome.shared.safety-warning":
    "Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths.",
  "chrome.shared.footer-techniques": "Techniques",
  "chrome.shared.footer-guides": "Guides",
  "chrome.shared.footer-app": "App",
  "chrome.shared.footer-about": "About",
  "chrome.shared.footer-about-abi": "About Abi",
  "chrome.shared.footer-embed": "Embed",
  "chrome.shared.footer-privacy": "Privacy",
  "chrome.use-case.breadcrumb-use-cases": "Use Cases",
  "chrome.use-case.share-with-someone": "Share with someone",
  "chrome.use-case.important": "Important",
  "chrome.use-case.problem": "The Problem",
  "chrome.use-case.common-symptoms": "Common symptoms",
  "chrome.use-case.solution": "The Solution",
  "chrome.use-case.why-this-technique": "Why this technique",
  "chrome.use-case.start-practicing": "Start practicing now →",
  "chrome.use-case.why-it-works": "Why It Works",
  "chrome.use-case.step-by-step": "Step-by-Step",
  "chrome.use-case.how-to-practice": "How to Practice",
  "chrome.use-case.pro-tips": "Pro tips",
  "chrome.use-case.research-references": "Research & References",
  "chrome.use-case.scientific-sources": "Scientific Sources",
  "chrome.use-case.faq": "FAQ",
  "chrome.use-case.common-questions": "Common Questions",
  "chrome.use-case.more-guides": "More Breathing Guides",
  "chrome.use-case.learn-more-action": "Learn more →",
  "chrome.use-case.in-depth-guides": "In-Depth Guides",
  "chrome.use-case.read-guide-action": "Read guide →",
  "chrome.use-case.ready-to-practice": "Ready to practice?",
  "chrome.use-case.start-session": "Start Your Session",
  "chrome.use-case.visualizer-description":
    "Use the interactive visualizer above to guide your breathing. Follow the animation and let your body relax.",
  "chrome.use-case.go-to-visualizer": "Go to visualizer →",
};

const SHARED_NEW_CHROME = new Set([
  "chrome.use-case.watch-learn",
  "chrome.use-case.back-to-holiday-hub",
  "chrome.use-case.holiday-ready-sessions",
  "chrome.use-case.holiday-30s-reset",
  "chrome.use-case.holiday-1min-breather",
  "chrome.use-case.holiday-2min-calm-down",
  "chrome.use-case.try-box-app",
  "chrome.use-case.try-coherent-app",
  "chrome.use-case.try-4-7-8-timer",
]);

const RELATED_TITLE_IDS = {
  "panic-attacks": "chrome.use-case.related-panic-title",
  "public-speaking": "chrome.use-case.related-public-speaking-title",
  "holiday-stress": "chrome.use-case.related-holiday-title",
  "travel-anxiety": "chrome.use-case.related-travel-title",
  kids: "chrome.use-case.related-kids-title",
  huberman: "chrome.use-case.related-huberman-title",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left.localeCompare(right, "en");
}

function interpolationTokens(value) {
  const braceTokens = value.match(/\{\{?[A-Za-z_][A-Za-z0-9_.-]*\}?\}/g) ?? [];
  const printfTokens =
    value.match(/%(?:\([A-Za-z_][A-Za-z0-9_.-]*\))?[sdif]/g) ?? [];
  return [...braceTokens, ...printfTokens].sort(compareText);
}

function numericTokens(value) {
  return (value.normalize("NFKC").match(/\d+(?:[.,]\d+)?/g) ?? [])
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
  return [...value.matchAll(/<(\/)?([A-Za-z][A-Za-z0-9-]*)\b([^>]*)>/g)].map(
    (match) => ({
      kind: match[1]
        ? "close"
        : match[3].trimEnd().endsWith("/")
          ? "self"
          : "open",
      raw: match[0],
      tag: match[2].toLowerCase(),
    }),
  );
}

function htmlTagStructure(value) {
  return htmlTagTokens(value).map((token) => `${token.kind}:${token.tag}`);
}

function htmlResourceDestinations(value) {
  return htmlTagTokens(value).flatMap((token) =>
    [...token.raw.matchAll(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi)].map(
      (match) => `${token.tag}:${match[1].toLowerCase()}:${match[3]}`,
    ),
  );
}

function markdownLinks(value) {
  return [...value.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    (match) => `${match[1] === "!" ? "image" : "link"}:${match[2]}`,
  );
}

function hasNumericDrift(sourceText, translation) {
  return !containsAllTokens(
    numericTokens(translation),
    numericTokens(sourceText),
  );
}

export function validateForTranslationSafety(
  sourceText,
  translation,
  label = "translation",
  { numericReviewReason } = {},
) {
  assert(
    typeof sourceText === "string" && sourceText.trim(),
    `${label} has no source text`,
  );
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} must be non-empty`,
  );
  assert(!translation.includes("\0"), `${label} contains a null byte`);
  assert(
    JSON.stringify(interpolationTokens(translation)) ===
      JSON.stringify(interpolationTokens(sourceText)),
    `${label} changed interpolation placeholders`,
  );

  const numericDrift = hasNumericDrift(sourceText, translation);
  if (numericDrift) {
    assert(
      typeof numericReviewReason === "string" && numericReviewReason.trim(),
      `${label} changed numeric values without an explicit numeric review reason`,
    );
  }
  assert(
    containsAllTokens(
      protectedSymbolTokens(translation),
      protectedSymbolTokens(sourceText),
    ),
    `${label} changed protected symbols`,
  );
  assert(
    JSON.stringify(markdownLinks(translation)) ===
      JSON.stringify(markdownLinks(sourceText)),
    `${label} changed Markdown link or image destinations`,
  );
  assert(
    JSON.stringify(htmlTagStructure(translation)) ===
      JSON.stringify(htmlTagStructure(sourceText)),
    `${label} changed HTML tag structure`,
  );
  assert(
    JSON.stringify(htmlResourceDestinations(translation)) ===
      JSON.stringify(htmlResourceDestinations(sourceText)),
    `${label} changed HTML link or media destinations`,
  );

  const unsafeTags = new Set(["script", "style", "iframe", "object", "embed"]);
  for (const { tag } of htmlTagTokens(translation)) {
    assert(!unsafeTags.has(tag), `${label} contains unsafe <${tag}> markup`);
  }
  assert(
    !/\son[A-Za-z]+\s*=/i.test(translation),
    `${label} contains an HTML event handler`,
  );
  assert(
    htmlResourceDestinations(translation).every(
      (destination) => !/:javascript:/i.test(destination),
    ),
    `${label} contains a javascript URL`,
  );
  const markdownMarkers = translation.match(/\]\(/g)?.length ?? 0;
  assert(
    markdownMarkers === markdownLinks(translation).length,
    `${label} contains malformed Markdown link syntax`,
  );
}

function routeIdForSlug(slug) {
  return slug === "anxiety" ? "for.anxiety" : `for-${slug}`;
}

export function assertForManifestAlignment(sourceText, slugs) {
  const sourceFile = ts.createSourceFile(
    routeManifestPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert(
    sourceFile.parseDiagnostics.length === 0,
    "Could not parse route-manifest.ts",
  );
  const routesByPath = new Map();

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "defineRoute" &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const record = {};
      for (const property of node.arguments[0].properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = propertyName(property.name);
        if (ts.isStringLiteralLike(property.initializer))
          record[name] = property.initializer.text;
      }
      if (record.path) {
        assert(
          !routesByPath.has(record.path),
          `Duplicate native manifest path ${record.path}`,
        );
        routesByPath.set(record.path, record);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  for (const slug of slugs) {
    const path = `/for/${slug}`;
    const route = routesByPath.get(path);
    assert(route, `${path} is missing from the native manifest`);
    assert(
      route.id === routeIdForSlug(slug),
      `${path} has native manifest id ${route.id ?? "<missing>"}`,
    );
    assert(
      route.kind === "structured-use-case",
      `${path} is not a structured-use-case route`,
    );
  }
}

function normalizeForRecovery(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function propertyName(node) {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteralLike(node) ||
    ts.isNumericLiteral(node)
  )
    return node.text;
  throw new Error(
    `Unsupported property at ${node.getSourceFile().fileName}:${node.getStart()}`,
  );
}

function evaluateLiteral(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map(evaluateLiteral);
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        assert(
          ts.isPropertyAssignment(property),
          "Structured for source only supports property assignments",
        );
        return [
          propertyName(property.name),
          evaluateLiteral(property.initializer),
        ];
      }),
    );
  }
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "ModeName"
  ) {
    const mode = MODE_NAMES[node.name.text];
    assert(mode, `Unsupported ModeName.${node.name.text}`);
    return mode;
  }
  throw new Error(`Unsupported source expression ${ts.SyntaxKind[node.kind]}`);
}

async function extractSourcePages() {
  const sourceText = await readFile(sourceFilePath, "utf8");
  const sourceFile = ts.createSourceFile(
    sourceFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert(
    sourceFile.parseDiagnostics.length === 0,
    "Could not parse use-case-pages.ts",
  );
  const declarations = new Map();
  let pagesArray;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
        continue;
      if (declaration.name.text === "useCasePages")
        pagesArray = declaration.initializer;
      else if (ts.isObjectLiteralExpression(declaration.initializer))
        declarations.set(declaration.name.text, declaration.initializer);
    }
  }
  assert(
    ts.isArrayLiteralExpression(pagesArray),
    "useCasePages must be an array literal",
  );
  const initializers = [...pagesArray.elements];
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isCallExpression(statement.expression)
    )
      continue;
    const call = statement.expression;
    if (
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== "push"
    )
      continue;
    if (
      !ts.isIdentifier(call.expression.expression) ||
      call.expression.expression.text !== "useCasePages"
    )
      continue;
    for (const argument of call.arguments) {
      if (ts.isObjectLiteralExpression(argument)) initializers.push(argument);
      else if (ts.isIdentifier(argument) && declarations.has(argument.text))
        initializers.push(declarations.get(argument.text));
      else throw new Error("Unsupported useCasePages.push argument");
    }
  }
  const pages = initializers.map(evaluateLiteral);
  return Object.fromEntries(pages.map((page) => [page.slug, page]));
}

function parsePath(path) {
  const parts = [];
  const pattern = /([^.\[\]]+)|\[(\d+)\]/g;
  let match;
  while ((match = pattern.exec(path))) parts.push(match[1] ?? Number(match[2]));
  return parts;
}

function setPath(target, path, value) {
  const parts = parsePath(path);
  const field = parts.pop();
  const parent = parts.reduce((current, part) => current[part], target);
  parent[field] = value;
}

function approvedSegments(catalog) {
  return catalog.segments.filter(
    (segment) =>
      segment.translation?.isApproved === true &&
      segment.translation?.needsReview === false &&
      typeof segment.translation?.text === "string" &&
      segment.translation.text.trim(),
  );
}

function resolveCandidates(candidates, sourceText, status) {
  const translations = [
    ...new Set(candidates.map((entry) => entry.translation.text)),
  ].sort(compareText);
  if (translations.length !== 1)
    return {
      candidates,
      sourceText,
      status: translations.length ? `${status}-conflict` : `${status}-miss`,
      translation: null,
    };
  return { candidates, sourceText, status, translation: translations[0] };
}

function resolveCatalog(segments, sourceText) {
  const exact = segments.filter((entry) => entry.sourceText === sourceText);
  if (exact.length)
    return resolveCandidates(exact, sourceText, "route-catalog-exact");
  const normalized = segments.filter(
    (entry) =>
      normalizeForRecovery(entry.sourceText) ===
      normalizeForRecovery(sourceText),
  );
  return resolveCandidates(normalized, sourceText, "route-catalog-normalized");
}

function resolveHead(segments, occurrenceKey) {
  const candidates = segments.filter(
    (entry) => entry.occurrenceKey === occurrenceKey,
  );
  return resolveCandidates(
    candidates,
    candidates[0]?.sourceText ?? occurrenceKey,
    "route-catalog-head-occurrence",
  );
}

async function readCatalogSegmentsRecursively(root) {
  const segments = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort(
    (left, right) => compareText(left.name, right.name),
  )) {
    const path = join(root, entry.name);
    if (entry.isDirectory())
      segments.push(...(await readCatalogSegmentsRecursively(path)));
    else if (
      entry.isFile() &&
      entry.name.endsWith(".json") &&
      !entry.name.startsWith("_")
    ) {
      const catalog = await readJson(path);
      if (Array.isArray(catalog.segments))
        segments.push(...approvedSegments(catalog));
    }
  }
  return segments;
}

function chromeSources(page, sourcePages) {
  const values = { ...BASE_CHROME };
  values["chrome.use-case.hero-share-text"] =
    `Try this guided breathing exercise for ${page.hero.title.toLowerCase().replace(/^breathing (exercises? )?for /, "")}.`;
  values["chrome.use-case.learn-box-breathing"] =
    `Learn more about ${page.mode} →`;
  values["chrome.use-case.box-breathing-name"] = page.mode;
  for (const related of page.relatedUseCases) {
    const messageId =
      RELATED_TITLE_IDS[related.slug] ??
      `chrome.use-case.related-${related.slug}-title`;
    values[messageId] = sourcePages[related.slug]?.hero.title ?? related.slug;
  }
  if (page.video) values["chrome.use-case.watch-learn"] = "Watch & Learn";
  if (page.relatedGuides?.length) {
    values["chrome.use-case.in-depth-guides"] =
      BASE_CHROME["chrome.use-case.in-depth-guides"];
    values["chrome.use-case.read-guide-action"] =
      BASE_CHROME["chrome.use-case.read-guide-action"];
  }
  if (page.slug === "holiday-stress" || page.slug === "travel-anxiety") {
    values["chrome.use-case.back-to-holiday-hub"] = "Back to Holiday Hub";
    values["chrome.use-case.holiday-ready-sessions"] =
      "Holiday-ready sessions:";
    values["chrome.use-case.holiday-30s-reset"] = "30s Reset";
    values["chrome.use-case.holiday-1min-breather"] = "1min Breather";
    values["chrome.use-case.holiday-2min-calm-down"] = "2min Calm Down";
  }
  if (page.breathingPageSlug === "box")
    values["chrome.use-case.try-box-app"] =
      "Try the dedicated Box Breathing App →";
  if (page.breathingPageSlug === "coherent")
    values["chrome.use-case.try-coherent-app"] =
      "Try the dedicated Coherent Breathing App →";
  if (page.breathingPageSlug === "4-7-8")
    values["chrome.use-case.try-4-7-8-timer"] =
      "Try the dedicated 4-7-8 Breathing Timer →";
  if (page.slug === "lung-capacity")
    values["chrome.use-case.internal-link-pursed-lip-keyword"] =
      "pursed-lip breathing";
  return values;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readManual(slug) {
  try {
    const file = await readJson(join(manualRoot, `${slug}.json`));
    assert(file.schemaVersion === 1, `${slug} manual schema is unsupported`);
    assert(
      file.sourceRoute === (slug === "_shared" ? "*" : `/for/${slug}`),
      `${slug} manual route changed`,
    );
    assert(
      Array.isArray(file.entries),
      `${slug} manual entries must be an array`,
    );
    const seen = new Set();
    for (const entry of file.entries) {
      assert(
        entry.scope === "content" || entry.scope === "chrome",
        `${slug}:${entry.messageId} has unsupported scope`,
      );
      assert(
        typeof entry.messageId === "string" && entry.messageId.trim(),
        `${slug} manual entry has no message id`,
      );
      assert(
        typeof entry.sourceText === "string" && entry.sourceText.trim(),
        `${slug}:${entry.messageId} has no source text`,
      );
      assert(
        entry.reviewedSourceHash === sha256(entry.sourceText),
        `${slug}:${entry.messageId} manual source hash changed`,
      );
      assert(
        typeof entry.reason === "string" && entry.reason.trim(),
        `${slug}:${entry.messageId} has no review reason`,
      );
      assert(
        entry.translations && typeof entry.translations === "object",
        `${slug}:${entry.messageId} has no translations`,
      );
      const key = `${entry.scope}:${entry.messageId}`;
      assert(!seen.has(key), `${slug} has duplicate manual entry ${key}`);
      seen.add(key);
      const numericReviewReasons = entry.numericReviewReasons ?? {};
      assert(
        numericReviewReasons && typeof numericReviewReasons === "object",
        `${slug}:${entry.messageId} has invalid numeric review reasons`,
      );
      for (const locale of Object.keys(numericReviewReasons)) {
        assert(
          FOR_CONTENT_LOCALES.includes(locale),
          `${slug}:${entry.messageId} has unsupported numeric review locale ${locale}`,
        );
        assert(
          typeof entry.translations[locale] === "string" &&
            entry.translations[locale].trim(),
          `${slug}:${entry.messageId}:${locale} numeric review has no translation`,
        );
      }
      for (const [locale, translation] of Object.entries(entry.translations)) {
        assert(
          FOR_CONTENT_LOCALES.includes(locale),
          `${slug}:${entry.messageId} has unsupported locale ${locale}`,
        );
        assert(
          translation === null ||
            (typeof translation === "string" && translation.trim()),
          `${slug}:${entry.messageId}:${locale} has invalid translation`,
        );
        if (typeof translation === "string" && translation.trim()) {
          validateForTranslationSafety(
            entry.sourceText,
            translation,
            `${slug}:${entry.messageId}:${locale} manual`,
            {
              numericReviewReason:
                numericReviewReasons[locale] ??
                (hasNumericDrift(entry.sourceText, translation)
                  ? entry.reason
                  : undefined),
            },
          );
        }
      }
    }
    return file;
  } catch (error) {
    if (error.code === "ENOENT")
      return { entries: [], schemaVersion: 1, sourceRoute: `/for/${slug}` };
    throw error;
  }
}

async function readReplacements(slug) {
  try {
    const file = await readJson(join(replacementRoot, `${slug}.json`));
    assert(
      file.schemaVersion === 1,
      `${slug} replacement schema is unsupported`,
    );
    assert(
      file.sourceRoute === `/for/${slug}`,
      `${slug} replacement route changed`,
    );
    assert(
      Array.isArray(file.replacements),
      `${slug} replacements must be an array`,
    );
    const seen = new Set();
    for (const replacement of file.replacements) {
      assert(
        FOR_CONTENT_LOCALES.includes(replacement.locale),
        `${slug}:${replacement.sourcePath} replacement has unsupported locale`,
      );
      assert(
        typeof replacement.reason === "string" && replacement.reason.trim(),
        `${slug}:${replacement.sourcePath}:${replacement.locale} replacement has no review reason`,
      );
      const key = `${replacement.sourcePath}:${replacement.locale}`;
      assert(!seen.has(key), `${slug} has duplicate replacement ${key}`);
      seen.add(key);
      validateForTranslationSafety(
        replacement.sourceText,
        replacement.replacement,
        `${slug}:${replacement.sourcePath}:${replacement.locale} replacement`,
        {
          numericReviewReason:
            replacement.numericReviewReason ??
            (hasNumericDrift(replacement.sourceText, replacement.replacement)
              ? replacement.reason
              : undefined),
        },
      );
    }
    return file.replacements;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function manualIndex(manual) {
  return new Map(
    manual.entries.flatMap((entry) =>
      Object.entries(entry.translations)
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([locale, translation]) => [
          `${entry.scope}:${entry.messageId}:${locale}`,
          { ...entry, locale, translation },
        ]),
    ),
  );
}

export function assertManualSourceBinding(
  record,
  sourceText,
  label = "manual translation",
) {
  assert(record.sourceText === sourceText, `${label} source changed`);
  assert(
    record.reviewedSourceHash === sha256(sourceText),
    `${label} source hash changed`,
  );
}

async function proofAnxietyValues() {
  const semanticMap = await readJson(join(proofRoot, "semantic-map.json"));
  const route = semanticMap.routes.find(
    (entry) => entry.sourceRoute === "/for/anxiety",
  );
  assert(route, "Anxiety proof semantic map is missing");
  const pathToId = new Map(
    route.messages.map((entry) => [entry.sourcePath, entry.messageId]),
  );
  const localeValues = {};
  for (const locale of FOR_CONTENT_LOCALES) {
    const messages = await readJson(
      join(proofRoot, "messages", locale, "for-anxiety.json"),
    );
    localeValues[locale] = new Map(
      [...pathToId].map(([path, id]) => [path, messages[id]]),
    );
  }
  return localeValues;
}

async function proofAnxietyChrome() {
  return Object.fromEntries(
    await Promise.all(
      FOR_CONTENT_LOCALES.map(async (locale) => [
        locale,
        await readJson(
          join(proofRoot, "server-chrome", locale, "for-anxiety.json"),
        ),
      ]),
    ),
  );
}

function unresolvedEntry(scope, messageId, sourceText, locales, reason) {
  return {
    messageId,
    reason,
    reviewedSourceHash: sha256(sourceText),
    scope,
    sourceText,
    translations: Object.fromEntries(locales.map((locale) => [locale, null])),
  };
}

function renderTypes(slugs) {
  return (
    `import type { UseCasePageContent } from "@/data/use-case-pages";\n\n` +
    `export const FOR_CONTENT_LOCALES = ${JSON.stringify(FOR_CONTENT_LOCALES)} as const;\n` +
    `export const FOR_CONTENT_SLUGS = ${JSON.stringify(slugs)} as const;\n\n` +
    `export type ForContentLocale = (typeof FOR_CONTENT_LOCALES)[number];\n` +
    `export type ForContentSlug = (typeof FOR_CONTENT_SLUGS)[number];\n` +
    `export type UseCaseChromeMessages = Readonly<Record<\`chrome.\${string}\`, string>>;\n` +
    `export interface UseCaseRouteBundle { readonly chrome: UseCaseChromeMessages; readonly content: UseCasePageContent; }\n`
  );
}

function renderLoader(slugs) {
  const entries = [];
  for (const locale of FOR_CONTENT_LOCALES) {
    for (const slug of slugs) entries.push({ locale, slug });
  }
  const contentLoaders = entries
    .map(
      ({ locale, slug }) =>
        `  "${locale}:${slug}": () => import("../routes/${locale}/${slug}.json"),`,
    )
    .join("\n");
  const chromeLoaders = entries
    .map(
      ({ locale, slug }) =>
        `  "${locale}:${slug}": () => import("../chrome/${locale}/${slug}.json"),`,
    )
    .join("\n");
  return (
    `import "server-only";\n\n` +
    `import type { UseCasePageContent } from "@/data/use-case-pages";\n` +
    `import publication from "../publication.json";\n` +
    `import type { UseCaseChromeMessages, ForContentLocale, ForContentSlug, UseCaseRouteBundle } from "../types";\n\n` +
    `const contentLoaders = {\n${contentLoaders}\n} as const;\n\n` +
    `const chromeLoaders = {\n${chromeLoaders}\n} as const;\n\n` +
    `function assertPublishable(slug: ForContentSlug, locale: ForContentLocale) {\n` +
    `  const route = publication.routes[\`/for/\${slug}\` as keyof typeof publication.routes];\n` +
    `  const localeState = route?.locales[locale as keyof typeof route.locales];\n` +
    `  if (!localeState?.publishable) throw new Error(\`Use-case content is not publishable: \${locale}:\${slug}\`);\n` +
    `}\n\n` +
    `export async function loadUseCaseContent(slug: ForContentSlug, locale: ForContentLocale): Promise<UseCasePageContent> {\n` +
    `  assertPublishable(slug, locale);\n` +
    `  const contentModule = await contentLoaders[\`\${locale}:\${slug}\`]();\n` +
    `  return contentModule.default as UseCasePageContent;\n` +
    `}\n\n` +
    `export async function loadUseCaseChrome(slug: ForContentSlug, locale: ForContentLocale): Promise<UseCaseChromeMessages> {\n` +
    `  assertPublishable(slug, locale);\n` +
    `  const chromeModule = await chromeLoaders[\`\${locale}:\${slug}\`]();\n` +
    `  return chromeModule.default as UseCaseChromeMessages;\n` +
    `}\n\n` +
    `export async function loadUseCaseRoute(slug: ForContentSlug, locale: ForContentLocale): Promise<UseCaseRouteBundle> {\n` +
    `  const [content, chrome] = await Promise.all([loadUseCaseContent(slug, locale), loadUseCaseChrome(slug, locale)]);\n` +
    `  return { chrome, content };\n` +
    `}\n`
  );
}

async function mergeManualScaffolds(scaffolds) {
  await mkdir(manualRoot, { recursive: true });
  for (const [slug, next] of Object.entries(scaffolds)) {
    const current = await readManual(slug);
    const entries = mergeManualEntries(current.entries, next.entries, slug);
    await writeFile(
      join(manualRoot, `${slug}.json`),
      stableJson({ ...next, entries }),
    );
  }
}

export function mergeManualEntries(
  currentEntries,
  scaffoldEntries,
  slug = "manual",
) {
  const entriesByKey = new Map(
    currentEntries.map((entry) => [
      `${entry.scope}:${entry.messageId}`,
      structuredClone(entry),
    ]),
  );
  for (const entry of scaffoldEntries) {
    const key = `${entry.scope}:${entry.messageId}`;
    const prior = entriesByKey.get(key);
    if (!prior) {
      entriesByKey.set(key, structuredClone(entry));
      continue;
    }
    assert(
      prior.sourceText === entry.sourceText,
      `${slug}:${entry.messageId} source changed`,
    );
    assert(
      prior.reviewedSourceHash === entry.reviewedSourceHash,
      `${slug}:${entry.messageId} source hash changed`,
    );
    const translations = { ...entry.translations, ...prior.translations };
    const numericReviewReasons = {
      ...entry.numericReviewReasons,
      ...prior.numericReviewReasons,
    };
    entriesByKey.set(key, {
      ...entry,
      ...(Object.keys(numericReviewReasons).length
        ? { numericReviewReasons }
        : {}),
      translations,
    });
  }
  return [...entriesByKey.values()].sort((left, right) =>
    compareText(
      `${left.scope}:${left.messageId}`,
      `${right.scope}:${right.messageId}`,
    ),
  );
}

export async function buildForArtifacts() {
  const [
    audit,
    sourcePages,
    anxietyProof,
    sharedProofChrome,
    globalCatalogs,
    routeManifestSource,
  ] = await Promise.all([
    buildAudit(),
    extractSourcePages(),
    proofAnxietyValues(),
    proofAnxietyChrome(),
    Promise.all(
      FOR_CONTENT_LOCALES.map(async (locale) => [
        locale,
        await readCatalogSegmentsRecursively(
          join(catalogRoot, locale, "pages"),
        ),
      ]),
    ).then(Object.fromEntries),
    readFile(routeManifestPath, "utf8"),
  ]);
  const auditedPages = audit.pages.filter((page) =>
    page.route.startsWith("/for/"),
  );
  assertForManifestAlignment(
    routeManifestSource,
    auditedPages.map((page) => page.slug),
  );
  const outputs = new Map();
  const publication = {
    locales: FOR_CONTENT_LOCALES,
    routes: {},
    schemaVersion: 1,
  };
  const scaffolds = {};
  const sharedManual = await readManual("_shared");
  const sharedManualValues = manualIndex(sharedManual);
  const sharedScaffoldByKey = new Map();

  for (const audited of auditedPages) {
    const slug = audited.slug;
    const routeId = routeIdForSlug(slug);
    const sourcePage = sourcePages[slug];
    const manual = await readManual(slug);
    const manualValues = manualIndex(manual);
    const replacements = await readReplacements(slug);
    const replacementsByKey = new Map(
      replacements.map((entry) => [
        `${entry.sourcePath}:${entry.locale}`,
        entry,
      ]),
    );
    const catalogs = Object.fromEntries(
      await Promise.all(
        FOR_CONTENT_LOCALES.map(async (locale) => [
          locale,
          approvedSegments(
            await readJson(
              join(catalogRoot, locale, "pages", "for", `${slug}.json`),
            ),
          ),
        ]),
      ),
    );
    const chrome = chromeSources(sourcePage, sourcePages);

    const routePublication = {
      contentMessages: audited.leaves.filter(
        (leaf) => leaf.category === "content",
      ).length,
      locales: {},
      routeId,
    };
    const routeProvenance = {
      locales: {},
      schemaVersion: 1,
      sourceRoute: audited.route,
    };
    const routeUnresolved = {
      entries: [],
      schemaVersion: 1,
      sourceRoute: audited.route,
    };
    const scaffoldByKey = new Map();

    for (const locale of FOR_CONTENT_LOCALES) {
      const localized = structuredClone(sourcePage);
      const localeProvenance = { chrome: {}, content: {} };
      let unresolved = 0;
      for (const leaf of audited.leaves.filter(
        (entry) => entry.category === "content",
      )) {
        const replacement = replacementsByKey.get(`${leaf.path}:${locale}`);
        const manualRecord = manualValues.get(`content:${leaf.path}:${locale}`);
        let resolution;
        if (replacement) {
          assert(
            replacement.sourceText === leaf.sourceText,
            `${slug}:${leaf.path}:${locale} replacement source changed`,
          );
          assert(
            replacement.reviewedSourceHash === sha256(leaf.sourceText),
            `${slug}:${leaf.path}:${locale} replacement hash changed`,
          );
          assert(
            typeof replacement.reason === "string" && replacement.reason.trim(),
            `${slug}:${leaf.path}:${locale} replacement has no reason`,
          );
          const sourceResolution = resolveCatalog(
            catalogs[locale],
            leaf.sourceText,
          );
          const headResolution = HEAD_OCCURRENCES[leaf.path]
            ? resolveHead(catalogs[locale], HEAD_OCCURRENCES[leaf.path])
            : { candidates: [] };
          const currentValues = new Set(
            [...sourceResolution.candidates, ...headResolution.candidates].map(
              (candidate) => candidate.translation.text,
            ),
          );
          assert(
            currentValues.has(replacement.currentCatalogValue),
            `${slug}:${leaf.path}:${locale} replacement catalog value changed`,
          );
          resolution = {
            sourceText: leaf.sourceText,
            status: "repo-reviewed-replacement",
            translation: replacement.replacement,
          };
        } else if (manualRecord) {
          assertManualSourceBinding(
            manualRecord,
            leaf.sourceText,
            `${slug}:${leaf.path}:${locale} manual`,
          );
          resolution = {
            sourceText: leaf.sourceText,
            status: "repo-reviewed-manual",
            translation: manualRecord.translation,
          };
        } else if (
          slug === "anxiety" &&
          ANXIETY_PROOF_HEAD_PATHS.has(leaf.path) &&
          anxietyProof[locale].has(leaf.path)
        )
          resolution = {
            sourceText: leaf.sourceText,
            status: "proof-preserved",
            translation: anxietyProof[locale].get(leaf.path),
          };
        else if (HEAD_OCCURRENCES[leaf.path])
          resolution = resolveHead(
            catalogs[locale],
            HEAD_OCCURRENCES[leaf.path],
          );
        else if (slug === "anxiety" && anxietyProof[locale].has(leaf.path))
          resolution = {
            sourceText: leaf.sourceText,
            status: "proof-preserved",
            translation: anxietyProof[locale].get(leaf.path),
          };
        else {
          const routeResolution = resolveCatalog(
            catalogs[locale],
            leaf.sourceText,
          );
          if (routeResolution.status.endsWith("-miss")) {
            const globalResolution = resolveCatalog(
              globalCatalogs[locale],
              leaf.sourceText,
            );
            resolution = {
              ...globalResolution,
              status: globalResolution.status.replace("route-", "global-"),
            };
          } else resolution = routeResolution;
        }
        setPath(localized, leaf.path, resolution.translation);
        localeProvenance.content[leaf.path] = {
          sourceHash: sha256(leaf.sourceText),
          sourceText: resolution.sourceText,
          status: resolution.status,
        };
        if (!resolution.translation) {
          unresolved += 1;
          routeUnresolved.entries.push({
            locale,
            messageId: leaf.path,
            reason: resolution.status,
            scope: "content",
            sourceText: leaf.sourceText,
          });
          const key = `content:${leaf.path}`;
          const entry =
            scaffoldByKey.get(key) ??
            unresolvedEntry(
              "content",
              leaf.path,
              leaf.sourceText,
              [],
              resolution.status,
            );
          entry.translations[locale] = null;
          scaffoldByKey.set(key, entry);
        }
      }

      const localizedChrome = {};
      for (const [messageId, sourceText] of Object.entries(chrome)) {
        const manualRecord =
          manualValues.get(`chrome:${messageId}:${locale}`) ??
          sharedManualValues.get(`chrome:${messageId}:${locale}`);
        let resolution;
        if (manualRecord) {
          assertManualSourceBinding(
            manualRecord,
            sourceText,
            `${slug}:${messageId}:${locale} manual`,
          );
          resolution = {
            sourceText,
            status: "repo-reviewed-manual",
            translation: manualRecord.translation,
          };
        } else if (
          BASE_CHROME[messageId] &&
          sharedProofChrome[locale][messageId]
        ) {
          resolution = {
            sourceText,
            status: "shared-proof-preserved",
            translation: sharedProofChrome[locale][messageId],
          };
        } else if (slug === "anxiety" && sharedProofChrome[locale][messageId]) {
          resolution = {
            sourceText,
            status: "proof-preserved",
            translation: sharedProofChrome[locale][messageId],
          };
        } else {
          const routeResolution = resolveCatalog(catalogs[locale], sourceText);
          if (routeResolution.status.endsWith("-miss")) {
            const globalResolution = resolveCatalog(
              globalCatalogs[locale],
              sourceText,
            );
            resolution = {
              ...globalResolution,
              status: globalResolution.status.replace("route-", "global-"),
            };
          } else resolution = routeResolution;
        }
        localizedChrome[messageId] = resolution.translation;
        localeProvenance.chrome[messageId] = {
          sourceHash: sha256(sourceText),
          status: resolution.status,
        };
        if (!resolution.translation) {
          unresolved += 1;
          routeUnresolved.entries.push({
            locale,
            messageId,
            reason: resolution.status,
            scope: "chrome",
            sourceText,
          });
          const isShared = SHARED_NEW_CHROME.has(messageId);
          const targetScaffold = isShared ? sharedScaffoldByKey : scaffoldByKey;
          const key = `chrome:${messageId}`;
          const entry =
            targetScaffold.get(key) ??
            unresolvedEntry(
              "chrome",
              messageId,
              sourceText,
              [],
              resolution.status,
            );
          entry.translations[locale] = null;
          targetScaffold.set(key, entry);
        }
      }

      const routePath = `routes/${locale}/${slug}.json`;
      const chromePath = `chrome/${locale}/${slug}.json`;
      outputs.set(routePath, stableJson(localized));
      outputs.set(chromePath, stableJson(localizedChrome));
      routeProvenance.locales[locale] = localeProvenance;
      routePublication.locales[locale] = {
        chromeMessages: Object.keys(localizedChrome).length,
        chromePath,
        publishable: unresolved === 0,
        routePath,
        unresolved,
      };
    }

    scaffolds[slug] = {
      entries: [...scaffoldByKey.values()].sort((left, right) =>
        compareText(
          `${left.scope}:${left.messageId}`,
          `${right.scope}:${right.messageId}`,
        ),
      ),
      schemaVersion: 1,
      sourceRoute: audited.route,
    };
    outputs.set(`provenance/${slug}.json`, stableJson(routeProvenance));
    outputs.set(`unresolved/${slug}.json`, stableJson(routeUnresolved));
    publication.routes[audited.route] = routePublication;
  }
  scaffolds._shared = {
    entries: [...sharedScaffoldByKey.values()].sort((left, right) =>
      compareText(left.messageId, right.messageId),
    ),
    schemaVersion: 1,
    sourceRoute: "*",
  };
  const slugs = auditedPages.map((page) => page.slug).sort(compareText);
  outputs.set("types.ts", renderTypes(slugs));
  outputs.set("server/load-use-case-content.ts", renderLoader(slugs));
  outputs.set("publication.json", stableJson(publication));
  return { outputs, publication, scaffolds };
}

async function writeOutputs(outputs) {
  for (const [relativePath, value] of outputs) {
    const path = join(outputRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value);
  }
}

async function checkOutputs(outputs) {
  const stale = [];
  for (const [relativePath, expected] of outputs) {
    try {
      if ((await readFile(join(outputRoot, relativePath), "utf8")) !== expected)
        stale.push(relativePath);
    } catch (error) {
      if (error.code === "ENOENT") stale.push(relativePath);
      else throw error;
    }
  }
  return stale;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  assert(
    [...args].every((arg) => arg === "--check" || arg === "--scaffold"),
    "Unknown compiler argument",
  );
  let artifacts = await buildForArtifacts();
  if (args.has("--scaffold")) {
    await mergeManualScaffolds(artifacts.scaffolds);
    artifacts = await buildForArtifacts();
  }
  if (args.has("--check")) {
    const stale = await checkOutputs(artifacts.outputs);
    if (stale.length)
      throw new Error(`Stale structured for artifacts:\n${stale.join("\n")}`);
  } else await writeOutputs(artifacts.outputs);
  const routes = Object.values(artifacts.publication.routes);
  const localeRoutes = routes.flatMap((route) => Object.values(route.locales));
  process.stdout.write(
    `${JSON.stringify({ localeRoutes: localeRoutes.length, publishable: localeRoutes.filter((route) => route.publishable).length, routes: routes.length, unresolved: localeRoutes.reduce((sum, route) => sum + route.unresolved, 0) })}\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
