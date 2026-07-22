#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateForTranslationSafety } from "../structured-for/compile-for-content.mjs";
import {
  contractFileName,
  stableJson,
} from "./compile-remaining-page-gaps.mjs";
import {
  buildGrokArguments,
  validateReturnedContract,
} from "./run-grok-output-translations.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manualRoot = join(repoRoot, "src/i18n/content/remaining-pages/manual");
const batchMapPath = join(
  repoRoot,
  "docs/native-i18n/work/remaining-pages-batch-map.json",
);
const grokBinary = "/Users/abi/.grok/bin/grok";
const sourceRunRootBase =
  "/tmp/deepbreathing-native-i18n-remaining-pages-grok-output";
const reviewModel = "grok-4.5";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function routeKey(route) {
  return route.slice(1).replaceAll("/", "--");
}

function sourceRouteRoot(sourceRunId, batchId, route) {
  return join(sourceRunRootBase, sourceRunId, batchId, routeKey(route));
}

function reviewRoot(sourceRunId, batchId, route) {
  return join(sourceRouteRoot(sourceRunId, batchId, route), "review-grok-4.5");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function returnedDocument(envelope, label) {
  assert(
    (envelope.type ?? "") !== "error",
    `${label}: Grok returned an error envelope`,
  );
  assert(
    envelope.stopReason === "EndTurn",
    `${label}: unexpected stopReason ${envelope.stopReason}`,
  );
  assert(typeof envelope.sessionId === "string", `${label}: missing sessionId`);
  return envelope.structuredOutput ?? JSON.parse(envelope.text);
}

export function buildReviewDocument(batchId, canonical, proposed) {
  assert(
    canonical.sourceRoute === proposed.sourceRoute,
    "Review sourceRoute changed",
  );
  assert(
    canonical.entries.length === proposed.entries.length,
    "Review entry shape changed",
  );
  const entries = [];
  for (let index = 0; index < canonical.entries.length; index += 1) {
    const source = canonical.entries[index];
    const candidate = proposed.entries[index];
    assert(
      source.messageId === candidate.messageId,
      "Review messageId changed",
    );
    for (const [locale, previous] of Object.entries(source.translations)) {
      if (previous !== null) continue;
      const translation = candidate.translations[locale];
      validateForTranslationSafety(
        source.sourceText,
        translation,
        `${canonical.sourceRoute}:${source.messageId}:${locale} Composer proposal`,
      );
      entries.push({
        decision: null,
        locale,
        messageId: source.messageId,
        reason: null,
        reviewedTranslation: null,
        scope: source.scope,
        sourceText: source.sourceText,
        translation,
      });
    }
  }
  return {
    batchId,
    entries,
    schemaVersion: 1,
    sourceRoute: canonical.sourceRoute,
  };
}

export function reviewOutputSchema(review) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["batchId", "entries", "schemaVersion", "sourceRoute"],
    properties: {
      batchId: { type: "string", enum: [review.batchId] },
      entries: {
        type: "array",
        minItems: review.entries.length,
        maxItems: review.entries.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "decision",
            "locale",
            "messageId",
            "reason",
            "reviewedTranslation",
            "scope",
            "sourceText",
            "translation",
          ],
          properties: {
            decision: { type: "string", enum: ["approve", "rework"] },
            locale: { type: "string" },
            messageId: { type: "string" },
            reason: { type: "string", minLength: 1 },
            reviewedTranslation: { type: "string", minLength: 1 },
            scope: { type: "string", enum: ["chrome", "content"] },
            sourceText: { type: "string" },
            translation: { type: "string", minLength: 1 },
          },
        },
      },
      schemaVersion: { type: "integer", enum: [review.schemaVersion] },
      sourceRoute: { type: "string", enum: [review.sourceRoute] },
    },
  };
}

function reviewPrompt(review) {
  return `# Independent strict-parity translation review

Review every proposed translation in the JSON contract below. Do not edit files and do not call tools. Return only the complete schema-constrained review contract.

This is a migration parity review, not an editorial, SEO, or content-improvement pass.

For every entry:

1. Compare translation against sourceText for the exact locale.
2. Preserve meaning, claim strength, caveats, safety language, numbers, units, timings, names, product terms, links, markup, placeholders, arrows, and protected symbols.
3. Require natural target-locale grammar and terminology, but do not broaden, simplify, keyword-optimize, or improve the English source.
4. Set decision to "approve" when the proposal is faithful and natural. Copy translation exactly into reviewedTranslation.
5. Set decision to "rework" only for a concrete defect. Put a corrected strict-parity translation in reviewedTranslation and explain the defect briefly in reason.
6. Keep batchId, schemaVersion, sourceRoute, entry order, locale, messageId, scope, sourceText, and translation exactly unchanged.

Review contract:

${stableJson(review)}`;
}

export function validateReviewDocument(expected, returned) {
  const errors = [];
  let approved = 0;
  let reworked = 0;
  if (!returned || typeof returned !== "object") {
    return {
      accepted: false,
      approved,
      errors: ["returned review is not an object"],
      reworked,
    };
  }
  for (const field of ["batchId", "schemaVersion", "sourceRoute"]) {
    if (returned[field] !== expected[field]) errors.push(`${field} changed`);
  }
  if (
    !Array.isArray(returned.entries) ||
    returned.entries.length !== expected.entries.length
  ) {
    errors.push("review entry array shape changed");
  } else {
    for (let index = 0; index < expected.entries.length; index += 1) {
      const source = expected.entries[index];
      const review = returned.entries[index];
      if (!review || typeof review !== "object") {
        errors.push(
          `${source.messageId}:${source.locale}: invalid review entry`,
        );
        continue;
      }
      for (const field of [
        "locale",
        "messageId",
        "scope",
        "sourceText",
        "translation",
      ]) {
        if (review[field] !== source[field]) {
          errors.push(`${source.messageId}:${source.locale}: ${field} changed`);
        }
      }
      if (review.decision !== "approve" && review.decision !== "rework") {
        errors.push(`${source.messageId}:${source.locale}: invalid decision`);
        continue;
      }
      if (typeof review.reason !== "string" || review.reason.length === 0) {
        errors.push(`${source.messageId}:${source.locale}: missing reason`);
      }
      if (
        typeof review.reviewedTranslation !== "string" ||
        review.reviewedTranslation.length === 0
      ) {
        errors.push(
          `${source.messageId}:${source.locale}: missing reviewedTranslation`,
        );
        continue;
      }
      if (
        review.decision === "approve" &&
        review.reviewedTranslation !== source.translation
      ) {
        errors.push(
          `${source.messageId}:${source.locale}: approved translation changed`,
        );
      }
      if (
        review.decision === "rework" &&
        review.reviewedTranslation === source.translation
      ) {
        errors.push(
          `${source.messageId}:${source.locale}: rework did not change translation`,
        );
      }
      try {
        validateForTranslationSafety(
          source.sourceText,
          review.reviewedTranslation,
          `${expected.sourceRoute}:${source.messageId}:${source.locale} reviewed translation`,
        );
      } catch (error) {
        errors.push(error.message);
      }
      if (review.decision === "approve") approved += 1;
      else reworked += 1;
    }
  }
  return { accepted: errors.length === 0, approved, errors, reworked };
}

export function applyReviewDecisions(proposed, review) {
  const result = structuredClone(proposed);
  const entries = new Map(
    result.entries.map((entry) => [entry.messageId, entry]),
  );
  for (const decision of review.entries) {
    const entry = entries.get(decision.messageId);
    assert(entry, `Unknown reviewed messageId: ${decision.messageId}`);
    assert(
      Object.hasOwn(entry.translations, decision.locale),
      `Unknown reviewed locale: ${decision.messageId}:${decision.locale}`,
    );
    entry.translations[decision.locale] = decision.reviewedTranslation;
  }
  return result;
}

async function resolveAssignment(argv) {
  const [command, ...rest] = argv;
  let sourceRunId;
  let batchId = "R-C01";
  let requestedRoutes = [];
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--source-run-id") {
      sourceRunId = rest[++index];
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
  return { batch, command, selectedRoutes, sourceRunId };
}

async function loadSourceAssignment(sourceRunId, batch, route) {
  assert(sourceRunId, "--source-run-id is required");
  const sourceRoot = sourceRouteRoot(sourceRunId, batch.id, route);
  const canonicalPath = join(manualRoot, contractFileName(route));
  const canonicalText = await readFile(canonicalPath, "utf8");
  const canonical = JSON.parse(canonicalText);
  const sourceAssignment = await readJson(join(sourceRoot, "assignment.json"));
  assert(
    sourceAssignment.sourceHash === sha256(canonicalText),
    `${route}: canonical input changed after Composer prepare`,
  );
  const composerRawText = await readFile(
    join(sourceRoot, "capture/raw.json"),
    "utf8",
  );
  const composerEnvelope = JSON.parse(composerRawText);
  const proposed = returnedDocument(composerEnvelope, `${route} Composer`);
  const composerValidation = validateReturnedContract(
    canonical,
    proposed,
    sourceAssignment.expectedCells,
  );
  assert(
    composerValidation.accepted,
    `${route}: Composer output did not pass base validation`,
  );
  return {
    canonical,
    canonicalPath,
    canonicalText,
    composerRawText,
    expectedCells: sourceAssignment.expectedCells,
    proposed,
  };
}

async function prepare(sourceRunId, batch, selectedRoutes) {
  for (const route of selectedRoutes) {
    const source = await loadSourceAssignment(sourceRunId, batch, route);
    const root = reviewRoot(sourceRunId, batch.id, route);
    await mkdir(join(root, "capture"), { recursive: true });
    const review = buildReviewDocument(
      batch.id,
      source.canonical,
      source.proposed,
    );
    assert(
      review.entries.length === source.expectedCells,
      `${route}: review cell count mismatch`,
    );
    const reviewText = stableJson(review);
    const prompt = reviewPrompt(review);
    await writeFile(join(root, "review-input.json"), reviewText);
    await writeFile(join(root, "PROMPT.md"), prompt);
    await writeFile(
      join(root, "assignment.json"),
      stableJson({
        batchId: batch.id,
        canonicalHash: sha256(source.canonicalText),
        composerOutputHash: sha256(source.composerRawText),
        expectedCells: source.expectedCells,
        model: reviewModel,
        promptHash: sha256(prompt),
        reviewInputHash: sha256(reviewText),
        route,
        sourceRunId,
      }),
    );
  }
  process.stdout.write(
    stableJson({ batchId: batch.id, sourceRunId, selectedRoutes }),
  );
}

async function spawnReview(sourceRunId, batch, route) {
  const root = reviewRoot(sourceRunId, batch.id, route);
  const review = await readJson(join(root, "review-input.json"));
  const promptPath = join(root, "PROMPT.md");
  const args = buildGrokArguments({
    cwd: root,
    model: reviewModel,
    promptPath,
    schema: reviewOutputSchema(review),
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
  await writeFile(join(root, "capture/raw.json"), Buffer.concat(stdout));
  await writeFile(join(root, "capture/stderr.log"), Buffer.concat(stderr));
  await writeFile(
    join(root, "capture/process.json"),
    stableJson({
      completedAt: completedAt.toISOString(),
      elapsedMs: completedAt.getTime() - startedAt.getTime(),
      exitCode,
      model: reviewModel,
      route,
      startedAt: startedAt.toISOString(),
    }),
  );
  return {
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    exitCode,
    route,
  };
}

async function run(sourceRunId, batch, selectedRoutes) {
  assert(sourceRunId, "--source-run-id is required for run");
  const results = await Promise.all(
    selectedRoutes.map((route) => spawnReview(sourceRunId, batch, route)),
  );
  process.stdout.write(stableJson({ batchId: batch.id, results, sourceRunId }));
  if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
}

async function validateRoute(sourceRunId, batch, route, shouldMerge) {
  const root = reviewRoot(sourceRunId, batch.id, route);
  const assignment = await readJson(join(root, "assignment.json"));
  assert(assignment.model === reviewModel, `${route}: review model changed`);
  const source = await loadSourceAssignment(sourceRunId, batch, route);
  assert(
    assignment.canonicalHash === sha256(source.canonicalText),
    `${route}: canonical input changed after review prepare`,
  );
  assert(
    assignment.composerOutputHash === sha256(source.composerRawText),
    `${route}: Composer output changed after review prepare`,
  );
  const reviewInputText = await readFile(
    join(root, "review-input.json"),
    "utf8",
  );
  assert(
    assignment.reviewInputHash === sha256(reviewInputText),
    `${route}: review input changed`,
  );
  const prompt = await readFile(join(root, "PROMPT.md"), "utf8");
  assert(assignment.promptHash === sha256(prompt), `${route}: prompt changed`);
  const envelope = await readJson(join(root, "capture/raw.json"));
  const reviewed = returnedDocument(envelope, `${route} review`);
  const reviewValidation = validateReviewDocument(
    JSON.parse(reviewInputText),
    reviewed,
  );
  let finalValidation = {
    accepted: false,
    actualCells: 0,
    errors: ["review validation failed"],
  };
  let reviewedProposal = source.proposed;
  if (reviewValidation.accepted) {
    reviewedProposal = applyReviewDecisions(source.proposed, reviewed);
    finalValidation = validateReturnedContract(
      source.canonical,
      reviewedProposal,
      source.expectedCells,
    );
  }
  const errors = [...reviewValidation.errors, ...finalValidation.errors];
  const accepted = errors.length === 0 && finalValidation.accepted;
  if (shouldMerge && accepted) {
    await writeFile(source.canonicalPath, stableJson(reviewedProposal));
  }
  const validation = {
    accepted,
    actualCells: finalValidation.actualCells,
    approved: reviewValidation.approved,
    errors,
    expectedCells: source.expectedCells,
    merged: shouldMerge && accepted,
    modelUsage: envelope.modelUsage ?? null,
    requestId: envelope.requestId ?? null,
    reworked: reviewValidation.reworked,
    route,
    sessionId: envelope.sessionId,
    usage: envelope.usage ?? null,
  };
  await writeFile(
    join(root, "capture/reviewed-proposal.json"),
    stableJson(reviewedProposal),
  );
  await writeFile(
    join(root, "capture/validation.json"),
    stableJson(validation),
  );
  return validation;
}

async function validate(sourceRunId, batch, selectedRoutes, shouldMerge) {
  assert(
    sourceRunId,
    `--source-run-id is required for ${shouldMerge ? "merge" : "validate"}`,
  );
  const results = [];
  for (const route of selectedRoutes) {
    results.push(await validateRoute(sourceRunId, batch, route, shouldMerge));
  }
  process.stdout.write(
    stableJson({
      batchId: batch.id,
      results: results.map(
        ({
          accepted,
          actualCells,
          approved,
          errors,
          expectedCells,
          merged,
          reworked,
          route,
        }) => ({
          accepted,
          actualCells,
          approved,
          errors,
          expectedCells,
          merged,
          reworked,
          route,
        }),
      ),
      sourceRunId,
    }),
  );
  if (results.some((result) => !result.accepted)) process.exitCode = 1;
}

async function main() {
  const { batch, command, selectedRoutes, sourceRunId } =
    await resolveAssignment(process.argv.slice(2));
  switch (command) {
    case "prepare":
      await prepare(sourceRunId, batch, selectedRoutes);
      break;
    case "run":
      await run(sourceRunId, batch, selectedRoutes);
      break;
    case "validate":
      await validate(sourceRunId, batch, selectedRoutes, false);
      break;
    case "merge":
      await validate(sourceRunId, batch, selectedRoutes, true);
      break;
    default:
      throw new Error(
        "Usage: review-grok-output-translations.mjs <prepare|run|validate|merge> --source-run-id ID [--batch R-C01] [--routes breathing-app,stats]",
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
