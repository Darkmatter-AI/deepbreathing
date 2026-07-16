#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FOR_CONTENT_LOCALES,
  validateForTranslationSafety,
} from "./compile-for-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manualRoot = join(repoRoot, "src/i18n/content/use-cases/manual");
const grokBinary = "/Users/abi/.grok/bin/grok";
const runRootBase = "/tmp/deepbreathing-native-i18n-grok-output";
const model = "grok-composer-2.5-fast";

const routes = [
  "running",
  "travel-anxiety",
  "meditation",
  "focus",
  "public-speaking",
  "stress",
  "singing",
  "sleep",
  "huberman",
  "kids",
  "holiday-stress",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  let runId;
  let selectedRoutes = [];
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--run-id") {
      runId = rest[index + 1];
      index += 1;
      continue;
    }
    if (rest[index] === "--routes") {
      selectedRoutes = rest[index + 1].split(",").filter(Boolean);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${rest[index]}`);
  }
  if (selectedRoutes.length === 0) selectedRoutes = routes;
  for (const route of selectedRoutes)
    assert(routes.includes(route), `Unknown route: ${route}`);
  return { command, runId, selectedRoutes };
}

function routeRoot(runId, route) {
  return join(runRootBase, runId, route);
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

function outputSchema(document) {
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
              properties: Object.fromEntries(
                FOR_CONTENT_LOCALES.map((locale) => [
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

function promptFor(document) {
  const expectedCells = countNullCells(document);
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
7. Do not repair the English source. Translate its intended meaning as narrowly as possible and flag objectively broken or ambiguous source text.
8. Exactly ${expectedCells} null values must become non-empty translated strings. Do not add a count, report wrapper, flags, commentary, or Markdown fence.

JSON contract:

${stableJson(document)}
`;
}

async function prepare(runId, selectedRoutes) {
  assert(runId, "--run-id is required for prepare");
  for (const route of selectedRoutes) {
    const root = routeRoot(runId, route);
    await mkdir(join(root, "capture"), { recursive: true });
    const canonicalText = await readFile(
      join(manualRoot, `${route}.json`),
      "utf8",
    );
    const document = JSON.parse(canonicalText);
    const expectedCells = countNullCells(document);
    assert(expectedCells > 0, `${route}: no unresolved translations`);
    await writeFile(join(root, "PROMPT.md"), promptFor(document));
    await writeFile(
      join(root, "assignment.json"),
      stableJson({
        route,
        sourceRoute: document.sourceRoute,
        sourceHash: sha256(canonicalText),
        expectedCells,
        unresolved: unresolvedContract(document),
      }),
    );
  }
  process.stdout.write(stableJson({ runId, selectedRoutes }));
}

async function spawnRoute(runId, route) {
  const root = routeRoot(runId, route);
  const captureRoot = join(root, "capture");
  const document = JSON.parse(
    await readFile(join(manualRoot, `${route}.json`), "utf8"),
  );
  const args = [
    "--cwd",
    root,
    "--prompt-file",
    join(root, "PROMPT.md"),
    "--verbatim",
    "--model",
    model,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(outputSchema(document)),
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
      route,
      model,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      elapsedMs: completedAt.getTime() - startedAt.getTime(),
      exitCode,
    }),
  );
  return {
    route,
    exitCode,
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
  };
}

async function run(runId, selectedRoutes) {
  assert(runId, "--run-id is required for run");
  const results = await Promise.all(
    selectedRoutes.map((route) => spawnRoute(runId, route)),
  );
  process.stdout.write(stableJson({ runId, results }));
  if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
}

async function validateRoute(runId, route, shouldMerge) {
  const root = routeRoot(runId, route);
  const assignment = JSON.parse(
    await readFile(join(root, "assignment.json"), "utf8"),
  );
  const canonicalPath = join(manualRoot, `${route}.json`);
  const canonicalText = await readFile(canonicalPath, "utf8");
  assert(
    sha256(canonicalText) === assignment.sourceHash,
    `${route}: canonical input changed after prepare`,
  );
  const document = JSON.parse(canonicalText);
  const envelope = JSON.parse(
    await readFile(join(root, "capture/raw.json"), "utf8"),
  );
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
  let actualCells = 0;
  const errors = [];
  if (returnedDocument.schemaVersion !== document.schemaVersion)
    errors.push("schemaVersion changed");
  if (returnedDocument.sourceRoute !== document.sourceRoute)
    errors.push("sourceRoute changed");
  if (
    !Array.isArray(returnedDocument.entries) ||
    returnedDocument.entries.length !== document.entries.length
  ) {
    errors.push("entry array shape changed");
  } else {
    for (let index = 0; index < document.entries.length; index += 1) {
      const target = document.entries[index];
      const returned = returnedDocument.entries[index];
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
          if (translation !== previous)
            errors.push(
              `${target.messageId}:${locale} changed an existing translation`,
            );
          continue;
        }
        try {
          validateForTranslationSafety(
            target.sourceText,
            translation,
            `${route}:${target.messageId}:${locale} Grok output`,
          );
          target.translations[locale] = translation;
          actualCells += 1;
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }
  if (actualCells !== assignment.expectedCells) {
    errors.push(
      `expected ${assignment.expectedCells} safe translated cells, found ${actualCells}`,
    );
  }
  if (shouldMerge && errors.length === 0)
    await writeFile(canonicalPath, stableJson(document));

  const validation = {
    route,
    sessionId: envelope.sessionId,
    requestId: envelope.requestId ?? null,
    expectedCells: assignment.expectedCells,
    actualCells,
    entries: assignment.unresolved.length,
    flags: [],
    reworkRisks: [],
    usage: envelope.usage ?? null,
    modelUsage: envelope.modelUsage ?? null,
    errors,
    accepted: errors.length === 0,
    merged: shouldMerge && errors.length === 0,
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

async function validate(runId, selectedRoutes, shouldMerge) {
  assert(
    runId,
    `--run-id is required for ${shouldMerge ? "merge" : "validate"}`,
  );
  const results = [];
  for (const route of selectedRoutes)
    results.push(await validateRoute(runId, route, shouldMerge));
  process.stdout.write(
    stableJson({
      runId,
      results: results.map(
        ({ route, expectedCells, actualCells, errors, accepted, merged }) => ({
          route,
          expectedCells,
          actualCells,
          errors,
          accepted,
          merged,
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

const { command, runId, selectedRoutes } = parseArguments(
  process.argv.slice(2),
);
switch (command) {
  case "prepare":
    await prepare(runId, selectedRoutes);
    break;
  case "run":
    await run(runId, selectedRoutes);
    break;
  case "validate":
    await validate(runId, selectedRoutes, false);
    break;
  case "merge":
    await validate(runId, selectedRoutes, true);
    break;
  case "list":
    await listRuns();
    break;
  default:
    throw new Error(
      "Usage: run-grok-output-translations.mjs <prepare|run|validate|merge|list> --run-id ID [--routes running,stress]",
    );
}
