import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const resonancePath = path.join(
  root,
  "src",
  "components",
  "resonance",
  "Resonance.tsx",
);

function readResonance() {
  return fs.readFileSync(resonancePath, "utf8");
}

test("practice routing telemetry keeps only pathname fields", () => {
  const source = readResonance();
  const helper = source.slice(
    source.indexOf("function trackPracticeRouteClick"),
    source.indexOf("// Lazy-load ParticleBackground"),
  );

  assert.match(helper, /PRODUCTION_HOSTNAMES\.has\(window\.location\.hostname\)/);
  assert.match(helper, /trackEvent\('practice_route_click', \{/);
  assert.match(helper, /origin_path: originPath/);
  assert.match(helper, /destination_path: destinationPath/);
  assert.doesNotMatch(helper, /search|hash|href|page_location|email|user_id/);
});

test("practice route detection rejects external and non-practice destinations", () => {
  const source = readResonance();

  assert.match(source, /new URL\(href, window\.location\.origin\)/);
  assert.match(source, /destination\.origin !== window\.location\.origin/);
  assert.match(source, /destination\.pathname/);
  assert.match(source, /breathe\\\/\[\^\/\]\+/);
  assert.match(source, /practiceLink instanceof HTMLAnchorElement/);
});

test("mode switches include actual origin and destination paths", () => {
  const source = readResonance();
  const modeHandler = source.slice(
    source.indexOf("const handleModeSelect"),
    source.indexOf("const handleAIRecommendation"),
  );

  assert.match(modeHandler, /const destinationPath = slug \? resolveClientHref/);
  assert.match(modeHandler, /trackEvent\('mode_switch', \{/);
  assert.match(modeHandler, /origin_path: pathname/);
  assert.match(modeHandler, /destination_path: destinationPath/);
  assert.match(modeHandler, /router\.push\(destinationPath\)/);
});

test("authenticated receipt remains separate from the guest conversion prompt", () => {
  const source = readResonance();

  assert.match(source, /isAuthenticated && seconds >= 60/);
  assert.match(source, /<AuthenticatedPracticeReceipt/);
  assert.match(source, /<SessionCompletePrompt/);
  assert.match(source, /authenticatedReceiptFiredRef\.current = false/);
  assert.match(source, /process\.env\.NODE_ENV !== 'production'/);
});
