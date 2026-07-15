import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGrokArguments,
  outputSchema,
  promptFor,
  validateReturnedContract,
} from "../i18n/remaining-pages/run-grok-output-translations.mjs";

const locales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const contract = {
  schemaVersion: 1,
  sourceRoute: "/example",
  entries: [
    {
      messageId: "catalog-placement.00000000-0000-0000-0000-000000000000",
      reason: "Missing approved catalog translation for example",
      reviewedSourceHash:
        "14f0efd062f5bd8a2cdd3a708bfcc7b6201ebde39572fb5e254154f01b88b14f",
      scope: "content",
      sourceText: "Practice for 60 seconds.",
      translations: {
        "de-de": null,
        "es-es": "Practica durante 60 segundos.",
        "fr-fr": "Pratiquez pendant 60 secondes.",
        "ja-jp": "60秒間練習します。",
        "pt-br": "Pratique por 60 segundos.",
      },
    },
  ],
};

function completedContract() {
  const completed = structuredClone(contract);
  completed.entries[0].translations["de-de"] = "Üben Sie 60 Sekunden lang.";
  return completed;
}

test("schema and prompt constrain output to the complete null-only contract", () => {
  const schema = outputSchema(contract, locales);
  assert.deepEqual(
    schema.properties.entries.items.properties.translations.required,
    locales,
  );
  assert.equal(schema.properties.entries.minItems, 1);
  assert.equal(schema.properties.entries.maxItems, 1);

  const prompt = promptFor(contract);
  assert.match(prompt, /Exactly 1 null value must become/);
  assert.match(prompt, /Change only values that are currently null/);
  assert.match(prompt, /Do not edit files and do not call tools/);
});

test("validator accepts only safe null-to-string changes", () => {
  const valid = validateReturnedContract(contract, completedContract(), 1);
  assert.equal(valid.accepted, true);
  assert.equal(valid.actualCells, 1);
  assert.equal(
    valid.merged.entries[0].translations["de-de"],
    "Üben Sie 60 Sekunden lang.",
  );

  const changedExisting = completedContract();
  changedExisting.entries[0].translations["es-es"] =
    "Practica durante un minuto.";
  const immutableFailure = validateReturnedContract(
    contract,
    changedExisting,
    1,
  );
  assert.equal(immutableFailure.accepted, false);
  assert.match(immutableFailure.errors.join("\n"), /existing translation/);

  const unsafe = completedContract();
  unsafe.entries[0].translations["de-de"] = "Üben Sie eine Weile.";
  const safetyFailure = validateReturnedContract(contract, unsafe, 1);
  assert.equal(safetyFailure.accepted, false);
  assert.match(safetyFailure.errors.join("\n"), /numeric/i);
});

test("Grok invocation is one-turn, output-only, tool-free, and web-free", () => {
  const args = buildGrokArguments({
    cwd: "/tmp/example",
    promptPath: "/tmp/example/PROMPT.md",
    model: "grok-composer-2.5-fast",
    schema: outputSchema(contract, locales),
  });
  const joined = args.join(" ");

  assert.match(joined, /--sandbox strict/);
  assert.match(joined, /--tools\s+--deny Read/);
  assert.match(joined, /--no-plan/);
  assert.match(joined, /--no-subagents/);
  assert.match(joined, /--no-memory/);
  assert.match(joined, /--disable-web-search/);
  assert.match(joined, /--max-turns 1/);
  for (const denied of [
    "Read",
    "Glob",
    "Grep",
    "StrReplace",
    "Bash",
    "Shell",
    "MCPTool",
    "CallMcpTool",
    "WebFetch",
    "WebSearch",
  ]) {
    assert.ok(args.includes(denied), `missing deny rule: ${denied}`);
  }
});
