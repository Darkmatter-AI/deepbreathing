#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const proposalPath = join(
  repoRoot,
  "docs/native-i18n/work/for-reviewed-replacements.proposed.json",
);
const outputRoot = join(
  repoRoot,
  "src/i18n/content/use-cases/reviewed-replacements",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function buildOutputs() {
  const proposal = JSON.parse(await readFile(proposalPath, "utf8"));
  assert(
    proposal.schemaVersion === 1,
    "Unsupported replacement proposal schema",
  );
  assert(
    proposal.status === "proposed-read-only-audit",
    "Unexpected replacement proposal status",
  );
  assert(
    Array.isArray(proposal.replacements),
    "Replacement proposal has no replacements",
  );

  const byRoute = new Map();
  const seen = new Set();
  for (const replacement of proposal.replacements) {
    assert(
      /^\/for\/[a-z0-9-]+$/.test(replacement.route),
      `Unsupported route: ${replacement.route}`,
    );
    assert(
      replacement.route !== "/for/anxiety",
      "Anxiety proof replacements must stay isolated",
    );
    for (const field of [
      "sourcePath",
      "source",
      "locale",
      "current",
      "replacement",
      "reason",
    ]) {
      assert(
        typeof replacement[field] === "string" && replacement[field].trim(),
        `${replacement.route} replacement has no ${field}`,
      );
    }
    const key = `${replacement.route}:${replacement.sourcePath}:${replacement.locale}`;
    assert(!seen.has(key), `Duplicate replacement: ${key}`);
    seen.add(key);
    const record = {
      currentCatalogValue: replacement.current,
      locale: replacement.locale,
      reason: replacement.reason,
      replacement: replacement.replacement,
      reviewedSourceHash: sha256(replacement.source),
      sourcePath: replacement.sourcePath,
      sourceText: replacement.source,
    };
    if (replacement.numericReviewReason)
      record.numericReviewReason = replacement.numericReviewReason;
    const routeRecords = byRoute.get(replacement.route) ?? [];
    routeRecords.push(record);
    byRoute.set(replacement.route, routeRecords);
  }

  return new Map(
    [...byRoute].map(([sourceRoute, replacements]) => [
      `${sourceRoute.slice("/for/".length)}.json`,
      stableJson({ replacements, schemaVersion: 1, sourceRoute }),
    ]),
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  assert(
    [...args].every((argument) => argument === "--check"),
    "Usage: import-for-reviewed-replacements.mjs [--check]",
  );
  const outputs = await buildOutputs();
  await mkdir(outputRoot, { recursive: true });

  if (args.has("--check")) {
    const actualFiles = (await readdir(outputRoot))
      .filter((file) => file.endsWith(".json"))
      .sort();
    const expectedFiles = [...outputs.keys()].sort();
    assert(
      JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
      "Reviewed replacement file set is stale",
    );
    for (const [file, expected] of outputs) {
      assert(
        (await readFile(join(outputRoot, file), "utf8")) === expected,
        `${file} reviewed replacements are stale`,
      );
    }
  } else {
    for (const [file, contents] of outputs)
      await writeFile(join(outputRoot, file), contents);
  }

  process.stdout.write(
    `${JSON.stringify({ files: outputs.size, replacements: [...outputs.values()].reduce((total, value) => total + JSON.parse(value).replacements.length, 0) })}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
