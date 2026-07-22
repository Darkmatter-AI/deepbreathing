import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  RW03_APP_LOCALES,
  RW03_APP_ROUTES,
  buildRw03AppPageArtifacts,
  checkRw03AppPageArtifacts,
} from "../i18n/bespoke/compile-rw03-app-pages.mjs";

const expectedRoutes = [
  "box-breathing-app",
  "breathing-app",
  "coherent-breathing-app",
];
const expectedLocales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const expectedMessageCounts = {
  "box-breathing-app": 99,
  "breathing-app": 46,
  "coherent-breathing-app": 139,
};
const contentRoot = new URL(
  "../../src/i18n/content/bespoke/rw03-app-pages/",
  import.meta.url,
);

function leavesOf(value) {
  if (!value || typeof value !== "object") return [value];
  return Object.values(value).flatMap(leavesOf);
}

test("R-W03 app compiler owns exactly three routes and five locales", () => {
  assert.deepEqual(RW03_APP_ROUTES, expectedRoutes);
  assert.deepEqual(RW03_APP_LOCALES, expectedLocales);
});

test("R-W03 app bundles are complete, deterministic, and semantic", async () => {
  const first = await buildRw03AppPageArtifacts();
  const second = await buildRw03AppPageArtifacts();
  assert.deepEqual(first.publication, second.publication);
  assert.deepEqual([...first.outputs], [...second.outputs]);
  assert.deepEqual(first.unresolved.unresolved, []);

  for (const route of expectedRoutes) {
    const source = JSON.parse(
      await readFile(new URL(`source/${route}.json`, contentRoot), "utf8"),
    );
    assert.doesNotMatch(
      JSON.stringify(source),
      /(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/,
    );
    assert.ok(
      Object.keys(source).every(
        (messageId) =>
          !messageId.startsWith("copy.") &&
          !/(?:[a-z0-9]+-){4,}[a-z0-9]+/.test(messageId),
      ),
      `${route} source must use stable semantic ids, not prose-derived slugs`,
    );
    for (const locale of expectedLocales) {
      const messages = JSON.parse(
        first.outputs.get(`messages/${locale}/${route}.json`),
      );
      assert.deepEqual(
        Object.keys(messages).sort(),
        Object.keys(source).sort(),
      );
      assert.ok(leavesOf(messages).every((leaf) => typeof leaf === "string"));
      assert.doesNotMatch(
        JSON.stringify(messages),
        /(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/,
      );
      assert.equal(Object.keys(messages).length, expectedMessageCounts[route]);
      assert.equal(first.publication.coverage[route][locale].publishable, true);
    }
  }
});

test("the single breathing-app gap is bound to Popular Timers item four", async () => {
  const [source, replacements, provenance, compiler] = await Promise.all([
    readFile(new URL("source/breathing-app.json", contentRoot), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("reviewed-replacements.json", contentRoot), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("provenance.json", contentRoot), "utf8").then(JSON.parse),
    readFile(
      new URL("../i18n/bespoke/compile-rw03-app-pages.mjs", import.meta.url),
      "utf8",
    ),
  ]);
  assert.equal(
    source["popularTimers.links.3.label"],
    "2 minute breathing exercise",
  );
  const replacement = replacements.replacements.find(
    (entry) =>
      entry.route === "breathing-app" &&
      entry.messageId === "popularTimers.links.3.label",
  );
  assert.deepEqual(replacement.catalogGapBinding, {
    catalogRoute: "/breathing-app",
    occurrenceKey: "sel:a.rounded-full.border:ctx:link:pos:4",
  });
  assert.equal(
    replacement.translations["pt-br"],
    "exercício de respiração de 2 minutos",
  );
  assert.equal(
    provenance.routes["breathing-app"]["pt-br"]["popularTimers.links.3.label"]
      .kind,
    "reviewed-gap-replacement",
  );
  assert.doesNotMatch(compiler, /levenshtein|similarity|fuzzy/i);
  assert.match(compiler, /segment\.sourceText === sourceText/);
});

test("R-W03 checked-in artifacts and package-style check flag are current", async () => {
  assert.deepEqual((await checkRw03AppPageArtifacts()).stale, []);
  const compilerPath = fileURLToPath(
    new URL("../i18n/bespoke/compile-rw03-app-pages.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [compilerPath, "--check"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /artifacts are current/);
});

test("R-W03 loader is server-only and refuses English fallback", async () => {
  const loader = await readFile(
    new URL("server/load-rw03-app-content.ts", contentRoot),
    "utf8",
  );
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.match(loader, /loadRw03AppContent/);
  assert.match(loader, /publication\.json/);
  assert.match(loader, /refusing English fallback/);
  assert.doesNotMatch(loader, /catalog|provenance|sourceText|querySelector/);
});

test("the three English routes use separate typed renderers", async () => {
  for (const route of expectedRoutes) {
    const [page, renderer] = await Promise.all([
      readFile(
        new URL(`../../src/app/(site-en)/${route}/page.tsx`, import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          `../../src/app/(site-en)/${route}/${route}-page.tsx`,
          import.meta.url,
        ),
        "utf8",
      ),
    ]);
    assert.match(page, /source\/|source\.json/);
    assert.doesNotMatch(page, /<main|<section|<footer/);
    assert.match(renderer, /resolveNativeInternalHref/);
    assert.match(renderer, /metadataBase:\s*new URL\(siteUrl\)/);
    assert.doesNotMatch(renderer, /(?:sel:|attr:|dangerouslySetInnerHTML)/);
    assert.doesNotMatch(renderer, /copy\.(?:[a-z0-9]+-){3,}/);
  }
});
