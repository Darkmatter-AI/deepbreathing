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

test('all local metadata pages define openGraph.images and twitter.images', () => {
  const pages = walkPages(APP_DIR);
  const offenders = [];

  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');

    const hasLocalMetadata = /export\s+const\s+metadata\s*(?::\s*Metadata)?\s*=/.test(source);
    const usesPatternTemplate = /createPatternMetadata\(/.test(source);
    const usesUseCaseTemplate = /createUseCaseMetadata\(/.test(source);

    if (!hasLocalMetadata || usesPatternTemplate || usesUseCaseTemplate) {
      continue;
    }

    const hasOpenGraphImages = /openGraph\s*:\s*\{[\s\S]*?images\s*:/.test(source);
    const hasTwitterImages = /twitter\s*:\s*\{[\s\S]*?images\s*:/.test(source);

    if (!hasOpenGraphImages || !hasTwitterImages) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `missing explicit OG/Twitter image config in: ${offenders.join(', ')}`
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
