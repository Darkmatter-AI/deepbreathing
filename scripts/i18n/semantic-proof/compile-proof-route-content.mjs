#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const proofRoot = join(repoRoot, "src/i18n/content/proof");
const routeOutputRoot = join(proofRoot, "routes");
const publicationPath = join(proofRoot, "route-content-publication.json");

export const PROOF_CONTENT_LOCALES = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
export const PROOF_CONTENT_ROUTES = ["/breathe/buteyko", "/for/anxiety"];

const ROUTE_CONFIG = {
  "/breathe/buteyko": {
    exportName: "breathingPages",
    kind: "breathing",
    routeId: "breathe.buteyko",
    sourceFile: "src/data/breathing-pages.ts",
    stem: "breathe-buteyko",
  },
  "/for/anxiety": {
    exportName: "useCasePages",
    kind: "use-case",
    routeId: "for.anxiety",
    sourceFile: "src/data/use-case-pages.ts",
    stem: "for-anxiety",
  },
};

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function evaluateLiteral(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    if (node.operator === ts.SyntaxKind.MinusToken) return -value;
    if (node.operator === ts.SyntaxKind.PlusToken) return value;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => evaluateLiteral(element));
  }

  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.map((property) => {
      assert(ts.isPropertyAssignment(property), "Proof content supports property assignments only");
      return [propertyName(property.name), evaluateLiteral(property.initializer)];
    }));
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

  throw new Error(
    `Unsupported proof content expression ${ts.SyntaxKind[node.kind]} at ` +
    `${node.getSourceFile().fileName}:${node.getStart()}`,
  );
}

function findPageInitializers(sourceFile, exportName) {
  const objectDeclarations = new Map();
  let array = null;

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      if (declaration.name.text === exportName) {
        assert(ts.isArrayLiteralExpression(declaration.initializer), `${exportName} must be an array literal`);
        array = declaration.initializer;
      } else if (ts.isObjectLiteralExpression(declaration.initializer)) {
        objectDeclarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  assert(array, `Could not find ${exportName}`);

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
      if (ts.isObjectLiteralExpression(argument)) pages.push(argument);
      else if (ts.isIdentifier(argument) && objectDeclarations.has(argument.text)) {
        pages.push(objectDeclarations.get(argument.text));
      } else {
        throw new Error(`${exportName}.push() has an unsupported page expression`);
      }
    }
  }
  return pages;
}

async function extractSourcePage(route) {
  const config = ROUTE_CONFIG[route];
  const sourcePath = join(repoRoot, config.sourceFile);
  const sourceText = await readFile(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert(sourceFile.parseDiagnostics.length === 0, `Could not parse ${config.sourceFile}`);

  const expectedSlug = route.split("/").at(-1);
  for (const initializer of findPageInitializers(sourceFile, config.exportName)) {
    if (!ts.isObjectLiteralExpression(initializer)) continue;
    const page = evaluateLiteral(initializer);
    if (page.slug === expectedSlug) return page;
  }
  throw new Error(`Could not find source page ${route}`);
}

function parseSourcePath(sourcePath) {
  const parts = [];
  const pattern = /([^.\[\]]+)|\[(\d+)\]/g;
  let match;
  while ((match = pattern.exec(sourcePath)) !== null) {
    parts.push(match[1] ?? Number(match[2]));
  }
  const rebuilt = parts.reduce(
    (value, part) => typeof part === "number" ? `${value}[${part}]` : value ? `${value}.${part}` : part,
    "",
  );
  assert(rebuilt === sourcePath, `Invalid semantic source path ${sourcePath}`);
  return parts;
}

export function getAtSourcePath(value, sourcePath) {
  return parseSourcePath(sourcePath).reduce((current, part) => current?.[part], value);
}

function setAtSourcePath(value, sourcePath, translation) {
  const parts = parseSourcePath(sourcePath);
  const field = parts.pop();
  const parent = parts.reduce((current, part) => current?.[part], value);
  assert(parent && typeof parent === "object", `Missing parent for ${sourcePath}`);
  assert(typeof parent[field] === "string", `${sourcePath} does not point to a source string`);
  parent[field] = translation;
}

function sameShape(source, localized, sourcePath = "page") {
  if (Array.isArray(source)) {
    assert(Array.isArray(localized), `${sourcePath} changed from array`);
    assert(source.length === localized.length, `${sourcePath} changed array length`);
    source.forEach((child, index) => sameShape(child, localized[index], `${sourcePath}[${index}]`));
    return;
  }
  if (source && typeof source === "object") {
    assert(localized && typeof localized === "object" && !Array.isArray(localized), `${sourcePath} changed object shape`);
    assert(
      JSON.stringify(Object.keys(source).sort()) === JSON.stringify(Object.keys(localized).sort()),
      `${sourcePath} changed object keys`,
    );
    for (const [key, child] of Object.entries(source)) {
      sameShape(child, localized[key], `${sourcePath}.${key}`);
    }
    return;
  }
  assert(typeof source === typeof localized, `${sourcePath} changed primitive type`);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function buildProofRouteContentArtifacts() {
  const semanticMap = await readJson(join(proofRoot, "semantic-map.json"));
  const sourcePages = Object.fromEntries(
    await Promise.all(PROOF_CONTENT_ROUTES.map(async (route) => [route, await extractSourcePage(route)])),
  );
  const outputs = new Map();
  const bundles = {};
  const messages = {};
  const publication = { schemaVersion: 1, routes: {} };

  for (const route of PROOF_CONTENT_ROUTES) {
    const config = ROUTE_CONFIG[route];
    const routeMap = semanticMap.routes.find((candidate) => candidate.sourceRoute === route);
    assert(routeMap?.routeId === config.routeId, `Semantic map is missing ${route}`);
    bundles[route] = {};
    messages[route] = {};
    publication.routes[route] = {
      expectedMessages: routeMap.messages.length,
      kind: config.kind,
      locales: {},
      routeId: config.routeId,
    };

    for (const locale of PROOF_CONTENT_LOCALES) {
      const messagePath = join(proofRoot, "messages", locale, `${config.stem}.json`);
      const localeMessages = await readJson(messagePath);
      const expectedIds = routeMap.messages.map((mapping) => mapping.messageId).sort();
      const actualIds = Object.keys(localeMessages).sort();
      assert(
        JSON.stringify(actualIds) === JSON.stringify(expectedIds),
        `${route}:${locale} message set is incomplete`,
      );

      const localized = structuredClone(sourcePages[route]);
      for (const mapping of routeMap.messages) {
        const translation = localeMessages[mapping.messageId];
        assert(typeof translation === "string" && translation.trim(), `${mapping.messageId}:${locale} is empty`);
        setAtSourcePath(localized, mapping.sourcePath, translation);
      }
      sameShape(sourcePages[route], localized);

      const relativePath = `routes/${locale}/${config.stem}.json`;
      const serialized = stableJson(localized);
      outputs.set(relativePath, serialized);
      bundles[route][locale] = localized;
      messages[route][locale] = localeMessages;
      publication.routes[route].locales[locale] = {
        bytes: Buffer.byteLength(serialized),
        path: relativePath,
        publishable: true,
        sha256: sha256(serialized),
      };
    }
  }

  outputs.set("route-content-publication.json", stableJson(publication));
  return { bundles, messages, outputs, publication, semanticMap, sourcePages };
}

export async function checkGeneratedRouteContentArtifacts() {
  const { outputs } = await buildProofRouteContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of outputs) {
    let actual = null;
    try {
      actual = await readFile(join(proofRoot, relativePath), "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: outputs.size, stale };
}

async function writeGeneratedRouteContentArtifacts() {
  assert(routeOutputRoot === join(proofRoot, "routes"), "Refusing unsafe route output path");
  await rm(routeOutputRoot, { force: true, recursive: true });
  const { outputs } = await buildProofRouteContentArtifacts();
  for (const [relativePath, content] of outputs) {
    const outputPath = join(proofRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return outputs.size;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const result = await checkGeneratedRouteContentArtifacts();
    if (result.stale.length > 0) {
      console.error(`Stale proof route content: ${result.stale.join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log(`Checked ${result.checked} proof route-content artifacts.`);
    }
  } else {
    const count = await writeGeneratedRouteContentArtifacts();
    console.log(`Wrote ${count} proof route-content artifacts.`);
  }
}
