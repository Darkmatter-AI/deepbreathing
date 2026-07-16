#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contentRoot = join(repoRoot, "src/i18n/content/bespoke/insomnia-4-7-8");
const catalogRoot = join(repoRoot, "src/i18n/catalog");
const sourcePath = join(contentRoot, "source.json");
const replacementsPath = join(contentRoot, "reviewed-replacements.json");
const outputRoot = join(contentRoot, "messages");

export const INSOMNIA_CONTENT_LOCALES = [
  "de-de",
  "es-es",
  "fr-fr",
  "ja-jp",
  "pt-br",
];

const SOURCE_ROUTE = "/4-7-8-breathing-for-insomnia";
const SITE_TITLE = "Deep Breathing Exercises";

const BINDINGS = {
  "breadcrumb.home": {
    route: "/languages",
    occurrenceKey:
      "sel:a.text-muted-foreground.underline-offset-4:ctx:link:pos:0",
  },
  "footer.about": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:3",
  },
  "footer.aboutAbi": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:4",
  },
  "footer.app": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:2",
  },
  "footer.embed": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:5",
  },
  "footer.guides": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:1",
  },
  "footer.safety": {
    occurrenceKey: "sel:p.text-xs.text-muted-foreground:ctx:p:pos:0",
  },
  "footer.techniques": {
    occurrenceKey: "sel:a.underline.underline-offset-2:ctx:link:pos:0",
  },
  "hero.eyebrow": { occurrenceKey: "sel:p.text-xs.uppercase:ctx:p:pos:0" },
  "hero.intro": { occurrenceKey: "sel:p.max-w-xl.text-lg:ctx:p:pos:0" },
  "hero.title": {
    occurrenceKey: "sel:h1.text-4xl.font-semibold:ctx:heading:pos:0",
  },
  "loading.ariaLabel": {
    occurrenceKey: "attr:div.min-h-screen.flex:aria-label:pos:0",
  },
  "metadata.description": { occurrenceKey: "head:meta:name:description" },
  "metadata.socialDescription": {
    occurrenceKey: "head:meta:property:og:description",
  },
  "metadata.socialTitle": { occurrenceKey: "head:meta:property:og:title" },
  "metadata.title": {
    occurrenceKey: "head:title",
    catalogSourceText:
      "4-7-8 Breathing for Insomnia: Fall Asleep in Minutes (Free Timer) | Deep Breathing Exercises",
  },
  "metadata.twitterDescription": {
    occurrenceKey: "head:meta:name:twitter:description",
  },
  "related.cards.anxiety.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:8",
  },
  "related.cards.anxiety.title": {
    occurrenceKey: "sel:p.text-lg.font-semibold:ctx:product:pos:2",
  },
  "related.cards.sleep.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:6",
  },
  "related.cards.sleep.title": {
    occurrenceKey: "sel:p.text-lg.font-semibold:ctx:product:pos:0",
  },
  "related.cards.timer.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:7",
  },
  "related.cards.timer.title": {
    occurrenceKey: "sel:p.text-lg.font-semibold:ctx:product:pos:1",
  },
  "related.learnMore": {
    occurrenceKey: "sel:span.mt-3.inline-flex:ctx:product:pos:0",
  },
  "sections.faq.items.0.answer": {
    occurrenceKey: "sel:p.mt-2.text-sm:ctx:p:pos:1",
  },
  "sections.faq.items.0.question": {
    occurrenceKey: "sel:h3.text-lg.font-semibold:ctx:heading:pos:0",
  },
  "sections.faq.items.1.answer": {
    occurrenceKey: "sel:p.mt-2.text-sm:ctx:p:pos:2",
  },
  "sections.faq.items.1.question": {
    occurrenceKey: "sel:h3.text-lg.font-semibold:ctx:heading:pos:1",
  },
  "sections.faq.items.2.answer": {
    occurrenceKey: "sel:p.mt-2.text-sm:ctx:p:pos:3",
  },
  "sections.faq.items.2.question": {
    occurrenceKey: "sel:h3.text-lg.font-semibold:ctx:heading:pos:2",
  },
  "sections.faq.title": {
    occurrenceKey: "sel:h2.text-2xl.font-semibold:ctx:heading:pos:4",
  },
  "sections.settings.items.cycles.body": {
    occurrenceKey: "sel:li:ctx:li:pos:1",
  },
  "sections.settings.items.cycles.label": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:1",
  },
  "sections.settings.items.pattern.body": {
    occurrenceKey: "sel:li:ctx:li:pos:0",
  },
  "sections.settings.items.pattern.label": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:0",
  },
  "sections.settings.items.position.body": {
    occurrenceKey: "sel:li:ctx:li:pos:2",
  },
  "sections.settings.items.position.label": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:2",
  },
  "sections.settings.items.restless.body": {
    occurrenceKey: "sel:li:ctx:li:pos:3",
  },
  "sections.settings.items.restless.label": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:3",
  },
  "sections.settings.title": {
    occurrenceKey: "sel:h2.text-2xl.font-semibold:ctx:heading:pos:1",
  },
  "sections.start.body": { occurrenceKey: "sel:p.mt-2.text-sm:ctx:p:pos:0" },
  "sections.start.guideLink": {
    occurrenceKey: "sel:a.rounded-full.border:ctx:link:pos:0",
  },
  "sections.start.timerLink": {
    occurrenceKey: "sel:a.rounded-full.bg-primary:ctx:link:pos:0",
  },
  "sections.start.title": {
    occurrenceKey: "sel:h2.text-2xl.font-semibold:ctx:heading:pos:0",
  },
  "sections.steps.items.0.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:0",
  },
  "sections.steps.items.0.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:5",
  },
  "sections.steps.items.1.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:1",
  },
  "sections.steps.items.1.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:6",
  },
  "sections.steps.items.2.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:2",
  },
  "sections.steps.items.2.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:7",
  },
  "sections.steps.items.3.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:3",
  },
  "sections.steps.items.3.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:8",
  },
  "sections.steps.items.4.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:4",
  },
  "sections.steps.items.4.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:9",
  },
  "sections.steps.items.5.body": {
    occurrenceKey: "sel:p.mt-1.text-sm:ctx:p:pos:5",
  },
  "sections.steps.items.5.title": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:10",
  },
  "sections.steps.title": {
    occurrenceKey: "sel:h2.text-2xl.font-semibold:ctx:heading:pos:3",
  },
  "sections.why.paragraph1": { occurrenceKey: "sel:p:ctx:p:pos:0" },
  "sections.why.paragraph2.afterEmphasis": {
    occurrenceKey: "sel:p:ctx:p:pos:2",
  },
  "sections.why.paragraph2.beforeEmphasis": {
    occurrenceKey: "sel:p:ctx:p:pos:1",
  },
  "sections.why.paragraph2.emphasis": {
    occurrenceKey: "sel:strong.text-card-foreground:ctx:product:pos:4",
  },
  "sections.why.paragraph3.afterEmphasis": {
    occurrenceKey: "sel:p:ctx:p:pos:4",
  },
  "sections.why.paragraph3.beforeEmphasis": {
    occurrenceKey: "sel:p:ctx:p:pos:3",
  },
  "sections.why.paragraph3.emphasis": { occurrenceKey: "sel:em:ctx:em:pos:0" },
  "sections.why.title": {
    occurrenceKey: "sel:h2.text-2xl.font-semibold:ctx:heading:pos:2",
  },
  updated: { occurrenceKey: "sel:p.mb-6.text-xs:ctx:p:pos:0" },
};

const DISPLAY_DERIVED = {
  "metadata.imageAlt": "metadata.socialTitle",
};

const SCHEMA_DERIVED = {
  "schema.faq.items.0.question": "sections.faq.items.0.question",
  "schema.faq.items.2.question": "sections.faq.items.2.question",
};

const INVARIANT = new Set(["schema.authorName", "schema.publisherName"]);
const REPLACED = new Set([
  "related.label",
  "schema.articleDescription",
  "schema.faq.items.0.answer",
  "schema.faq.items.1.answer",
  "schema.faq.items.1.question",
  "schema.faq.items.2.answer",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left.localeCompare(right, "en");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function validateTranslation(sourceText, translation, label) {
  assert(
    typeof translation === "string" && translation.trim(),
    `${label} is empty`,
  );
  assert(
    !/<\/?(?:script|style|iframe|object|embed)\b/i.test(translation),
    `${label} contains unsafe markup`,
  );
  assert(
    translation.length <= Math.max(sourceText.length * 8, 240),
    `${label} is unexpectedly long`,
  );
}

function validateCoverage(source, replacements) {
  assert(
    replacements.schemaVersion === 1,
    "Unsupported insomnia replacement schema",
  );
  assert(
    Array.isArray(replacements.replacements),
    "Insomnia replacements must be an array",
  );
  const replacementIds = new Set();
  for (const record of replacements.replacements) {
    assert(
      REPLACED.has(record.messageId),
      `Unexpected insomnia replacement ${record.messageId}`,
    );
    assert(
      !replacementIds.has(record.messageId),
      `Duplicate insomnia replacement ${record.messageId}`,
    );
    replacementIds.add(record.messageId);
    assert(
      record.sourceText === source[record.messageId],
      `${record.messageId} replacement source changed`,
    );
    assert(
      record.reviewedSourceHash === sha256(record.sourceText),
      `${record.messageId} replacement hash changed`,
    );
    assert(
      typeof record.reason === "string" && record.reason.trim(),
      `${record.messageId} replacement lacks a reason`,
    );
    assert(
      JSON.stringify(Object.keys(record.translations).sort(compareText)) ===
        JSON.stringify([...INSOMNIA_CONTENT_LOCALES].sort(compareText)),
      `${record.messageId} replacement must cover every locale`,
    );
  }
  assert(
    JSON.stringify([...replacementIds].sort(compareText)) ===
      JSON.stringify([...REPLACED].sort(compareText)),
    "Every reviewed insomnia replacement must be present",
  );

  const owned = new Set([
    ...Object.keys(BINDINGS),
    ...Object.keys(DISPLAY_DERIVED),
    ...Object.keys(SCHEMA_DERIVED),
    ...INVARIANT,
    ...REPLACED,
  ]);
  assert(
    JSON.stringify([...owned].sort(compareText)) ===
      JSON.stringify(Object.keys(source).sort(compareText)),
    "Insomnia source shape and compiler bindings have drifted",
  );
  for (const [messageId, sourceMessageId] of Object.entries(SCHEMA_DERIVED)) {
    assert(
      source[messageId] === source[sourceMessageId],
      `${messageId} must be byte-identical to ${sourceMessageId} before schema derivation`,
    );
  }
}

function resolvePlacement(catalog, binding, sourceText, label) {
  const candidates = catalog.segments.filter(
    (segment) => segment.occurrenceKey === binding.occurrenceKey,
  );
  assert(
    candidates.length === 1,
    `${label} expected one catalog occurrence, found ${candidates.length}`,
  );
  const segment = candidates[0];
  const expectedCatalogSource = binding.catalogSourceText ?? sourceText;
  assert(
    segment.sourceText === expectedCatalogSource,
    `${label} catalog source drift`,
  );
  assert(
    segment.sourceHash === sha256(expectedCatalogSource.toLowerCase()),
    `${label} catalog source hash drift`,
  );
  assert(
    segment.translation?.isApproved === true,
    `${label} translation is not approved`,
  );
  assert(
    segment.translation?.needsReview === false,
    `${label} translation needs review`,
  );
  validateTranslation(sourceText, segment.translation?.text, label);
  return segment;
}

export async function buildInsomniaContentArtifacts() {
  const [source, replacements] = await Promise.all([
    readJson(sourcePath),
    readJson(replacementsPath),
  ]);
  validateCoverage(source, replacements);
  const replacementById = new Map(
    replacements.replacements.map((record) => [record.messageId, record]),
  );
  const publication = {
    expectedMessages: Object.keys(source).length,
    locales: {},
    routeId: "4-7-8-breathing-for-insomnia",
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const provenance = {
    locales: {},
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
  };
  const unresolved = {
    schemaVersion: 1,
    sourceRoute: SOURCE_ROUTE,
    unresolved: [],
  };
  const outputs = new Map();
  const referenceSignatures = new Map();

  for (const locale of INSOMNIA_CONTENT_LOCALES) {
    const routeCatalog = await readJson(
      join(catalogRoot, locale, "pages", "4-7-8-breathing-for-insomnia.json"),
    );
    const languageCatalog = await readJson(
      join(catalogRoot, locale, "pages", "languages.json"),
    );
    const messages = {};
    const localeProvenance = {};

    for (const [messageId, binding] of Object.entries(BINDINGS)) {
      const catalog =
        binding.route === "/languages" ? languageCatalog : routeCatalog;
      const segment = resolvePlacement(
        catalog,
        binding,
        source[messageId],
        `${messageId}:${locale}`,
      );
      const signature = JSON.stringify({
        catalogSegmentId: segment.catalogSegmentId,
        occurrenceKey: segment.occurrenceKey,
        sourceHash: segment.sourceHash,
        sourceText: segment.sourceText,
      });
      if (!referenceSignatures.has(messageId))
        referenceSignatures.set(messageId, signature);
      assert(
        referenceSignatures.get(messageId) === signature,
        `${messageId}:${locale} placement signature drift`,
      );
      messages[messageId] = segment.translation.text;
      localeProvenance[messageId] = {
        catalogRoute: binding.route ?? SOURCE_ROUTE,
        catalogSegmentId: segment.catalogSegmentId,
        occurrenceKey: segment.occurrenceKey,
        sourceHash: sha256(source[messageId]),
        status: binding.catalogSourceText
          ? "route-catalog-rendered-source"
          : "route-catalog-explicit",
      };
    }

    for (const messageId of REPLACED) {
      const record = replacementById.get(messageId);
      const translation = record.translations[locale];
      validateTranslation(
        record.sourceText,
        translation,
        `${messageId}:${locale}`,
      );
      messages[messageId] = translation;
      localeProvenance[messageId] = {
        reason: record.reason,
        sourceHash: record.reviewedSourceHash,
        status: "repo-reviewed-source-alias",
      };
    }

    for (const messageId of INVARIANT) {
      messages[messageId] = source[messageId];
      localeProvenance[messageId] = {
        sourceHash: sha256(source[messageId]),
        status: "schema-proper-name-invariant",
      };
    }

    for (const [messageId, sourceMessageId] of Object.entries(
      DISPLAY_DERIVED,
    )) {
      assert(
        typeof messages[sourceMessageId] === "string",
        `${messageId}:${locale} missing derived source ${sourceMessageId}`,
      );
      messages[messageId] = messages[sourceMessageId];
      localeProvenance[messageId] = {
        derivedFrom: sourceMessageId,
        sourceHash: sha256(source[messageId]),
        status: "display-derived-from-explicit-page-binding",
      };
    }

    for (const [messageId, sourceMessageId] of Object.entries(SCHEMA_DERIVED)) {
      assert(
        typeof messages[sourceMessageId] === "string",
        `${messageId}:${locale} missing derived source ${sourceMessageId}`,
      );
      messages[messageId] = messages[sourceMessageId];
      localeProvenance[messageId] = {
        derivedFrom: sourceMessageId,
        sourceHash: sha256(source[messageId]),
        status: "schema-byte-identical-page-binding",
      };
    }

    const resolvedMessages = Object.keys(messages).length;
    const serialized = stableJson(messages);
    const relativePath = `messages/${locale}.json`;
    outputs.set(relativePath, serialized);
    publication.locales[locale] = {
      bytes: Buffer.byteLength(serialized),
      path: relativePath,
      publishable: resolvedMessages === Object.keys(source).length,
      resolvedMessages,
      sha256:
        resolvedMessages === Object.keys(source).length
          ? sha256(serialized)
          : null,
    };
    provenance.locales[locale] = localeProvenance;
  }

  outputs.set("publication.json", stableJson(publication));
  outputs.set("provenance.json", stableJson(provenance));
  outputs.set("unresolved.json", stableJson(unresolved));
  return { outputs, publication, provenance, unresolved };
}

export async function writeInsomniaContentArtifacts() {
  const build = await buildInsomniaContentArtifacts();
  assert(
    outputRoot === join(contentRoot, "messages"),
    "Refusing unsafe insomnia output path",
  );
  await rm(outputRoot, { force: true, recursive: true });
  for (const [relativePath, content] of build.outputs) {
    const outputPath = join(contentRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
  return {
    unresolved: build.unresolved.unresolved.length,
    written: build.outputs.size,
  };
}

export async function checkInsomniaContentArtifacts() {
  const build = await buildInsomniaContentArtifacts();
  const stale = [];
  for (const [relativePath, expected] of build.outputs) {
    let actual = null;
    try {
      actual = await readFile(join(contentRoot, relativePath), "utf8");
    } catch {
      // Missing artifacts are reported through the same deterministic check.
    }
    if (actual !== expected) stale.push(relativePath);
  }
  return { checked: build.outputs.size, stale };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--check")) {
    const result = await checkInsomniaContentArtifacts();
    assert(
      result.stale.length === 0,
      `Stale insomnia content artifacts: ${result.stale.join(", ")}`,
    );
    console.log(JSON.stringify({ ...result, mode: "check" }));
  } else {
    console.log(
      JSON.stringify({
        ...(await writeInsomniaContentArtifacts()),
        mode: "write",
      }),
    );
  }
}
