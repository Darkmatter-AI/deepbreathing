#!/usr/bin/env node

/**
 * Test next.config.js locale-aware redirects by loading actual config in isolated processes.
 * Runs next.config.js for each NATIVE_I18N_MODE (proxy, native-preview, native)
 * and verifies the actual returned redirect rules with exact destination resolution.
 */

const { spawn } = require('child_process');
const path = require('path');

function runNextConfigInMode(mode) {
  return new Promise((resolve, reject) => {
    const configPath = path.resolve(__dirname, '../../next.config.js');
    const script = `
      process.env.NATIVE_I18N_MODE = '${mode}';
      delete require.cache[require.resolve('${configPath}')];
      const config = require('${configPath}');
      config.redirects().then(redirects => {
        console.log(JSON.stringify(redirects, null, 2));
      }).catch(err => {
        console.error(err.message);
        process.exit(1);
      });
    `;

    const child = spawn('node', ['-e', script], {
      cwd: __dirname,
      env: { ...process.env, NATIVE_I18N_MODE: mode },
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
      } else {
        try {
          const redirects = JSON.parse(output);
          resolve(redirects);
        } catch (e) {
          reject(new Error(`Failed to parse JSON output: ${e.message}\nOutput: ${output}`));
        }
      }
    });
  });
}

// Match a path against a redirect source pattern and return captured groups
function matchPathPattern(source, testPath) {
  let pattern = source.replace(/\//g, '\\/');

  // Replace /:name(...) patterns
  pattern = pattern.replace(/:(\w+)\(([^)]+)\)/g, (match, name) => {
    const choices = match.split('(')[1].slice(0, -1);
    return `(?<${name}>${choices})`;
  });

  // Replace /:name+ and /:name* patterns
  pattern = pattern.replace(/:(\w+)\+/g, '(?<$1>[^/]+(?:\\/[^/]+)*)');
  pattern = pattern.replace(/:(\w+)\*/g, '(?<$1>[^/]*(?:\\/[^/]*)*)');

  // Replace plain :name patterns
  pattern = pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)');

  const regex = new RegExp(`^${pattern}$`);
  const match = testPath.match(regex);
  return match ? match.groups : null;
}

// Resolve destination by substituting captured groups into the destination pattern
function resolveDestination(destination, capturedGroups) {
  let resolved = destination;
  if (capturedGroups) {
    for (const [key, value] of Object.entries(capturedGroups)) {
      resolved = resolved.replace(new RegExp(`:${key}(?:\\*|\\+)?`), value);
    }
  }
  return resolved;
}

// Find a matching redirect rule for a test path and return the resolved destination
// Skips rules with host conditions (www redirects) to test path-only matching
function findRedirectDestination(redirects, testPath) {
  for (const rule of redirects) {
    // Skip rules with host conditions - they don't apply to path-only testing
    if (rule.has) {
      continue;
    }
    const groups = matchPathPattern(rule.source, testPath);
    if (groups) {
      return {
        source: rule.source,
        destination: resolveDestination(rule.destination, groups),
        permanent: rule.permanent,
      };
    }
  }
  return null;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

function assertEquals(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Got: ${actual}`);
    failed++;
  }
}

async function runTests() {
  console.log('Loading actual next.config.js redirects in isolated processes...\n');

  let proxyRedirects, nativePreviewRedirects, nativeRedirects;

  try {
    console.log('Test Suite: Load proxy mode redirects');
    proxyRedirects = await runNextConfigInMode('proxy');
    console.log(`✓ Loaded ${proxyRedirects.length} redirects for proxy mode\n`);

    console.log('Test Suite: Load native-preview mode redirects');
    nativePreviewRedirects = await runNextConfigInMode('native-preview');
    console.log(`✓ Loaded ${nativePreviewRedirects.length} redirects for native-preview mode\n`);

    console.log('Test Suite: Load native mode redirects');
    nativeRedirects = await runNextConfigInMode('native');
    console.log(`✓ Loaded ${nativeRedirects.length} redirects for native mode\n`);
  } catch (error) {
    console.error(`✗ Failed to load next.config.js: ${error.message}`);
    process.exit(1);
  }

  // Test 1: Proxy mode configuration
  console.log('Test Suite: Proxy mode isolation');
  const proxyHasDoubleLoacleRules = proxyRedirects.some(r => r.source.includes('outer'));
  assert(!proxyHasDoubleLoacleRules, 'proxy mode should NOT have double-locale redirect rules');

  const proxyNativeLocaleRules = proxyRedirects.filter(r => r.source.includes('locale') && (r.source.includes('methodology') || r.source.includes('languages') || r.source.includes('outer')));
  assertEquals(proxyNativeLocaleRules.length, 0, 'proxy mode should have zero native locale-aware redirect rules');

  // Test 2: Native mode configuration
  console.log('\nTest Suite: Native mode configuration');
  const nativePreviewHasMethodology = nativePreviewRedirects.some(r => r.source.includes('locale') && r.source.includes('methodology'));
  assert(nativePreviewHasMethodology, 'native-preview should have legacy methodology redirects');

  const nativePreviewHasLanguages = nativePreviewRedirects.some(r => r.source.includes('locale') && r.source.includes('languages'));
  assert(nativePreviewHasLanguages, 'native-preview should have /languages redirects');

  const nativePreviewNativeRules = nativePreviewRedirects.filter(
    r => (r.source.includes('locale') && (r.source.includes('methodology') || r.source.includes('languages'))) || r.source.includes('outer'),
  );
  assertEquals(nativePreviewNativeRules.length, 5, 'native-preview should have 5 native locale-aware redirect rules (2 methodology, 1 languages, 2 double-locale)');

  // Test 3: Native mode same rules
  console.log('\nTest Suite: Native mode parity');
  const nativeNativeRules = nativeRedirects.filter(
    r => (r.source.includes('locale') && (r.source.includes('methodology') || r.source.includes('languages'))) || r.source.includes('outer'),
  );
  assertEquals(nativeNativeRules.length, 5, 'native should have 5 native locale-aware redirect rules');

  // Test 4: Verify all native locale redirect rules have permanent: true
  console.log('\nTest Suite: Permanence of all native locale redirects');
  for (const rule of nativePreviewNativeRules) {
    assert(rule.permanent === true, `rule ${rule.source} must have permanent: true`);
  }

  // Test 5: Test methodology redirects for all 5 locales with exact destinations
  console.log('\nTest Suite: Methodology redirects - exact destinations');
  const locales = ['es', 'pt', 'fr', 'de', 'ja'];

  for (const locale of locales) {
    const testPath = `/${locale}/about/methodology`;
    const result = findRedirectDestination(nativePreviewRedirects, testPath);
    assertEquals(
      result ? result.destination : null,
      `/${locale}/about/editorial-policy`,
      `/${locale}/about/methodology should redirect to /${locale}/about/editorial-policy`
    );
  }

  // Test 6: Test nested methodology redirects
  console.log('\nTest Suite: Nested methodology redirects');
  for (const locale of locales) {
    const testPath = `/${locale}/about/methodology/some/path`;
    const result = findRedirectDestination(nativePreviewRedirects, testPath);
    assertEquals(
      result ? result.destination : null,
      `/${locale}/about/editorial-policy`,
      `/${locale}/about/methodology/some/path should redirect to /${locale}/about/editorial-policy`
    );
  }

  // Test 7: Test /languages redirects for all 5 locales
  console.log('\nTest Suite: Languages redirects - exact destinations');
  for (const locale of locales) {
    const testPath = `/${locale}/languages`;
    const result = findRedirectDestination(nativePreviewRedirects, testPath);
    assertEquals(
      result ? result.destination : null,
      '/languages',
      `/${locale}/languages should redirect to /languages`
    );
  }

  // Test 8: Test double-locale bare paths for all locale combinations
  console.log('\nTest Suite: Double-locale bare paths - exact destinations');
  const doubleLocaleExamples = [
    ['/de/fr', '/de/'],
    ['/fr/pt', '/fr/'],
    ['/pt/es', '/pt/'],
    ['/es/ja', '/es/'],
    ['/ja/de', '/ja/'],
  ];

  for (const [testPath, expectedDest] of doubleLocaleExamples) {
    const result = findRedirectDestination(nativePreviewRedirects, testPath);
    assertEquals(
      result ? result.destination : null,
      expectedDest,
      `${testPath} should redirect to ${expectedDest}`
    );
  }

  // Test 9: Test double-locale nested paths for all locale combinations
  console.log('\nTest Suite: Double-locale nested paths - exact destinations');
  const doubleLocaleNestedExamples = [
    ['/de/fr/breathe/breath-of-fire', '/de/breathe/breath-of-fire'],
    ['/fr/pt/for/huberman', '/fr/for/huberman'],
    ['/pt/es/breathe/coherent', '/pt/breathe/coherent'],
    ['/es/ja/box-breathing-app', '/es/box-breathing-app'],
    ['/ja/de/4-7-8-breathing-timer', '/ja/4-7-8-breathing-timer'],
  ];

  for (const [testPath, expectedDest] of doubleLocaleNestedExamples) {
    const result = findRedirectDestination(nativePreviewRedirects, testPath);
    assertEquals(
      result ? result.destination : null,
      expectedDest,
      `${testPath} should redirect to ${expectedDest}`
    );
  }

  // Test 10: Verify no redirect loop between sources and destinations
  console.log('\nTest Suite: Redirect loop prevention');
  const nativeSpecificRules = nativePreviewRedirects.filter(
    r => (r.source.includes('locale') && (r.source.includes('methodology') || r.source.includes('languages'))) || r.source.includes('outer'),
  );
  for (const rule of nativeSpecificRules) {
    const reverseMatch = matchPathPattern(rule.source, rule.destination);
    assert(!reverseMatch, `destination ${rule.destination} should not match source pattern ${rule.source}`);
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
