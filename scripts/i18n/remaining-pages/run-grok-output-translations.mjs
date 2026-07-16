#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";
import {
  contractFileName,
  stableJson,
} from "./compile-remaining-page-gaps.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manualRoot = join(repoRoot, "src/i18n/content/remaining-pages/manual");
const batchMapPath = join(
  repoRoot,
  "docs/native-i18n/work/remaining-pages-batch-map.json",
);
const grokBinary = "/Users/abi/.grok/bin/grok";
const runRootBase =
  "/tmp/deepbreathing-native-i18n-remaining-pages-grok-output";
const locales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function routeKey(route) {
  return route.slice(1).replaceAll("/", "--");
}

function routeRoot(runId, batchId, route) {
  return join(runRootBase, runId, batchId, routeKey(route));
}

function countNullCells(document) {
  return document.entries.reduce(
    (total, entry) =>
      total +
      Object.values(entry.translations).filter((value) => value === null)
        .length,
    0,
  );
}

function unresolvedContract(document) {
  return document.entries
    .map((entry) => ({
      messageId: entry.messageId,
      locales: Object.entries(entry.translations)
        .filter(([, value]) => value === null)
        .map(([locale]) => locale),
    }))
    .filter((entry) => entry.locales.length > 0);
}

function validateCanonicalContract(document, label) {
  assert(document.schemaVersion === 1, `${label}: unsupported schemaVersion`);
  assert(
    typeof document.sourceRoute === "string" &&
      document.sourceRoute.startsWith("/"),
    `${label}: invalid sourceRoute`,
  );
  assert(Array.isArray(document.entries), `${label}: entries must be an array`);
  const messageIds = new Set();
  for (const entry of document.entries) {
    assert(
      typeof entry.messageId === "string" && !messageIds.has(entry.messageId),
      `${label}: duplicate or invalid messageId`,
    );
    messageIds.add(entry.messageId);
    assert(
      entry.reviewedSourceHash === sha256(entry.sourceText),
      `${label}:${entry.messageId}: reviewed source hash drifted`,
    );
    assert(
      JSON.stringify(Object.keys(entry.translations)) ===
        JSON.stringify(locales),
      `${label}:${entry.messageId}: locale keys or key order changed`,
    );
    for (const [locale, value] of Object.entries(entry.translations)) {
      assert(
        value === null || (typeof value === "string" && value.length > 0),
        `${label}:${entry.messageId}:${locale}: invalid translation`,
      );
    }
  }
}

export function outputSchema(document, supportedLocales = locales) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["entries", "schemaVersion", "sourceRoute"],
    properties: {
      entries: {
        type: "array",
        minItems: document.entries.length,
        maxItems: document.entries.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "messageId",
            "reason",
            "reviewedSourceHash",
            "scope",
            "sourceText",
            "translations",
          ],
          properties: {
            messageId: { type: "string" },
            reason: { type: "string" },
            reviewedSourceHash: { type: "string" },
            scope: { type: "string", enum: ["chrome", "content"] },
            sourceText: { type: "string" },
            translations: {
              type: "object",
              additionalProperties: false,
              required: supportedLocales,
              properties: Object.fromEntries(
                supportedLocales.map((locale) => [
                  locale,
                  { type: "string", minLength: 1 },
                ]),
              ),
            },
          },
        },
      },
      schemaVersion: { type: "integer", enum: [document.schemaVersion] },
      sourceRoute: { type: "string", enum: [document.sourceRoute] },
    },
  };
}

export function promptFor(document) {
  const expectedCells = countNullCells(document);
  const noun = expectedCells === 1 ? "value" : "values";
  return `# Output-only native i18n translation

Translate every null value in the JSON contract below. Do not edit files and do not call tools. Return only the complete schema-constrained JSON contract with the nulls replaced by translated strings.

Locale keys:

- de-de: German for Germany
- es-es: Spanish for Spain
- fr-fr: French for France
- ja-jp: Japanese for Japan
- pt-br: Portuguese for Brazil

Strict rules:

1. Return the complete contract with the same top-level fields, entries, entry order, fields, and locale keys.
2. Change only values that are currently null inside translations objects. Copy every immutable field and existing non-null translation exactly.
3. Translate sourceText faithfully and naturally without editing, expanding, simplifying, keyword-optimizing, or improving its claims.
4. Preserve every number, numeric range, unit, URL, Markdown destination, HTML tag/resource, interpolation token, placeholder, arrow, and protected symbol.
5. Preserve Markdown structure. Translate link labels, never link destinations.
6. Preserve claim strength, caveats, timings, researcher names, protocol names, citations, product names, and safety language.
7. Do not repair or improve the English source. Translate its intended meaning as narrowly as possible.
8. Exactly ${expectedCells} null ${noun} must become non-empty translated strings. Do not add a count, report wrapper, flags, commentary, or Markdown fence.

JSON contract:

${stableJson(document)}`;
}

export function buildGrokArguments({ cwd, promptPath, model, schema }) {
  return [
    "--cwd",
    cwd,
    "--prompt-file",
    promptPath,
    "--verbatim",
    "--model",
    model,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(schema),
    "--sandbox",
    "strict",
    "--permission-mode",
    "default",
    "--tools",
    "",
    "--deny",
    "Read",
    "--deny",
    "Glob",
    "--deny",
    "Grep",
    "--deny",
    "StrReplace",
    "--deny",
    "Bash",
    "--deny",
    "Shell",
    "--deny",
    "MCPTool",
    "--deny",
    "CallMcpTool",
    "--deny",
    "WebFetch",
    "--deny",
    "WebSearch",
    "--no-plan",
    "--no-subagents",
    "--no-memory",
    "--disable-web-search",
    "--no-auto-update",
    "--max-turns",
    "1",
  ];
}

export function validateReturnedContract(
  canonical,
  returnedDocument,
  expectedCells,
) {
  const merged = structuredClone(canonical);
  const errors = [];
  let actualCells = 0;

  try {
    validateCanonicalContract(canonical, canonical.sourceRoute ?? "contract");
  } catch (error) {
    errors.push(error.message);
    return { accepted: false, actualCells, errors, merged };
  }
  if (!returnedDocument || typeof returnedDocument !== "object") {
    errors.push("returned contract is not an object");
    return { accepted: false, actualCells, errors, merged };
  }
  if (returnedDocument.schemaVersion !== canonical.schemaVersion)
    errors.push("schemaVersion changed");
  if (returnedDocument.sourceRoute !== canonical.sourceRoute)
    errors.push("sourceRoute changed");
  if (
    !Array.isArray(returnedDocument.entries) ||
    returnedDocument.entries.length !== canonical.entries.length
  ) {
    errors.push("entry array shape changed");
  } else {
    for (let index = 0; index < canonical.entries.length; index += 1) {
      const target = canonical.entries[index];
      const returned = returnedDocument.entries[index];
      if (!returned || typeof returned !== "object") {
        errors.push(`${target.messageId}: returned entry is invalid`);
        continue;
      }
      for (const field of [
        "messageId",
        "reason",
        "reviewedSourceHash",
        "scope",
        "sourceText",
      ]) {
        if (returned[field] !== target[field])
          errors.push(`${target.messageId}: ${field} changed`);
      }
      if (!returned.translations || typeof returned.translations !== "object") {
        errors.push(`${target.messageId}: translations object changed`);
        continue;
      }
      if (
        JSON.stringify(Object.keys(returned.translations)) !==
        JSON.stringify(Object.keys(target.translations))
      ) {
        errors.push(`${target.messageId}: locale keys or key order changed`);
        continue;
      }
      for (const [locale, previous] of Object.entries(target.translations)) {
        const translation = returned.translations[locale];
        if (previous !== null) {
          if (translation !== previous) {
            errors.push(
              `${target.messageId}:${locale} changed an existing translation`,
            );
          }
          continue;
        }
        try {
          validateForTranslationSafety(
            target.sourceText,
            translation,
            `${canonical.sourceRoute}:${target.messageId}:${locale} Grok output`,
          );
          merged.entries[index].translations[locale] = translation;
          actualCells += 1;
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }
  if (actualCells !== expectedCells) {
    errors.push(
      `expected ${expectedCells} safe translated cells, found ${actualCells}`,
    );
  }
  return {
    accepted: errors.length === 0,
    actualCells,
    errors,
    merged,
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function resolveAssignment(argv) {
  const [command, ...rest] = argv;
  let runId;
  let batchId = "R-C01";
  let requestedRoutes = [];
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--run-id") {
      runId = rest[++index];
    } else if (rest[index] === "--batch") {
      batchId = rest[++index];
    } else if (rest[index] === "--routes") {
      requestedRoutes = rest[++index].split(",").filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${rest[index]}`);
    }
  }
  const batchMap = await readJson(batchMapPath);
  const batch = batchMap.grokTranslationBatches.find(
    (candidate) => candidate.id === batchId,
  );
  assert(batch, `Unknown batch: ${batchId}`);
  const normalizedRoutes = requestedRoutes.map((route) =>
    route.startsWith("/") ? route : `/${route}`,
  );
  const selectedRoutes =
    normalizedRoutes.length > 0 ? normalizedRoutes : batch.routes;
  for (const route of selectedRoutes) {
    assert(
      batch.routes.includes(route),
      `${route} does not belong to ${batchId}`,
    );
  }
  return { command, runId, batch, selectedRoutes };
}

async function readCanonical(route) {
  const path = join(manualRoot, contractFileName(route));
  const text = await readFile(path, "utf8");
  const document = JSON.parse(text);
  validateCanonicalContract(document, route);
  assert(document.sourceRoute === route, `${route}: sourceRoute mismatch`);
  return { path, text, document };
}

async function prepare(runId, batch, selectedRoutes) {
  assert(runId, "--run-id is required for prepare");
  for (const route of selectedRoutes) {
    const root = routeRoot(runId, batch.id, route);
    await mkdir(join(root, "capture"), { recursive: true });
    const canonical = await readCanonical(route);
    const expectedCells = countNullCells(canonical.document);
    assert(expectedCells > 0, `${route}: no unresolved translations`);
    const prompt = promptFor(canonical.document);
    await writeFile(join(root, "PROMPT.md"), prompt);
    await writeFile(
      join(root, "assignment.json"),
      stableJson({
        batchId: batch.id,
        expectedCells,
        model: batch.model,
        promptHash: sha256(prompt),
        route,
        sourceHash: sha256(canonical.text),
        sourceRoute: canonical.document.sourceRoute,
        unresolved: unresolvedContract(canonical.document),
      }),
    );
  }
  process.stdout.write(
    stableJson({ batchId: batch.id, runId, selectedRoutes }),
  );
}

async function spawnRoute(runId, batch, route) {
  const root = routeRoot(runId, batch.id, route);
  const captureRoot = join(root, "capture");
  const canonical = await readCanonical(route);
  const promptPath = join(root, "PROMPT.md");
  const args = buildGrokArguments({
    cwd: root,
    promptPath,
    model: batch.model,
    schema: outputSchema(canonical.document),
  });
  const startedAt = new Date();
  const child = spawn(grokBinary, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const exitCode = await new Promise((resolveExit, reject) => {
    child.on("error", reject);
    child.on("close", resolveExit);
  });
  const completedAt = new Date();
  await writeFile(join(captureRoot, "raw.json"), Buffer.concat(stdout));
  await writeFile(join(captureRoot, "stderr.log"), Buffer.concat(stderr));
  await writeFile(
    join(captureRoot, "process.json"),
    stableJson({
      batchId: batch.id,
      completedAt: completedAt.toISOString(),
      elapsedMs: completedAt.getTime() - startedAt.getTime(),
      exitCode,
      model: batch.model,
      route,
      startedAt: startedAt.toISOString(),
    }),
  );
  return {
    route,
    exitCode,
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
  };
}

async function run(runId, batch, selectedRoutes) {
  assert(runId, "--run-id is required for run");
  const results = await Promise.all(
    selectedRoutes.map((route) => spawnRoute(runId, batch, route)),
  );
  process.stdout.write(stableJson({ batchId: batch.id, runId, results }));
  if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
}

async function validateRoute(runId, batch, route, shouldMerge) {
  const root = routeRoot(runId, batch.id, route);
  const assignment = await readJson(join(root, "assignment.json"));
  assert(assignment.batchId === batch.id, `${route}: batch changed`);
  assert(assignment.model === batch.model, `${route}: model changed`);
  const canonical = await readCanonical(route);
  assert(
    sha256(canonical.text) === assignment.sourceHash,
    `${route}: canonical input changed after prepare`,
  );
  const prompt = await readFile(join(root, "PROMPT.md"), "utf8");
  assert(sha256(prompt) === assignment.promptHash, `${route}: prompt changed`);
  const envelope = await readJson(join(root, "capture/raw.json"));
  assert(
    (envelope.type ?? "") !== "error",
    `${route}: Grok returned an error envelope`,
  );
  assert(
    envelope.stopReason === "EndTurn",
    `${route}: unexpected stopReason ${envelope.stopReason}`,
  );
  assert(typeof envelope.sessionId === "string", `${route}: missing sessionId`);
  const returnedDocument =
    envelope.structuredOutput ?? JSON.parse(envelope.text);
  const result = validateReturnedContract(
    canonical.document,
    returnedDocument,
    assignment.expectedCells,
  );
  if (shouldMerge && result.accepted) {
    await writeFile(canonical.path, stableJson(result.merged));
  }
  const validation = {
    accepted: result.accepted,
    actualCells: result.actualCells,
    batchId: batch.id,
    entries: assignment.unresolved.length,
    errors: result.errors,
    expectedCells: assignment.expectedCells,
    flags: [],
    merged: shouldMerge && result.accepted,
    modelUsage: envelope.modelUsage ?? null,
    requestId: envelope.requestId ?? null,
    reworkRisks: [],
    route,
    sessionId: envelope.sessionId,
    usage: envelope.usage ?? null,
  };
  await writeFile(
    join(root, "capture/report.json"),
    stableJson(returnedDocument),
  );
  await writeFile(
    join(root, "capture/validation.json"),
    stableJson(validation),
  );
  return validation;
}

async function validate(runId, batch, selectedRoutes, shouldMerge) {
  assert(
    runId,
    `--run-id is required for ${shouldMerge ? "merge" : "validate"}`,
  );
  const results = [];
  for (const route of selectedRoutes) {
    results.push(await validateRoute(runId, batch, route, shouldMerge));
  }
  process.stdout.write(
    stableJson({
      batchId: batch.id,
      runId,
      results: results.map(
        ({ route, expectedCells, actualCells, errors, accepted, merged }) => ({
          accepted,
          actualCells,
          errors,
          expectedCells,
          merged,
          route,
        }),
      ),
    }),
  );
  if (results.some((result) => !result.accepted)) process.exitCode = 1;
}

async function listRuns() {
  process.stdout.write(
    stableJson((await readdir(runRootBase).catch(() => [])).sort()),
  );
}

async function main() {
  const { command, runId, batch, selectedRoutes } = await resolveAssignment(
    process.argv.slice(2),
  );
  switch (command) {
    case "prepare":
      await prepare(runId, batch, selectedRoutes);
      break;
    case "run":
      await run(runId, batch, selectedRoutes);
      break;
    case "validate":
      await validate(runId, batch, selectedRoutes, false);
      break;
    case "merge":
      await validate(runId, batch, selectedRoutes, true);
      break;
    case "list":
      await listRuns();
      break;
    default:
      throw new Error(
        "Usage: run-grok-output-translations.mjs <prepare|run|validate|merge|list> --run-id ID [--batch R-C01] [--routes breathing-app,stats]",
      );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
