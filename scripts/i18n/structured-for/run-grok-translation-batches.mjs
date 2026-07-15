#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manualRoot = join(repoRoot, "src/i18n/content/use-cases/manual");
const grokBinary = "/Users/abi/.grok/bin/grok";
const runRootBase = "/tmp/deepbreathing-native-i18n-grok";

const lanes = {
  "F-C01b": {
    model: "grok-composer-2.5-fast",
    expectedCells: 206,
    files: ["running.json", "travel-anxiety.json"],
  },
  "F-C02": {
    model: "grok-composer-2.5-fast",
    expectedCells: 130,
    files: [
      "meditation.json",
      "focus.json",
      "public-speaking.json",
      "stress.json",
    ],
  },
  "F-C03": {
    model: "grok-composer-2.5-fast",
    expectedCells: 119,
    files: [
      "singing.json",
      "sleep.json",
      "huberman.json",
      "kids.json",
      "holiday-stress.json",
    ],
  },
  "F-R01": {
    model: "grok-4.5",
    effort: "high",
    expectedCells: 146,
    files: [
      "high-blood-pressure.json",
      "pregnancy.json",
      "panic-attacks.json",
      "lung-capacity.json",
      "pranayama.json",
    ],
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  let runId;
  let laneIds = [];

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--run-id") {
      runId = rest[index + 1];
      index += 1;
      continue;
    }
    if (argument === "--lanes") {
      laneIds = rest[index + 1].split(",").filter(Boolean);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  const selectedLaneIds = laneIds.length > 0 ? laneIds : Object.keys(lanes);
  for (const laneId of selectedLaneIds) {
    assert(lanes[laneId], `Unknown lane: ${laneId}`);
  }

  return { command, runId, laneIds: selectedLaneIds };
}

function makeRunId() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "-");
}

function runRoot(runId) {
  return join(runRootBase, runId);
}

function laneRoot(runId, laneId) {
  return join(runRoot(runId), laneId);
}

function reportSchema(laneId, lane) {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "batchId",
      "filesChanged",
      "entriesCompleted",
      "localeCellsCompleted",
      "flags",
      "validationStatement",
      "reworkRisks",
    ],
    properties: {
      batchId: { type: "string", enum: [laneId] },
      filesChanged: {
        type: "array",
        items: { type: "string", enum: lane.files },
        uniqueItems: true,
      },
      entriesCompleted: { type: "integer", minimum: 0 },
      localeCellsCompleted: { type: "integer", minimum: 0 },
      flags: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["messageId", "sourcePath", "reason"],
          properties: {
            messageId: { type: "string" },
            sourcePath: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
      validationStatement: { type: "string" },
      reworkRisks: { type: "array", items: { type: "string" } },
    },
  };
}

function promptFor(laneId, lane) {
  const safetyNote =
    laneId === "F-R01"
      ? "This is the safety-sensitive review lane. Preserve every medical qualifier, limitation, emergency instruction, pregnancy caveat, timing, count, unit, and claim strength exactly. Do not make advice stronger or broader."
      : "Translate faithfully and naturally without editing, expanding, simplifying, or improving the source claims.";

  return `# Native i18n translation lane ${laneId}

You are a controlled translation worker. The only files you may edit are:

${lane.files.map((file) => `- ${file}`).join("\n")}

The JSON files are compiler-owned contracts. Each entry contains immutable identity and source fields plus a translations object. Fill every null translation value in the assigned files with a non-empty translation for its locale key.

Locale keys:

- de-de: German for Germany
- es-es: Spanish for Spain
- fr-fr: French for France
- ja-jp: Japanese for Japan
- pt-br: Portuguese for Brazil

Strict rules:

1. Change only values that are currently null inside translations objects.
2. Do not change schemaVersion, sourceRoute, entry order, messageId, reason, reviewedSourceHash, scope, sourceText, locale keys, or any existing non-null translation.
3. Preserve every number, numeric range, unit, URL, Markdown destination, HTML tag/resource, interpolation token, placeholder, arrow, and protected symbol from sourceText.
4. Preserve Markdown structure. Translate link labels, but never link destinations.
5. Do not add facts, recommendations, keywords, claims, formatting, or editorial improvements.
6. Keep product names, researcher names, protocol names, and citations accurate. Translate technique names only when the target language naturally does so.
7. Use search_replace for edits. Never use Bash, the web, MCP, memory, subagents, or files outside this directory.
8. Re-read every assigned file after editing and count the null values that became strings. Do not claim completion for untouched cells.

${safetyNote}

Expected unresolved cells at assignment: ${lane.expectedCells}.

Finish with only the schema-constrained report. Put any ambiguity or safety concern in flags and any likely follow-up in reworkRisks. The deterministic compiler, not your report, decides acceptance.
`;
}

function verificationPromptFor(laneId, lane) {
  return `# Verify completed native i18n lane ${laneId}

The previous worker filled the ${lane.expectedCells} originally null translation cells in these staged files:

${lane.files.map((file) => `- ${file}`).join("\n")}

Review every translation against sourceText. Confirm that schema, identity fields, existing translations, numbers, numeric ranges, units, URLs, Markdown destinations, HTML resources, placeholders, arrows, medical qualifiers, emergency instructions, timing, counts, and claim strength remain strict-parity equivalents.

You may change only a translated value that the previous worker filled if it has an objective translation or parity defect. Do not copyedit for style, improve claims, or change any immutable field. Use only Read, Glob, Grep, and StrReplace.

In the final schema-constrained report, localeCellsCompleted must be ${lane.expectedCells}, the number of originally null cells now filled in the staged diff. Put any unresolved ambiguity in flags and any likely follow-up in reworkRisks. The deterministic integrator validator remains the acceptance authority.
`;
}

async function prepare(runId, laneIds) {
  const root = runRoot(runId);
  await mkdir(root, { recursive: true });

  for (const laneId of laneIds) {
    const lane = lanes[laneId];
    const rootForLane = laneRoot(runId, laneId);
    const inputRoot = join(rootForLane, "input");
    const captureRoot = join(rootForLane, "capture");
    await mkdir(inputRoot, { recursive: true });
    await mkdir(captureRoot, { recursive: true });

    const sourceHashes = {};
    for (const file of lane.files) {
      const sourcePath = join(manualRoot, file);
      const destinationPath = join(inputRoot, file);
      await cp(sourcePath, destinationPath, { errorOnExist: true });
      sourceHashes[file] = sha256(await readFile(sourcePath));
    }

    await writeFile(join(inputRoot, "PROMPT.md"), promptFor(laneId, lane));
    await writeFile(
      join(rootForLane, "report-schema.json"),
      stableJson(reportSchema(laneId, lane)),
    );
    await writeFile(
      join(rootForLane, "assignment.json"),
      stableJson({
        laneId,
        model: lane.model,
        effort: lane.effort ?? null,
        expectedCells: lane.expectedCells,
        files: lane.files,
        sourceHashes,
      }),
    );
  }

  await writeFile(
    join(root, "run.json"),
    stableJson({
      runId,
      preparedAt: new Date().toISOString(),
      repoRoot,
      laneIds,
    }),
  );

  process.stdout.write(`${stableJson({ runId, runRoot: root, laneIds })}`);
}

async function nextCaptureRoot(baseCaptureRoot) {
  const entries = await readdir(baseCaptureRoot).catch(() => []);
  if (!entries.includes("raw.json")) return baseCaptureRoot;
  const attempts = entries
    .map((entry) => /^attempt-(\d+)$/.exec(entry)?.[1])
    .filter(Boolean)
    .map(Number);
  const nextAttempt = Math.max(1, ...attempts) + 1;
  const destination = join(baseCaptureRoot, `attempt-${nextAttempt}`);
  await mkdir(destination, { recursive: true });
  return destination;
}

async function latestCaptureRoot(baseCaptureRoot) {
  const entries = await readdir(baseCaptureRoot).catch(() => []);
  const attempts = entries
    .map((entry) => /^attempt-(\d+)$/.exec(entry)?.[1])
    .filter(Boolean)
    .map(Number);
  if (attempts.length === 0) return baseCaptureRoot;
  return join(baseCaptureRoot, `attempt-${Math.max(...attempts)}`);
}

async function spawnLane(runId, laneId, verifyExisting = false) {
  const lane = lanes[laneId];
  const rootForLane = laneRoot(runId, laneId);
  const inputRoot = join(rootForLane, "input");
  const baseCaptureRoot = join(rootForLane, "capture");
  const captureRoot = await nextCaptureRoot(baseCaptureRoot);
  const schema = JSON.stringify(reportSchema(laneId, lane));
  const promptPath = verifyExisting
    ? join(inputRoot, "VERIFY-PROMPT.md")
    : join(inputRoot, "PROMPT.md");
  if (verifyExisting)
    await writeFile(promptPath, verificationPromptFor(laneId, lane));
  const args = [
    "--cwd",
    inputRoot,
    "--prompt-file",
    promptPath,
    "--verbatim",
    "--model",
    lane.model,
    "--output-format",
    "json",
    "--json-schema",
    schema,
    "--sandbox",
    "strict",
    "--permission-mode",
    "default",
    "--tools",
    "Read,Glob,Grep,StrReplace",
    "--allow",
    "Read",
    "--allow",
    "Glob",
    "--allow",
    "Grep",
    "--allow",
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
    verifyExisting ? "6" : "12",
  ];
  if (lane.effort) args.push("--effort", lane.effort);

  const startedAt = new Date();
  const child = spawn(grokBinary, args, {
    cwd: inputRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdoutChunks = [];
  const stderrChunks = [];
  child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
  child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

  const exitCode = await new Promise((resolveExit, reject) => {
    child.on("error", reject);
    child.on("close", resolveExit);
  });

  const completedAt = new Date();
  await writeFile(join(captureRoot, "raw.json"), Buffer.concat(stdoutChunks));
  await writeFile(join(captureRoot, "stderr.log"), Buffer.concat(stderrChunks));
  await writeFile(
    join(captureRoot, "process.json"),
    stableJson({
      laneId,
      model: lane.model,
      effort: lane.effort ?? null,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      elapsedMs: completedAt.getTime() - startedAt.getTime(),
      exitCode,
    }),
  );

  return {
    laneId,
    exitCode,
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
  };
}

async function run(runId, laneIds, verifyExisting = false) {
  assert(runId, "--run-id is required for run");
  const results = await Promise.all(
    laneIds.map((laneId) => spawnLane(runId, laneId, verifyExisting)),
  );
  process.stdout.write(stableJson({ runId, results }));
  if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
}

function walkTranslationDiff(before, after, path, changes, errors) {
  if (before === null) {
    if (typeof after === "string" && after.trim().length > 0) {
      assert(
        path.includes(".translations."),
        `Unexpected null-to-string change outside translations: ${path}`,
      );
      changes.push({ path, value: after });
      return;
    }
    if (after === null) return;
    errors.push(`${path}: expected null or a non-empty translated string`);
    return;
  }

  if (Array.isArray(before)) {
    if (!Array.isArray(after) || before.length !== after.length) {
      errors.push(`${path}: array shape changed`);
      return;
    }
    before.forEach((value, index) =>
      walkTranslationDiff(
        value,
        after[index],
        `${path}[${index}]`,
        changes,
        errors,
      ),
    );
    return;
  }

  if (before && typeof before === "object") {
    if (!after || typeof after !== "object" || Array.isArray(after)) {
      errors.push(`${path}: object shape changed`);
      return;
    }
    const beforeKeys = Object.keys(before);
    const afterKeys = Object.keys(after);
    if (JSON.stringify(beforeKeys) !== JSON.stringify(afterKeys)) {
      errors.push(`${path}: object keys or key order changed`);
      return;
    }
    for (const key of beforeKeys) {
      walkTranslationDiff(
        before[key],
        after[key],
        path ? `${path}.${key}` : key,
        changes,
        errors,
      );
    }
    return;
  }

  if (before !== after) errors.push(`${path}: immutable value changed`);
}

function setAtPath(target, path, value) {
  const tokens = [...path.matchAll(/(?:^|\.)([^.[\]]+)|\[(\d+)\]/g)].map(
    (match) => match[1] ?? Number(match[2]),
  );
  let cursor = target;
  for (let index = 0; index < tokens.length - 1; index += 1)
    cursor = cursor[tokens[index]];
  cursor[tokens.at(-1)] = value;
}

async function validateLane(runId, laneId, shouldMerge) {
  const lane = lanes[laneId];
  const rootForLane = laneRoot(runId, laneId);
  const captureRoot = await latestCaptureRoot(join(rootForLane, "capture"));
  const rawText = await readFile(join(captureRoot, "raw.json"), "utf8");
  const envelope = JSON.parse(rawText);
  assert(
    (envelope.type ?? "") !== "error",
    `${laneId}: Grok returned an error envelope`,
  );
  assert(
    envelope.stopReason === "EndTurn",
    `${laneId}: unexpected stopReason ${envelope.stopReason}`,
  );
  assert(typeof envelope.text === "string", `${laneId}: missing text response`);
  assert(
    typeof envelope.sessionId === "string",
    `${laneId}: missing sessionId`,
  );
  const report = envelope.structuredOutput ?? JSON.parse(envelope.text);
  assert(
    report && typeof report === "object",
    `${laneId}: missing structured report`,
  );
  assert(report.batchId === laneId, `${laneId}: mismatched report batchId`);

  const laneChanges = [];
  const laneErrors = [];
  for (const file of lane.files) {
    const canonicalPath = join(manualRoot, file);
    const stagedPath = join(rootForLane, "input", file);
    const before = JSON.parse(await readFile(canonicalPath, "utf8"));
    const after = JSON.parse(await readFile(stagedPath, "utf8"));
    const changes = [];
    const errors = [];
    walkTranslationDiff(before, after, "", changes, errors);
    laneChanges.push({ file, changes: changes.length });
    laneErrors.push(...errors.map((error) => `${file}: ${error}`));

    if (shouldMerge && errors.length === 0) {
      for (const change of changes)
        setAtPath(before, change.path, change.value);
      await writeFile(canonicalPath, stableJson(before));
    }
  }

  const actualCells = laneChanges.reduce(
    (total, result) => total + result.changes,
    0,
  );
  if (actualCells !== lane.expectedCells) {
    laneErrors.push(
      `expected ${lane.expectedCells} completed cells, found ${actualCells}`,
    );
  }
  if (report.localeCellsCompleted !== actualCells) {
    laneErrors.push(
      `report says ${report.localeCellsCompleted} cells, staged diff has ${actualCells}`,
    );
  }

  await writeFile(join(captureRoot, "report.json"), stableJson(report));
  await writeFile(
    join(captureRoot, "validation.json"),
    stableJson({
      laneId,
      sessionId: envelope.sessionId,
      requestId: envelope.requestId ?? null,
      usage: envelope.usage ?? null,
      numTurns: envelope.num_turns ?? envelope.numTurns ?? null,
      modelUsage: envelope.modelUsage ?? null,
      actualCells,
      expectedCells: lane.expectedCells,
      files: laneChanges,
      flags: report.flags,
      reworkRisks: report.reworkRisks,
      errors: laneErrors,
      accepted: laneErrors.length === 0,
      merged: shouldMerge && laneErrors.length === 0,
    }),
  );

  return {
    laneId,
    actualCells,
    expectedCells: lane.expectedCells,
    flags: report.flags.length,
    errors: laneErrors,
    accepted: laneErrors.length === 0,
    merged: shouldMerge && laneErrors.length === 0,
  };
}

async function validate(runId, laneIds, shouldMerge) {
  assert(
    runId,
    `--run-id is required for ${shouldMerge ? "merge" : "validate"}`,
  );
  const results = [];
  for (const laneId of laneIds)
    results.push(await validateLane(runId, laneId, shouldMerge));
  process.stdout.write(stableJson({ runId, results }));
  if (results.some((result) => !result.accepted)) process.exitCode = 1;
}

async function listRuns() {
  const entries = await readdir(runRootBase).catch(() => []);
  process.stdout.write(stableJson(entries.sort()));
}

const {
  command,
  runId: providedRunId,
  laneIds,
} = parseArguments(process.argv.slice(2));
const selectedRunId = providedRunId ?? makeRunId();

switch (command) {
  case "prepare":
    await prepare(selectedRunId, laneIds);
    break;
  case "run":
    await run(selectedRunId, laneIds);
    break;
  case "verify-run":
    await run(selectedRunId, laneIds, true);
    break;
  case "validate":
    await validate(selectedRunId, laneIds, false);
    break;
  case "merge":
    await validate(selectedRunId, laneIds, true);
    break;
  case "list":
    await listRuns();
    break;
  default:
    throw new Error(
      "Usage: run-grok-translation-batches.mjs <prepare|run|verify-run|validate|merge|list> [--run-id ID] [--lanes F-C01b,F-C02]",
    );
}
