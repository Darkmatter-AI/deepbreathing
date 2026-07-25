import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');

function walkPages(dir) {
  let pages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      pages = pages.concat(walkPages(full));
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      pages.push(full);
    }
  }
  return pages;
}

// Resolve a TS/TSX import specifier to a file on disk, so a page that delegates
// its metadata to a shared factory can be checked at the factory instead.
function resolveImport(spec, fromFile) {
  const base = spec.startsWith('@/')
    ? path.join(ROOT, 'src', spec.slice(2))
    : spec.startsWith('.')
      ? path.resolve(path.dirname(fromFile), spec)
      : null;
  if (!base) return null;
  for (const candidate of [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function hasImageConfig(source) {
  return (
    /openGraph\s*:\s*\{[\s\S]*?images\s*:/.test(source) &&
    /twitter\s*:\s*\{[\s\S]*?images\s*:/.test(source)
  );
}

test('every page with metadata defines openGraph.images and twitter.images, inline or via its factory', () => {
  const pages = walkPages(APP_DIR);
  const offenders = [];

  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');

    const hasLocalMetadata = /export\s+const\s+metadata\s*(?::\s*Metadata)?\s*=/.test(source);
    if (!hasLocalMetadata) continue;

    // noindex pages never surface in search or social unfurls (internal authoring
    // surfaces like /sensory-studio, /og-preview, and the private /stats page), so
    // an OG image is meaningless for them. Only indexable pages are held to this.
    if (/robots\s*:\s*\{[^}]*index\s*:\s*false/.test(source) || /noindex/.test(source)) continue;

    if (hasImageConfig(source)) continue;

    // Most pages now delegate to a shared metadata factory (createDurationMetadata-
    // FromContent, createPatternMetadata, ...) instead of spelling openGraph out
    // inline. Follow the factory's import and assert the images are set there,
    // rather than maintaining a hardcoded list of factory names.
    const factory = source.match(/export\s+const\s+metadata\s*(?::\s*Metadata)?\s*=\s*(?:await\s+)?([A-Za-z0-9_$]+)\s*\(/);
    if (factory) {
      const name = factory[1];
      const importMatch = source.match(
        new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']([^"']+)["']`, 's')
      );
      const resolved = importMatch ? resolveImport(importMatch[1], file) : null;
      if (resolved && hasImageConfig(fs.readFileSync(resolved, 'utf8'))) continue;
    }

    offenders.push(path.relative(ROOT, file));
  }

  assert.deepEqual(
    offenders,
    [],
    `missing OG/Twitter image config (inline or in the metadata factory) in: ${offenders.join(', ')}`
  );
});

test('use-case metadata uses dynamic OG images per page', () => {
  const file = path.join(APP_DIR, '(site-en)', 'for', 'use-case-page.tsx');
  const source = fs.readFileSync(file, 'utf8');

  assert.match(source, /createOgImagePath\(/, 'use-case metadata should use dynamic OG image URL helper');
  assert.doesNotMatch(
    source,
    /const\s+ogImage\s*=\s*isHolidayPage\s*\?\s*"\/og-image-holidays\.png"\s*:\s*"\/og-image\.png"/,
    'use-case metadata should not rely on shared static image fallback'
  );
});
