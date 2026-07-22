import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertReviewerFallback(source, messagePrefix) {
  assert.match(
    source,
    /const\s+DEFAULT_REVIEWER\s*=\s*["'][^"']+["']/,
    `${messagePrefix} should define a default reviewer identity`
  );

  assert.match(
    source,
    /(?:const\s+reviewerName\s*=\s*page\.meta\.reviewer\s*\|\|\s*DEFAULT_REVIEWER[\s\S]*reviewedBy:\s*\{[\s\S]*name:\s*reviewerName|reviewedBy:\s*\{[\s\S]*name:\s*page\.meta\.reviewer\s*\|\|\s*DEFAULT_REVIEWER)/,
    `${messagePrefix} should emit reviewedBy with fallback`
  );
}

test('pattern template includes fallback reviewedBy identity in article schema', () => {
  const source = read('src/app/(site-en)/breathe/pattern-page.tsx');
  assertReviewerFallback(source, 'pattern template');
});

test('use-case template includes reviewer identity in article schema', () => {
  const source = read('src/app/(site-en)/for/use-case-page.tsx');
  assertReviewerFallback(source, 'use-case template');
});
