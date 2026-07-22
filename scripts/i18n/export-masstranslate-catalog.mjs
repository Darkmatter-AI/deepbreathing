#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;

export const CATALOG_SCHEMA_VERSION = 1;
export const DEFAULT_TENANT_ID = "deepbreathingexercises_com_ac8ae5";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultOutDir = join(repoRoot, "src/i18n/catalog");
const allowedOutDirParent = join(repoRoot, "src/i18n");
const catalogReadmePath = join(repoRoot, "scripts/i18n/catalog-README.md");

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function parseArgs(argv) {
  const options = {
    tenantId: DEFAULT_TENANT_ID,
    outDir: defaultOutDir,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--tenant-id") {
      options.tenantId = argv[++index];
    } else if (arg === "--out-dir") {
      options.outDir = resolve(argv[++index]);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.tenantId) throw new Error("--tenant-id must not be empty");
  if (!options.outDir) throw new Error("--out-dir must not be empty");
  return options;
}

function usage() {
  return `Usage: node scripts/i18n/export-masstranslate-catalog.mjs [options]

Required environment:
  MASS_TRANSLATE_DATABASE_URL  Read-capable MassTranslate PostgreSQL URL
                               (DATABASE_URL is accepted as a fallback)

Options:
  --tenant-id ID  Tenant to export (default: ${DEFAULT_TENANT_ID})
  --out-dir PATH  Artifact directory (default: src/i18n/catalog)
  -h, --help      Show this help
`;
}

export function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareText)
        .map((key) => [key, sortJsonValue(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(sortJsonValue(value))}\n`;
}

function prettyJson(value) {
  return `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function assertSafeCatalogOutDir(outDir) {
  if (typeof outDir !== "string" || outDir.trim() === "") {
    throw new Error("Catalog output directory must be a non-empty path");
  }

  const candidate = resolve(outDir);
  const name = basename(candidate);
  const isDirectCatalogArtifact = dirname(candidate) === allowedOutDirParent
    && /^catalog(?:[-_.][A-Za-z0-9]+)*$/.test(name);

  if (!isDirectCatalogArtifact) {
    throw new Error(
      `Refusing destructive catalog export outside ${allowedOutDirParent}/catalog*`,
    );
  }

  return candidate;
}

export function routeArtifactPath(locale, canonicalUrl) {
  const parsed = new URL(canonicalUrl, "https://catalog.invalid");
  const routeParts = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(decodeURIComponent(part)));
  const querySuffix = parsed.search
    ? `__query-${sha256(parsed.search).slice(0, 12)}`
    : "";

  if (routeParts.length === 0) {
    return `${locale}/pages/_root${querySuffix}.json`;
  }

  const fileStem = routeParts.pop();
  return [locale, "pages", ...routeParts, `${fileStem}${querySuffix}.json`].join("/");
}

function iso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function translationPayload(row) {
  return {
    catalogTranslationId: row.id,
    text: row.translated_text,
    method: row.translation_method,
    provider: row.translation_provider,
    isApproved: Boolean(row.is_approved),
    needsReview: Boolean(row.needs_review),
    qaChecks: row.qa_checks,
    appliedRules: row.applied_rules,
    appliedGlossaryTerms: row.applied_glossary_terms,
    pipelineVersion: row.pipeline_version,
    rulesUpdatedAt: iso(row.rules_updated_at),
    glossaryUpdatedAt: iso(row.glossary_updated_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function sourcePayload(row) {
  return {
    catalogSegmentId: row.segment_id,
    sourceHash: row.text_hash,
    sourceText: row.source_text,
    sourceLocale: row.source_lang,
    segmentType: row.segment_type,
    isUi: Boolean(row.is_ui),
  };
}

function translationIntegrityRecord({ locale, contextKey, source, translation }) {
  return {
    locale,
    contextKey,
    sourceHash: source.sourceHash,
    sourceText: source.sourceText,
    translation,
  };
}

async function querySnapshot(client, tenantId) {
  const tenantResult = await client.query(
    `SELECT id, name, origin, languages, default_lang, translation_mode, state
       FROM tenants
      WHERE id = $1`,
    [tenantId],
  );
  if (tenantResult.rowCount !== 1) {
    throw new Error(`MassTranslate tenant not found: ${tenantId}`);
  }

  const pagesResult = await client.query(
    `SELECT id, canonical_url, page_type, title, description, lang,
            total_segments, content_hash, fingerprint_version,
            crawl_status, last_crawled_at, updated_at
       FROM catalog_pages
      WHERE tenant_id = $1
      ORDER BY canonical_url, id`,
    [tenantId],
  );

  const placementsResult = await client.query(
    `SELECT cps.id AS page_segment_id, cps.page_id, cps.segment_id,
            cps.occurrence_key, cps.context_key, cps.context_key_version,
            cps.element_selector, cps.attribute_name, cps.position, cps.field_key,
            cps.manual_override, cps.is_manually_overridden, cps.overridden_at,
            cs.text_hash, cs.source_text, cs.source_lang, cs.segment_type, cs.is_ui
       FROM catalog_page_segments cps
       JOIN catalog_pages cp ON cp.id = cps.page_id
       JOIN catalog_segments cs ON cs.id = cps.segment_id
      WHERE cp.tenant_id = $1
        AND cs.tenant_id = $1
      ORDER BY cp.canonical_url,
               cps.position NULLS LAST,
               cps.occurrence_key,
               cps.id`,
    [tenantId],
  );

  const translationsResult = await client.query(
    `SELECT ct.id, ct.segment_id, ct.target_lang, ct.translated_text,
            ct.context_key, ct.translation_method, ct.translation_provider,
            ct.applied_rules, ct.applied_glossary_terms, ct.pipeline_version,
            ct.rules_updated_at, ct.glossary_updated_at,
            ct.is_approved, ct.needs_review, ct.qa_checks,
            ct.created_at, ct.updated_at,
            cs.text_hash, cs.source_text, cs.source_lang,
            cs.segment_type, cs.is_ui
       FROM catalog_translations ct
       JOIN catalog_segments cs ON cs.id = ct.segment_id
      WHERE ct.tenant_id = $1
        AND cs.tenant_id = $1
      ORDER BY ct.target_lang, ct.segment_id, ct.context_key, ct.id`,
    [tenantId],
  );

  const sourceCountsResult = await client.query(
    `SELECT
       count(*)::integer AS source_segments,
       count(*) FILTER (
         WHERE NOT EXISTS (
           SELECT 1
             FROM catalog_page_segments cps
             JOIN catalog_pages cp ON cp.id = cps.page_id
            WHERE cp.tenant_id = $1
              AND cps.segment_id = cs.id
         )
       )::integer AS unplaced_source_segments,
       count(*) FILTER (
         WHERE NOT EXISTS (
           SELECT 1
             FROM catalog_page_segments cps
             JOIN catalog_pages cp ON cp.id = cps.page_id
            WHERE cp.tenant_id = $1
              AND cps.segment_id = cs.id
         )
         AND NOT EXISTS (
           SELECT 1
             FROM catalog_translations ct
            WHERE ct.tenant_id = $1
              AND ct.segment_id = cs.id
         )
       )::integer AS unplaced_untranslated_source_segments
       FROM catalog_segments cs
      WHERE cs.tenant_id = $1`,
    [tenantId],
  );

  return {
    tenant: tenantResult.rows[0],
    pages: pagesResult.rows,
    placements: placementsResult.rows,
    translations: translationsResult.rows,
    sourceCounts: sourceCountsResult.rows[0],
  };
}

async function writeArtifact(root, relativePath, value) {
  const absolutePath = join(root, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  const content = stableJson(value);
  await writeFile(absolutePath, content, "utf8");
  return {
    path: relativePath,
    bytes: Buffer.byteLength(content),
    sha256: sha256(content),
  };
}

export async function exportCatalog({ connectionString, tenantId, outDir }) {
  const finalOutDir = assertSafeCatalogOutDir(outDir);
  const client = new Client({ connectionString });
  await client.connect();

  let snapshot;
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    snapshot = await querySnapshot(client, tenantId);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }

  const tenantLocales = Array.isArray(snapshot.tenant.languages)
    ? snapshot.tenant.languages.map((locale) => String(locale).toLowerCase())
    : [];
  const translationLocales = snapshot.translations.map((row) => row.target_lang.toLowerCase());
  const locales = [...new Set([...tenantLocales, ...translationLocales])].sort();

  const pageById = new Map(snapshot.pages.map((page) => [page.id, page]));
  const placementsByPage = new Map(snapshot.pages.map((page) => [page.id, []]));
  for (const placement of snapshot.placements) {
    placementsByPage.get(placement.page_id)?.push(placement);
  }

  const translationByKey = new Map();
  for (const translation of snapshot.translations) {
    const key = [translation.segment_id, translation.context_key, translation.target_lang].join("\u0000");
    if (translationByKey.has(key)) {
      throw new Error(`Duplicate catalog translation key: ${key}`);
    }
    translationByKey.set(key, translation);
  }

  const usedTranslationIds = new Set();
  const uniqueTranslationRecords = new Map();
  const files = [];
  const routes = [];
  const localeCounts = Object.fromEntries(
    locales.map((locale) => [locale, { routeFiles: 0, placements: 0, translatedPlacements: 0, missingPlacements: 0, uniqueTranslations: 0, orphanTranslations: 0 }]),
  );

  const tempRoot = await mkdtemp(join(tmpdir(), "dbe-i18n-catalog-"));
  try {
    for (const page of snapshot.pages) {
      const routeEntry = {
        route: page.canonical_url,
        catalogPageId: page.id,
        files: {},
        coverage: {},
      };
      const pagePlacements = placementsByPage.get(page.id) ?? [];

      for (const locale of locales) {
        const segments = pagePlacements.map((placement) => {
          const key = [placement.segment_id, placement.context_key, locale].join("\u0000");
          const translationRow = translationByKey.get(key) ?? null;
          const translation = translationRow ? translationPayload(translationRow) : null;
          const source = sourcePayload(placement);
          const overrideMap = placement.manual_override && typeof placement.manual_override === "object"
            ? placement.manual_override
            : {};
          const overrideText = typeof overrideMap[locale] === "string" && overrideMap[locale].trim()
            ? overrideMap[locale]
            : null;

          localeCounts[locale].placements += 1;
          if (translationRow) {
            localeCounts[locale].translatedPlacements += 1;
            usedTranslationIds.add(translationRow.id);
            uniqueTranslationRecords.set(
              translationRow.id,
              translationIntegrityRecord({ locale, contextKey: placement.context_key, source, translation }),
            );
          } else {
            localeCounts[locale].missingPlacements += 1;
          }

          return {
            ...source,
            pageSegmentId: placement.page_segment_id,
            occurrenceKey: placement.occurrence_key,
            contextKey: placement.context_key,
            contextKeyVersion: placement.context_key_version,
            elementSelector: placement.element_selector,
            attributeName: placement.attribute_name,
            fieldKey: placement.field_key,
            position: placement.position,
            translation,
            manualOverride: {
              text: overrideText,
              translations: overrideMap,
              isManuallyOverridden: Boolean(placement.is_manually_overridden),
              overriddenAt: iso(placement.overridden_at),
            },
          };
        });

        const relativePath = routeArtifactPath(locale, page.canonical_url);
        const translatedSegments = segments.filter((segment) => segment.translation).length;
        const manualOverrideSegments = segments.filter(
          (segment) => segment.manualOverride.text !== null,
        ).length;
        const file = await writeArtifact(tempRoot, relativePath, {
          schemaVersion: CATALOG_SCHEMA_VERSION,
          locale,
          route: page.canonical_url,
          page: {
            catalogPageId: page.id,
            pageType: page.page_type,
            sourceLocale: page.lang,
            sourceTitle: page.title,
            sourceDescription: page.description,
            sourceContentHash: page.content_hash,
            fingerprintVersion: page.fingerprint_version,
            crawlStatus: page.crawl_status,
            lastCrawledAt: iso(page.last_crawled_at),
            updatedAt: iso(page.updated_at),
          },
          segments,
        });
        files.push({
          ...file,
          type: "route",
          locale,
          route: page.canonical_url,
          segments: segments.length,
          translatedSegments,
          missingSegments: segments.length - translatedSegments,
          manualOverrideSegments,
        });
        routeEntry.files[locale] = relativePath;
        routeEntry.coverage[locale] = {
          placements: segments.length,
          translated: translatedSegments,
          missing: segments.length - translatedSegments,
          manualOverrides: manualOverrideSegments,
        };
        localeCounts[locale].routeFiles += 1;
      }

      routes.push(routeEntry);
    }

    for (const locale of locales) {
      const orphanRecords = snapshot.translations
        .filter((row) => row.target_lang === locale && !usedTranslationIds.has(row.id))
        .map((row) => {
          const source = sourcePayload(row);
          const translation = translationPayload(row);
          uniqueTranslationRecords.set(
            row.id,
            translationIntegrityRecord({ locale, contextKey: row.context_key, source, translation }),
          );
          return {
            ...source,
            contextKey: row.context_key,
            translation,
          };
        });

      localeCounts[locale].orphanTranslations = orphanRecords.length;
      const relativePath = `${locale}/_orphaned-translations.json`;
      const file = await writeArtifact(tempRoot, relativePath, {
        schemaVersion: CATALOG_SCHEMA_VERSION,
        locale,
        reason: "Translation has no matching segment/context placement on a current catalog page.",
        records: orphanRecords,
      });
      files.push({ ...file, type: "orphaned", locale, records: orphanRecords.length });
    }

    for (const locale of locales) {
      localeCounts[locale].uniqueTranslations = snapshot.translations.filter(
        (row) => row.target_lang === locale,
      ).length;
    }

    const uniqueRecords = [...uniqueTranslationRecords.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([id, record]) => ({ id, ...record }));
    if (uniqueRecords.length !== snapshot.translations.length) {
      throw new Error(
        `Translation preservation mismatch: exported ${uniqueRecords.length}, source has ${snapshot.translations.length}`,
      );
    }

    const latestTimestamp = [
      ...snapshot.pages.flatMap((page) => [page.updated_at, page.last_crawled_at]),
      ...snapshot.translations.flatMap((row) => [row.updated_at, row.created_at]),
    ]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .sort((left, right) => right - left)[0];

    files.sort((left, right) => compareText(left.path, right.path));
    routes.sort((left, right) => compareText(left.route, right.route));

    const manifest = {
      schemaVersion: CATALOG_SCHEMA_VERSION,
      source: {
        system: "MassTranslate production catalog",
        tenantId: snapshot.tenant.id,
        tenantName: snapshot.tenant.name,
        origin: snapshot.tenant.origin,
        sourceLocale: snapshot.tenant.default_lang,
        locales,
        translationMode: snapshot.tenant.translation_mode,
        state: snapshot.tenant.state,
        snapshotUpdatedThrough: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
      },
      counts: {
        pages: snapshot.pages.length,
        sourceSegments: snapshot.sourceCounts.source_segments,
        currentPlacements: snapshot.placements.length,
        translationRecords: snapshot.translations.length,
        approvedTranslationRecords: snapshot.translations.filter((row) => row.is_approved).length,
        draftTranslationRecords: snapshot.translations.filter((row) => !row.is_approved).length,
        orphanTranslationRecords: snapshot.translations.length - usedTranslationIds.size,
        unplacedSourceSegments: snapshot.sourceCounts.unplaced_source_segments,
        unplacedUntranslatedSourceSegments: snapshot.sourceCounts.unplaced_untranslated_source_segments,
        manualOverridePlacements: snapshot.placements.filter(
          (row) => row.manual_override && Object.keys(row.manual_override).length > 0,
        ).length,
        artifactFiles: files.length,
      },
      localeCounts,
      integrity: {
        algorithm: "sha256",
        translationRecordsSha256: sha256(stableJson(uniqueRecords)),
        translationIdsSha256: sha256(
          `${uniqueRecords.map((record) => record.id).sort().join("\n")}\n`,
        ),
      },
      routes,
      files,
      notes: [
        "Route artifacts duplicate shared translations where the same segment/context occurs on multiple pages.",
        "Orphaned translation artifacts preserve translation rows that no current page placement references.",
        "Unplaced source segments without translations are counted but intentionally omitted from runtime artifacts.",
        "No database credentials, tenant user identifiers, or override actor identifiers are exported.",
      ],
    };
    await writeFile(join(tempRoot, "manifest.json"), prettyJson(manifest), "utf8");
    await writeFile(
      join(tempRoot, "README.md"),
      await readFile(catalogReadmePath, "utf8"),
      "utf8",
    );

    await mkdir(dirname(finalOutDir), { recursive: true });
    await rm(finalOutDir, { recursive: true, force: true });
    await rename(tempRoot, finalOutDir);

    return manifest;
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const connectionString = process.env.MASS_TRANSLATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Set MASS_TRANSLATE_DATABASE_URL (or DATABASE_URL) to a read-capable PostgreSQL URL");
  }

  const manifest = await exportCatalog({
    connectionString,
    tenantId: options.tenantId,
    outDir: options.outDir,
  });
  process.stdout.write(
    `Exported ${manifest.counts.translationRecords} translations across ${manifest.counts.pages} pages and ${manifest.source.locales.length} locales to ${options.outDir}\n`,
  );
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
