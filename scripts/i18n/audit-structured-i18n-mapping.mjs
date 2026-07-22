#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalogRoot = join(repoRoot, "src/i18n/catalog");

const DATASETS = [
  {
    exportName: "breathingPages",
    kind: "breathing",
    routePrefix: "/breathe/",
    sourceFile: "src/data/breathing-pages.ts",
  },
  {
    exportName: "useCasePages",
    kind: "use-case",
    routePrefix: "/for/",
    sourceFile: "src/data/use-case-pages.ts",
  },
];

const IDENTIFIER_FIELDS = new Set([
  "attribution",
  "author",
  "breathingPageSlug",
  "reviewer",
  "slug",
  "source",
  "youtubeId",
]);
const URL_FIELDS = new Set(["href", "ogImage", "url"]);
const DATE_FIELDS = new Set(["dateModified", "datePublished", "uploadDate"]);
const KEYWORD_FIELDS = new Set(["keywords", "synonyms"]);
const ISO_DURATION_PATTERN = /^P(?=\d|T\d)/;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareText)
        .map((key) => [key, sortObject(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(sortObject(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  throw new Error(`Unsupported computed property at ${node.getSourceFile().fileName}:${node.getStart()}`);
}

function findPageInitializers(sourceFile, exportName) {
  const objectDeclarations = new Map();
  let array = null;

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      if (declaration.name.text === exportName) {
        if (!ts.isArrayLiteralExpression(declaration.initializer)) {
          throw new Error(`${exportName} must be initialized with an array literal`);
        }
        array = declaration.initializer;
      } else if (ts.isObjectLiteralExpression(declaration.initializer)) {
        objectDeclarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  if (!array) throw new Error(`Could not find ${exportName}`);

  const pages = [...array.elements];
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
    const call = statement.expression;
    if (
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== "push" ||
      !ts.isIdentifier(call.expression.expression) ||
      call.expression.expression.text !== exportName
    ) {
      continue;
    }
    for (const argument of call.arguments) {
      if (ts.isObjectLiteralExpression(argument)) {
        pages.push(argument);
        continue;
      }
      if (ts.isIdentifier(argument) && objectDeclarations.has(argument.text)) {
        pages.push(objectDeclarations.get(argument.text));
        continue;
      }
      throw new Error(`${exportName}.push() must receive an object literal or local object variable`);
    }
  }
  return pages;
}

function objectStringProperty(objectNode, name) {
  for (const property of objectNode.properties) {
    if (!ts.isPropertyAssignment(property) || propertyName(property.name) !== name) continue;
    if (!ts.isStringLiteralLike(property.initializer)) {
      throw new Error(`${name} must be a string literal`);
    }
    return property.initializer.text;
  }
  throw new Error(`Object is missing string property ${name}`);
}

function collectStringLeaves(node, path = []) {
  if (ts.isStringLiteralLike(node)) {
    return [{ path, sourceText: node.text }];
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element, index) => collectStringLeaves(element, [...path, index]));
  }

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) => {
      if (ts.isPropertyAssignment(property)) {
        return collectStringLeaves(property.initializer, [...path, propertyName(property.name)]);
      }
      if (ts.isSpreadAssignment(property)) {
        throw new Error(`Spread assignments are not supported in structured page data`);
      }
      return [];
    });
  }

  // Enums, booleans, numbers, and other non-string leaves do not need translation.
  return [];
}

function lastField(path) {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (typeof path[index] === "string") return path[index];
  }
  return null;
}

export function classifyLeaf(path, sourceText) {
  const fields = path.filter((part) => typeof part === "string");
  const field = lastField(path);

  if (fields.some((part) => KEYWORD_FIELDS.has(part))) return "keyword";
  if (field && DATE_FIELDS.has(field)) return "date";
  if (field && URL_FIELDS.has(field)) return "url";
  if (field && IDENTIFIER_FIELDS.has(field)) return "identifier";
  if (field === "duration" && ISO_DURATION_PATTERN.test(sourceText)) return "identifier";
  return "content";
}

function formatPath(path) {
  return path.reduce((result, part) => {
    if (typeof part === "number") return `${result}[${part}]`;
    return result ? `${result}.${part}` : part;
  }, "");
}

async function extractPages(dataset) {
  const sourcePath = join(repoRoot, dataset.sourceFile);
  const sourceText = await readFile(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    const [diagnostic] = sourceFile.parseDiagnostics;
    throw new Error(
      `Could not parse ${dataset.sourceFile}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
    );
  }
  const pageInitializers = findPageInitializers(sourceFile, dataset.exportName);

  return pageInitializers.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`${dataset.exportName}[${index}] must be an object literal`);
    }
    const slug = objectStringProperty(element, "slug");
    const route = `${dataset.routePrefix}${slug}`;
    const leaves = collectStringLeaves(element).map((leaf) => ({
      category: classifyLeaf(leaf.path, leaf.sourceText),
      path: formatPath(leaf.path),
      sourceText: leaf.sourceText,
    }));
    return { dataset: dataset.kind, leaves, route, slug };
  });
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function candidateSignature(segment) {
  return [
    segment.catalogSegmentId,
    segment.contextKey,
    segment.attributeName ?? "",
    segment.fieldKey ?? "",
    segment.occurrenceKey,
  ].join("|");
}

function candidateEvidence(segment) {
  return {
    attributeName: segment.attributeName,
    catalogSegmentId: segment.catalogSegmentId,
    contextKey: segment.contextKey,
    fieldKey: segment.fieldKey,
    occurrenceKey: segment.occurrenceKey,
    sourceHash: segment.sourceHash,
    translation: segment.translation
      ? {
          isApproved: segment.translation.isApproved,
          needsReview: segment.translation.needsReview,
          text: segment.translation.text,
        }
      : null,
  };
}

function summarizeLocale(candidates) {
  const translationTexts = [
    ...new Set(
      candidates
        .map((candidate) => candidate.translation?.text)
        .filter((text) => typeof text === "string" && text.length > 0),
    ),
  ].sort(compareText);

  return {
    candidates: candidates.map(candidateEvidence),
    matchCount: candidates.length,
    missingTranslation: candidates.length > 0 && translationTexts.length === 0,
    sourceMissing: candidates.length === 0,
    translationConflict: translationTexts.length > 1,
    translationTexts,
  };
}

function matchContentLeaf(leaf, localeCatalogs, locales) {
  const localeMatches = Object.fromEntries(
    locales.map((locale) => {
      const candidates = localeCatalogs[locale].segments.filter(
        (segment) => segment.sourceText === leaf.sourceText,
      );
      return [locale, summarizeLocale(candidates)];
    }),
  );
  const referenceCandidates = localeCatalogs[locales[0]].segments.filter(
    (segment) => segment.sourceText === leaf.sourceText,
  );
  const match =
    referenceCandidates.length === 0
      ? "missing"
      : referenceCandidates.length === 1
        ? "unique"
        : "ambiguous";
  const localeStatuses = Object.values(localeMatches);
  const everyLocaleUsable = localeStatuses.every(
    (status) => !status.sourceMissing && !status.missingTranslation && !status.translationConflict,
  );
  const bridge = !everyLocaleUsable
    ? localeStatuses.some((status) => status.translationConflict)
      ? "unsafe_translation_conflict"
      : "incomplete"
    : match === "ambiguous"
      ? "safe_equivalent_ambiguity"
      : "safe_unique";

  return {
    ...leaf,
    bridge,
    localeMatches,
    match,
    referenceCandidates: referenceCandidates.map((segment) => ({
      ...candidateEvidence(segment),
      signature: candidateSignature(segment),
    })),
  };
}

function summarizeRoute(page, auditedLeaves, locales) {
  const contentLeaves = auditedLeaves.filter((leaf) => leaf.category === "content");
  const perLocale = Object.fromEntries(
    locales.map((locale) => {
      const sourceMissing = contentLeaves.filter((leaf) => leaf.localeMatches[locale].sourceMissing).length;
      const matchedButMissingTranslation = contentLeaves.filter(
        (leaf) => leaf.localeMatches[locale].missingTranslation,
      ).length;
      const translationConflicts = contentLeaves.filter(
        (leaf) => leaf.localeMatches[locale].translationConflict,
      ).length;
      return [
        locale,
        {
          matchedButMissingTranslation,
          noUsableTranslation: sourceMissing + matchedButMissingTranslation + translationConflicts,
          sourceMissing,
          translationConflicts,
        },
      ];
    }),
  );

  return {
    classification: countBy(auditedLeaves, (leaf) => leaf.category),
    contentBridge: countBy(contentLeaves, (leaf) => leaf.bridge),
    contentMatches: countBy(contentLeaves, (leaf) => leaf.match),
    dataset: page.dataset,
    perLocale,
    route: page.route,
    slug: page.slug,
    stringLeaves: auditedLeaves.length,
  };
}

export async function buildAudit() {
  const manifest = JSON.parse(await readFile(join(catalogRoot, "manifest.json"), "utf8"));
  const locales = [...manifest.source.locales].sort(compareText);
  const routeFiles = new Map(manifest.routes.map((route) => [route.route, route.files]));
  const pages = (await Promise.all(DATASETS.map(extractPages))).flat();
  if (new Set(pages.map((page) => page.route)).size !== pages.length) {
    throw new Error("Structured page data contains duplicate routes");
  }

  const auditedPages = [];
  for (const page of pages) {
    const files = routeFiles.get(page.route);
    if (!files) throw new Error(`Catalog manifest is missing structured route ${page.route}`);
    const localeCatalogs = Object.fromEntries(
      await Promise.all(
        locales.map(async (locale) => {
          if (!files[locale]) throw new Error(`Catalog manifest is missing ${locale} for ${page.route}`);
          return [locale, JSON.parse(await readFile(join(catalogRoot, files[locale]), "utf8"))];
        }),
      ),
    );
    const leaves = page.leaves.map((leaf) =>
      leaf.category === "content" ? matchContentLeaf(leaf, localeCatalogs, locales) : leaf,
    );
    auditedPages.push({ ...page, leaves });
  }

  auditedPages.sort((left, right) => compareText(left.route, right.route));
  const routes = auditedPages.map((page) => summarizeRoute(page, page.leaves, locales));
  const contentLeaves = auditedPages.flatMap((page) =>
    page.leaves.filter((leaf) => leaf.category === "content"),
  );
  const allLeaves = auditedPages.flatMap((page) => page.leaves);
  const perLocale = Object.fromEntries(
    locales.map((locale) => {
      const sourceMissing = contentLeaves.filter((leaf) => leaf.localeMatches[locale].sourceMissing).length;
      const matchedButMissingTranslation = contentLeaves.filter(
        (leaf) => leaf.localeMatches[locale].missingTranslation,
      ).length;
      const translationConflicts = contentLeaves.filter(
        (leaf) => leaf.localeMatches[locale].translationConflict,
      ).length;
      return [
        locale,
        {
          matchedButMissingTranslation,
          noUsableTranslation: sourceMissing + matchedButMissingTranslation + translationConflicts,
          sourceMissing,
          translationConflicts,
        },
      ];
    }),
  );

  const audit = {
    inputs: {
      catalogSnapshotUpdatedThrough: manifest.source.snapshotUpdatedThrough,
      datasets: DATASETS.map(({ exportName, kind, sourceFile }) => ({ exportName, kind, sourceFile })),
      locales,
      tenantId: manifest.source.tenantId,
    },
    locales,
    pages: auditedPages,
    routes,
    schemaVersion: 1,
    summary: {
      classification: countBy(allLeaves, (leaf) => leaf.category),
      contentBridge: countBy(contentLeaves, (leaf) => leaf.bridge),
      contentMatches: countBy(contentLeaves, (leaf) => leaf.match),
      contextEvidence: {
        ambiguousLeaves: contentLeaves.filter((leaf) => leaf.match === "ambiguous").length,
        ambiguousLeavesWithConflictingTranslations: contentLeaves.filter(
          (leaf) => leaf.bridge === "unsafe_translation_conflict",
        ).length,
        ambiguousLeavesWithEquivalentTranslations: contentLeaves.filter(
          (leaf) => leaf.bridge === "safe_equivalent_ambiguity",
        ).length,
        distinctConflictingSourceTexts: new Set(
          contentLeaves
            .filter((leaf) => leaf.bridge === "unsafe_translation_conflict")
            .map((leaf) => leaf.sourceText),
        ).size,
        matchedLeaves: contentLeaves.filter((leaf) => leaf.match !== "missing").length,
        matchedLeavesWithSemanticFieldKey: contentLeaves.filter((leaf) =>
          leaf.referenceCandidates.some((candidate) => candidate.fieldKey),
        ).length,
      },
      datasets: countBy(auditedPages, (page) => page.dataset),
      distinctMissingSourceTexts: new Set(
        contentLeaves.filter((leaf) => leaf.match === "missing").map((leaf) => leaf.sourceText),
      ).size,
      missingByTopLevelField: countBy(
        contentLeaves.filter((leaf) => leaf.match === "missing"),
        (leaf) => leaf.path.split(/[.[]/, 1)[0],
      ),
      pages: auditedPages.length,
      perLocale,
      stringLeaves: allLeaves.length,
    },
  };
  audit.digest = sha256(stableJson(audit));
  return audit;
}

function usage() {
  return `Usage: node scripts/i18n/audit-structured-i18n-mapping.mjs [--summary]\n\n` +
    `Audits structured page string leaves against checked-in route catalogs.\n` +
    `The default output is deterministic JSON; --summary emits only summary metadata.\n`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(usage());
    return;
  }
  const unknown = args.filter((arg) => arg !== "--summary");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`);

  const audit = await buildAudit();
  process.stdout.write(
    stableJson(
      args.includes("--summary")
        ? { digest: audit.digest, inputs: audit.inputs, schemaVersion: audit.schemaVersion, summary: audit.summary }
        : audit,
    ),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
