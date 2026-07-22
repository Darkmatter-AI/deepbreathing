import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  RW04_STATS_LOCALES,
  buildRw04StatsArtifacts,
  checkRw04StatsArtifacts,
} from "../i18n/bespoke/compile-rw04-stats.mjs";

const expectedLocales = ["de-de", "es-es", "fr-fr", "ja-jp", "pt-br"];
const contentRoot = new URL(
  "../../src/i18n/content/bespoke/stats/",
  import.meta.url,
);

test("R-W04 stats compiler owns five locales and a semantic source", async () => {
  assert.deepEqual(RW04_STATS_LOCALES, expectedLocales);
  const source = JSON.parse(
    await readFile(new URL("source.json", contentRoot), "utf8"),
  );
  assert.ok(Object.keys(source).length > 0);
  assert.ok(Object.values(source).every((value) => typeof value === "string"));
  assert.ok(
    Object.keys(source).every(
      (messageId) =>
        !messageId.startsWith("copy.") &&
        !/(?:[a-z0-9]+-){4,}[a-z0-9]+/.test(messageId),
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(source),
    /(?:sel:|attr:|occurrenceKey|catalogSourceText|sourceHash)/,
  );
});

test("R-W04 stats bundles are complete and deterministic", async () => {
  const first = await buildRw04StatsArtifacts();
  const second = await buildRw04StatsArtifacts();
  assert.deepEqual(first.publication, second.publication);
  assert.deepEqual([...first.outputs], [...second.outputs]);
  assert.deepEqual(first.unresolved.unresolved, []);

  const source = JSON.parse(
    await readFile(new URL("source.json", contentRoot), "utf8"),
  );
  for (const locale of expectedLocales) {
    const messages = JSON.parse(first.outputs.get(`messages/${locale}.json`));
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(source).sort());
    assert.equal(first.publication.coverage[locale].publishable, true);
    assert.deepEqual(
      {
        externalBindings: first.publication.coverage[locale].externalBindings,
        gapReplacements: first.publication.coverage[locale].gapReplacements,
        reviewedReplacements:
          first.publication.coverage[locale].reviewedReplacements,
      },
      {
        externalBindings: 24,
        gapReplacements: 5,
        reviewedReplacements: 33,
      },
    );
  }
});

test("the completed stats gap contract remains explicitly bound", async () => {
  const [replacements, provenance] = await Promise.all([
    readFile(new URL("reviewed-replacements.json", contentRoot), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("provenance.json", contentRoot), "utf8").then(JSON.parse),
  ]);
  const gapEntries = replacements.replacements.filter(
    (entry) => entry.catalogGapBinding,
  );
  assert.equal(gapEntries.length, 5);
  assert.equal(
    gapEntries.reduce(
      (count, entry) => count + Object.keys(entry.translations).length,
      0,
    ),
    25,
  );
  for (const entry of gapEntries) {
    assert.equal(entry.catalogGapBinding.catalogRoute, "/stats");
    assert.ok(
      expectedLocales.every(
        (locale) => provenance.locales[locale][entry.messageId],
      ),
    );
  }
});

test("R-W04 checked-in artifacts and check flag are current", async () => {
  assert.deepEqual((await checkRw04StatsArtifacts()).stale, []);
  const compilerPath = fileURLToPath(
    new URL("../i18n/bespoke/compile-rw04-stats.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [compilerPath, "--check"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /artifacts are current/);
});

test("stats loaders and explicit localized route fail closed", async () => {
  const [loader, localizedPage] = await Promise.all([
    readFile(new URL("server/load-stats-content.ts", contentRoot), "utf8"),
    readFile(
      new URL(
        "../../src/app/(site-localized)/[locale]/stats/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.equal(loader.startsWith('import "server-only";'), true);
  assert.match(loader, /refusing English fallback/);
  assert.match(localizedPage, /force-dynamic/);
  assert.match(localizedPage, /loadStatsContent/);
  assert.match(localizedPage, /resolveNativeI18nMode/);
  assert.match(localizedPage, /isNativeRoutePreviewable/);
  assert.match(localizedPage, /isNativeRoutePublished/);
  assert.match(localizedPage, /sourceRoute = "\/stats"/);
  assert.match(
    localizedPage,
    /createStatsMetadataFromContent\(\s*content,\s*request\.canonicalPath/,
  );
  assert.match(localizedPage, /buildHreflangAlternates/);
  assert.match(localizedPage, /SUPPORTED_LOCALES/);
  assert.match(localizedPage, /canonical: new URL\(request\.canonicalPath/);
  assert.match(localizedPage, /notFound\(\)/);
  assert.doesNotMatch(localizedPage, /generateStaticParams/);
});

test("the shared stats server preserves authenticated query and fallback behavior", async () => {
  const statsPage = await readFile(
    new URL("../../src/app/(site-en)/stats/stats-page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    statsPage,
    /auth\.api\.getSession\(\{ headers: headers\(\) \}\)/,
  );
  assert.match(
    statsPage,
    /SELECT total_minutes, sessions_completed, current_streak, last_session_date\s+FROM user_stats WHERE user_id = \$1/,
  );
  assert.match(statsPage, /SELECT mode FROM user_settings WHERE user_id = \$1/);
  assert.match(
    statsPage,
    /SELECT to_char\(day, 'YYYY-MM-DD'\) AS day\s+FROM user_active_days\s+WHERE user_id = \$1 AND day >= CURRENT_DATE - interval '140 days'/,
  );
  assert.match(statsPage, /catch \{/);
  assert.match(statsPage, /streakWindowDays\(currentStreak, lastSessionDate\)/);
  assert.match(statsPage, /robots: \{ index: false \}/);
  assert.match(statsPage, /canonicalPath\?: string/);
  assert.match(statsPage, /canonical: new URL\(canonicalPath, siteUrl\)/);
});

test("stats renderers consume typed messages and explicit locale context", async () => {
  const [page, display] = await Promise.all([
    readFile(
      new URL("../../src/app/(site-en)/stats/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/app/(site-en)/stats/stats-display.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(page, /source\.json/);
  assert.match(page, /StatsContent/);
  assert.match(display, /StatsContent/);
  assert.match(display, /renderContext/);
  assert.match(display, /Intl\.DateTimeFormat/);
  assert.match(display, /locale=\{renderContext\.authLocale\}/);
  assert.doesNotMatch(display, /const SHORT_MONTHS|const SHORT_DAYS/);
  assert.doesNotMatch(display, /copy\.(?:[a-z0-9]+-){3,}/);
});

test("authenticated stats reach is tracked only from the production display", async () => {
  const display = await readFile(
    new URL("../../src/app/(site-en)/stats/stats-display.tsx", import.meta.url),
    "utf8",
  );
  const authenticatedDisplay = display.slice(
    display.indexOf("export function StatsDisplay"),
    display.indexOf("export function StatsSignedOut"),
  );
  const signedOutDisplay = display.slice(
    display.indexOf("export function StatsSignedOut"),
  );

  assert.match(display, /ANALYTICS_PRODUCTION_HOSTNAMES/);
  assert.match(display, /deepbreathingexercises\.com/);
  assert.match(display, /www\.deepbreathingexercises\.com/);
  assert.match(
    authenticatedDisplay,
    /trackAuthenticatedStatsView\(renderContext\.locale\)/,
  );
  assert.match(display, /"stats_authenticated_view"/);
  assert.doesNotMatch(signedOutDisplay, /trackAuthenticatedStatsView/);
});
