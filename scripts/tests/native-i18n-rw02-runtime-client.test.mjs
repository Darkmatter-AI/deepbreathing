import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RW02_ROUTE_CLIENT_LOCALES,
  RW02_ROUTE_CLIENT_ROUTES,
  buildRw02RouteClientArtifacts,
  checkRw02RouteClientArtifacts,
} from "../i18n/remaining-pages/compile-rw02-route-client-messages.mjs";

const repoRoot = new URL("../../", import.meta.url);

const EXPECTED_COUNTS = new Map([
  ["/box-breathing-before-presentation", 12],
  ["/physiological-sigh-panic-attack", 11],
]);

const FORBIDDEN_RUNTIME_FIELDS =
  /catalog|placement|messageId|reason|reviewedSourceHash|sourceHash|sourceText/i;

async function read(relativePath) {
  return readFile(new URL(relativePath, repoRoot), "utf8");
}

test("R-W02 route-client artifacts preserve all 115 reviewed placement cells", async () => {
  assert.deepEqual(RW02_ROUTE_CLIENT_LOCALES, [
    "de-de",
    "es-es",
    "fr-fr",
    "ja-jp",
    "pt-br",
  ]);
  assert.deepEqual(RW02_ROUTE_CLIENT_ROUTES, [
    "/box-breathing-before-presentation",
    "/physiological-sigh-panic-attack",
  ]);

  const artifacts = await buildRw02RouteClientArtifacts();
  const publication = JSON.parse(artifacts.get("publication.json"));
  const provenance = JSON.parse(artifacts.get("provenance.json"));
  const unresolved = JSON.parse(artifacts.get("unresolved.json"));

  assert.equal(publication.reviewedCells, 115);
  assert.equal(publication.unresolvedCells, 0);
  assert.deepEqual(unresolved, []);

  for (const route of RW02_ROUTE_CLIENT_ROUTES) {
    const expectedCount = EXPECTED_COUNTS.get(route);
    assert.equal(publication.routes[route].messagesPerLocale, expectedCount);
    assert.equal(publication.routes[route].reviewedCells, expectedCount * 5);

    for (const locale of RW02_ROUTE_CLIENT_LOCALES) {
      const slug = route.slice(1);
      const key = `messages/${slug}/${locale}.json`;
      const source = artifacts.get(key);
      assert.ok(source, `missing ${key}`);
      assert.doesNotMatch(source, FORBIDDEN_RUNTIME_FIELDS);

      const messages = JSON.parse(source);
      assert.equal(Object.keys(messages).length, expectedCount);
      assert.ok(Object.values(messages).every((value) => typeof value === "string" && value.length > 0));

      const records = provenance.routes[route].locales[locale];
      assert.equal(Object.keys(records).length, expectedCount);
      for (const record of Object.values(records)) {
        assert.match(record.placementId, /^[0-9a-f-]{36}$/);
        assert.match(record.reviewedSourceHash, /^[0-9a-f]{64}$/);
      }
    }
  }
});

test("R-W02 repeated presentation and panic contracts stay route scoped", async () => {
  const artifacts = await buildRw02RouteClientArtifacts();
  const presentation = JSON.parse(
    artifacts.get("messages/box-breathing-before-presentation/fr-fr.json"),
  );
  const panic = JSON.parse(
    artifacts.get("messages/physiological-sigh-panic-attack/fr-fr.json"),
  );

  assert.notEqual(presentation.saveSessionAria, panic.saveSessionAria);
  assert.notEqual(presentation.title, panic.title);
  assert.notEqual(presentation.sessionComplete, panic.sessionComplete);
  assert.notEqual(presentation.modeName, panic.modeName);
  assert.notEqual(presentation.oneTapNoPassword, panic.oneTapNoPassword);
  assert.notEqual(presentation.emailPlaceholder, panic.emailPlaceholder);
  assert.equal(presentation.justNow, "à l'instant");
  assert.equal("justNow" in panic, false);

  const presentationDe = JSON.parse(
    artifacts.get("messages/box-breathing-before-presentation/de-de.json"),
  );
  const panicDe = JSON.parse(
    artifacts.get("messages/physiological-sigh-panic-attack/de-de.json"),
  );
  assert.notEqual(presentationDe.saveWithEmail, panicDe.saveWithEmail);
});

test("R-W02 generated route-client artifacts are current", async () => {
  assert.deepEqual(await checkRw02RouteClientArtifacts(), []);
});

test("R-W02 loader is literal and fail closed", async () => {
  const loader = await read(
    "src/i18n/content/remaining-pages/rw02-route-client/server/load-rw02-route-client-messages.ts",
  );

  assert.match(loader, /import "server-only"/);
  assert.equal((loader.match(/import\("\.\.\/messages\//g) ?? []).length, 10);
  assert.match(loader, /throw new Error/);
  assert.doesNotMatch(loader, /fallback|defaultMessages/i);
});

test("R-W02 client chrome accepts explicit route messages without changing defaults", async () => {
  const [resonance, prompt, banner] = await Promise.all([
    read("src/components/resonance/Resonance.tsx"),
    read("src/components/auth/session-complete-prompt.tsx"),
    read("src/components/auth/non-blocking-sign-in-banner.tsx"),
  ]);

  assert.match(resonance, /routeClientMessages\?: ResonanceRouteClientMessages/);
  assert.match(resonance, /routeClientMessages=\{routeClientMessages\}/);
  assert.match(prompt, /routeClientMessages\?: ResonanceRouteClientMessages/);
  assert.match(prompt, /messages=\{routeClientMessages\}/);
  assert.match(banner, /messages\?: ResonanceRouteClientMessages/);
  assert.match(banner, /messages\?\.saveSessionAria \?\? "Save your session"/);
  assert.match(banner, /messages\?\.modeName \?\? sessionMode/);
});
