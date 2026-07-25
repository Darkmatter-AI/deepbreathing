import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertReviewerIdentity(source, messagePrefix) {
  // These templates used to fall back to a hardcoded DEFAULT_REVIEWER when a page
  // had no reviewer set. That stamps invented authorship onto unreviewed content,
  // so the fallback was dropped: reviewerName is now null and reviewedBy is only
  // emitted for pages that actually name a reviewer. Assert the safe shape.
  assert.match(
    source,
    /const\s+reviewerName\s*=\s*page\.meta\.reviewer\s*\|\|\s*null/,
    `${messagePrefix} should read the reviewer from page.meta and default to null, not an invented identity`
  );

  assert.doesNotMatch(
    source,
    /DEFAULT_REVIEWER/,
    `${messagePrefix} must not reintroduce a hardcoded default reviewer — that fabricates reviewedBy for unreviewed pages`
  );

  // reviewedBy must be conditional on reviewerName being set.
  assert.match(
    source,
    /reviewerName\s*(?:\?|&&)[\s\S]{0,200}reviewedBy:\s*\{/,
    `${messagePrefix} should only emit reviewedBy when a reviewer is actually set`
  );

  assert.match(
    source,
    /name:\s*reviewerName/,
    `${messagePrefix} should populate reviewedBy.name from reviewerName`
  );
}

test('pattern template emits reviewedBy only for pages with a real reviewer', () => {
  const source = read('src/app/(site-en)/breathe/pattern-page.tsx');
  assertReviewerIdentity(source, 'pattern template');
});

test('use-case template emits reviewedBy only for pages with a real reviewer', () => {
  const source = read('src/app/(site-en)/for/use-case-page.tsx');
  assertReviewerIdentity(source, 'use-case template');
});
