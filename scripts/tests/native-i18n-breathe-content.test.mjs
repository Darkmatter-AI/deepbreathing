import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  assertBreatheManifestAlignment,
  assertManualSourceBinding,
  mergeManualEntries,
  validateBreatheTranslationSafety,
} from "../i18n/structured-breathe/compile-breathe-content.mjs";
import { containsUsCrisisNumber } from "../i18n/verify-native-preview-build.mjs";

const repoRoot = process.cwd();
const root = path.join(repoRoot, "src/i18n/content/breathe");
const locales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const slugs = [
  "4-7-8", "9d-breathwork", "belly", "box", "breath-of-fire", "buteyko", "coherent",
  "hope-cartel-9d-breathwork", "nadi-shodhana", "physiological-sigh", "pursed-lip", "tummo",
  "ujjayi", "wim-hof",
];
const headOccurrences = {
  title: "head:title",
  description: "head:meta:name:description",
  ogTitle: "head:meta:property:og:title",
  ogDescription: "head:meta:property:og:description",
  twitterTitle: "head:meta:name:twitter:title",
  twitterDescription: "head:meta:name:twitter:description",
};

function json(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function countNulls(value) {
  if (value === null) return 1;
  if (Array.isArray(value)) return value.reduce((sum, child) => sum + countNulls(child), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((sum, child) => sum + countNulls(child), 0);
  return 0;
}

test("structured breathe compiler artifacts are current", () => {
  execFileSync(process.execPath, ["scripts/i18n/structured-breathe/compile-breathe-content.mjs", "--check"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
});

test("manual and replacement safety validation preserves structure and reviewed tokens", () => {
  assert.doesNotThrow(() => validateBreatheTranslationSafety(
    'Hello {name}. Hold for 4 seconds → 8% CO₂. [Read](https://example.com). <a href="/more"><strong>Now</strong></a> %s',
    'Olá {name}. Segure por 4 segundos → 8% CO₂. [Leia](https://example.com). <a href="/more"><strong>Agora</strong></a> %s',
  ));
  assert.throws(
    () => validateBreatheTranslationSafety("Hello {name}", "Olá {person}"),
    /placeholders/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety("[Read](https://example.com)", "[Leia](https://invalid.example)"),
    /Markdown/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety('<a href="/safe"><strong>Read</strong></a>', '<a href="/other"><em>Leia</em></a>'),
    /HTML tag structure|HTML link/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety("Plain text", '<script src="/unsafe.js"></script>'),
    /HTML tag structure|unsafe/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety('<a href="/safe">Read</a>', '<a href="/safe" onclick="alert(1)">Leia</a>'),
    /event handler/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety("Inhale → exhale", "Inspire e expire"),
    /protected symbols/,
  );
  assert.throws(
    () => validateBreatheTranslationSafety("Hold for 4 seconds", "Segure por quatro segundos"),
    /numeric values without an explicit numeric review reason/,
  );
  assert.doesNotThrow(() => validateBreatheTranslationSafety(
    "Hold for 4 seconds",
    "Segure por quatro segundos",
    "translation",
    { numericReviewReason: "The locale review intentionally spells out the count." },
  ));
});

test("manual values stay pinned to their reviewed English source", () => {
  const record = {
    reviewedSourceHash: sha256("Current source"),
    sourceText: "Current source",
  };
  assert.doesNotThrow(() => assertManualSourceBinding(record, "Current source"));
  assert.throws(
    () => assertManualSourceBinding(record, "Changed source"),
    /source changed/,
  );
});

test("manual scaffolding preserves completed translations", () => {
  const completed = {
    messageId: "body[0].content",
    reason: "reviewed gap",
    reviewedSourceHash: sha256("Source"),
    scope: "content",
    sourceText: "Source",
    translations: { "de-de": "Übersetzung" },
  };
  assert.deepEqual(mergeManualEntries([completed], [], "box"), [completed]);

  const scaffold = {
    ...completed,
    translations: { "es-es": null },
  };
  assert.deepEqual(
    mergeManualEntries([completed], [scaffold], "box")[0].translations,
    { "de-de": "Übersetzung", "es-es": null },
  );
});

test("structured breathe routes align to their actual manifest records", () => {
  const manifest = readFileSync(path.join(repoRoot, "src/i18n/route-manifest.ts"), "utf8");
  assert.doesNotThrow(() => assertBreatheManifestAlignment(manifest, slugs));
  assert.throws(
    () => assertBreatheManifestAlignment(`
      defineRoute({
        id: "breathe-belly",
        path: "/breathe/box",
        kind: "structured-breathing",
        translatedStatus: "preview",
      });
    `, ["box"]),
    /native manifest id/,
  );
});

test("preview verification does not treat the Tummo year 988 as crisis copy", () => {
  assert.equal(
    containsUsCrisisNumber("breathe/tummo", "Tilopa lived from 988–1069."),
    false,
  );
  assert.equal(
    containsUsCrisisNumber("for/anxiety", "In the United States, call or text 988 for crisis support."),
    true,
  );
});

test("publication covers every structured breathe route with manifest route ids", () => {
  const publication = json(path.join(root, "publication.json"));
  assert.deepEqual(publication.locales, locales);
  assert.equal(Object.keys(publication.routes).length, 14);
  for (const slug of slugs) {
    const route = publication.routes[`/breathe/${slug}`];
    assert.ok(route);
    assert.equal(route.routeId, slug === "buteyko" ? "breathe.buteyko" : `breathe-${slug}`);
    assert.deepEqual(Object.keys(route.locales).sort(), [...locales].sort());
  }
});

test("generated loader is server-only and contains literal active-locale imports", () => {
  const loader = readFileSync(path.join(root, "server/load-breathe-content.ts"), "utf8");
  assert.ok(loader.startsWith('import "server-only";'));
  assert.match(loader, /export async function loadBreatheContent/);
  assert.match(loader, /export async function loadBreatheChrome/);
  assert.match(loader, /export async function loadBreatheRoute/);
  assert.equal((loader.match(/import\("\.\.\/routes\//g) ?? []).length, 70);
  assert.equal((loader.match(/import\("\.\.\/chrome\//g) ?? []).length, 70);
});

test("the normal build fails closed when breathe artifacts are stale", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );

  assert.match(
    packageJson.scripts?.prebuild ?? "",
    /check:native-i18n-breathe-index/,
  );
  assert.match(
    packageJson.scripts?.prebuild ?? "",
    /check:native-i18n-breathe-pages/,
  );
});

test("metadata uses catalog head occurrences unless explicitly replaced", () => {
  for (const slug of slugs) {
    const replacementFile = path.join(root, "reviewed-replacements", `${slug}.json`);
    const replacements = readdirSync(path.dirname(replacementFile)).includes(`${slug}.json`)
      ? json(replacementFile).replacements
      : [];
    const manual = json(path.join(root, "manual", `${slug}.json`)).entries;
    for (const locale of locales) {
      const content = json(path.join(root, "routes", locale, `${slug}.json`));
      const catalog = json(path.join(repoRoot, "src/i18n/catalog", locale, "pages/breathe", `${slug}.json`));
      for (const [field, occurrenceKey] of Object.entries(headOccurrences)) {
        const replacement = replacements.find((entry) => entry.locale === locale && entry.sourcePath === `meta.${field}`);
        const manualRecord = manual.find(
          (entry) => entry.scope === "content" && entry.messageId === `meta.${field}`,
        );
        const head = catalog.segments.find((segment) => segment.occurrenceKey === occurrenceKey);
        assert.ok(head?.translation?.text, `${locale}:${slug}:${field} lacks head evidence`);
        assert.equal(
          content.meta[field],
          replacement?.replacement ?? manualRecord?.translations?.[locale] ?? head.translation.text,
          `${locale}:${slug}:${field}`,
        );
      }
    }
  }
});

test("manual inputs are deduplicated and contain only unresolved locale slots", () => {
  const seen = new Set();
  for (const file of readdirSync(path.join(root, "manual")).filter((file) => file.endsWith(".json"))) {
    const input = json(path.join(root, "manual", file));
    for (const entry of input.entries) {
      const key = `${file}:${entry.scope}:${entry.messageId}`;
      assert.ok(!seen.has(key), `duplicate manual entry ${key}`);
      seen.add(key);
      assert.ok(Object.values(entry.translations).every((value) => value === null || (typeof value === "string" && value.trim())));
    }
  }
  const shared = json(path.join(root, "manual/_shared.json"));
  assert.ok(shared.entries.every((entry) => ![
    "chrome.shared.breadcrumb-home",
    "chrome.pattern.breadcrumb-techniques",
    "chrome.pattern.supplies",
  ].includes(entry.messageId)));
});

test("publication unresolved counts equal emitted null values", () => {
  const publication = json(path.join(root, "publication.json"));
  for (const slug of slugs) {
    for (const locale of locales) {
      const content = json(path.join(root, "routes", locale, `${slug}.json`));
      const chrome = json(path.join(root, "chrome", locale, `${slug}.json`));
      assert.equal(
        countNulls(content) + countNulls(chrome),
        publication.routes[`/breathe/${slug}`].locales[locale].unresolved,
        `${locale}:${slug}`,
      );
    }
  }
});

test("Buteyko preserves proof content outside head metadata and reviewed replacements", () => {
  for (const locale of locales) {
    const content = json(path.join(root, "routes", locale, "buteyko.json"));
    const proof = json(path.join(root, "../proof/routes", locale, "breathe-buteyko.json"));
    assert.equal(content.hero.intro, proof.hero.intro);
    assert.equal(content.body[0].content, proof.body[0].content);
    assert.equal(content.faqs[0].answer, proof.faqs[0].answer);
  }
});

test("normalized, global, and reviewed replacement provenance remain explicit", () => {
  let normalized = 0;
  let global = 0;
  let replacements = 0;
  for (const slug of slugs) {
    const provenance = json(path.join(root, "provenance", `${slug}.json`));
    for (const locale of locales) {
      for (const record of Object.values(provenance.locales[locale].content)) {
        if (record.status.includes("normalized")) normalized += 1;
        if (record.status.startsWith("global-")) global += 1;
        if (record.status === "repo-reviewed-replacement") replacements += 1;
      }
    }
  }
  assert.ok(normalized > 0);
  assert.ok(global > 0);
  assert.equal(replacements, 50);
});
