#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "../..");
const SITE_URL = "https://deepbreathingexercises.com";

const LOCALES = Object.freeze([
  { prefix: "es", htmlLang: "es-ES" },
  { prefix: "pt", htmlLang: "pt-BR" },
  { prefix: "fr", htmlLang: "fr-FR" },
  { prefix: "de", htmlLang: "de-DE" },
  { prefix: "ja", htmlLang: "ja-JP" },
]);

const ROUTES = Object.freeze([
  "",
  "4-7-8-breathing-timer",
  "about",
  "breathe",
  "breathe/4-7-8",
  "breathe/9d-breathwork",
  "breathe/belly",
  "breathe/box",
  "breathe/breath-of-fire",
  "breathe/buteyko",
  "breathe/coherent",
  "breathe/hope-cartel-9d-breathwork",
  "breathe/nadi-shodhana",
  "breathe/physiological-sigh",
  "breathe/pursed-lip",
  "breathe/tummo",
  "breathe/ujjayi",
  "breathe/wim-hof",
  "for",
  "for/anxiety",
  "for/athletes",
  "for/focus",
  "for/high-blood-pressure",
  "for/holiday-stress",
  "for/huberman",
  "for/kids",
  "for/lung-capacity",
  "for/meditation",
  "for/panic-attacks",
  "for/pranayama",
  "for/pregnancy",
  "for/public-speaking",
  "for/running",
  "for/singing",
  "for/sleep",
  "for/stress",
  "for/travel-anxiety",
]);

function matchAttribute(html, pattern) {
  return html.match(pattern)?.[1] ?? null;
}

export function containsUsCrisisNumber(route, html) {
  return route === "for/anxiety" && /\b988\b/.test(html);
}

export function verifyNativePreviewBuild(repoRoot = DEFAULT_REPO_ROOT) {
  const records = [];
  const failures = [];

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const routeSuffix = route ? `/${route}` : "";
      const publicPath = `/${locale.prefix}${routeSuffix}`;
      const relativeArtifact = `.next/server/app/${locale.prefix}${routeSuffix}.html`;
      const artifactPath = path.join(repoRoot, relativeArtifact);
      if (!fs.existsSync(artifactPath)) {
        failures.push(`${publicPath}: missing ${relativeArtifact}`);
        continue;
      }

      const html = fs.readFileSync(artifactPath, "utf8");
      const htmlLang = matchAttribute(html, /<html[^>]*lang="([^"]+)"/);
      const title = matchAttribute(html, /<title>([^<]+)<\/title>/);
      const canonical = matchAttribute(
        html,
        /<link rel="canonical" href="([^"]+)"/,
      );
      const alternateCount = html.match(/hrefLang=/g)?.length ?? 0;

      if (html.includes('id="__next_error__"')) {
        failures.push(`${publicPath}: emitted Next error fallback HTML`);
      }
      if (htmlLang !== locale.htmlLang) {
        failures.push(
          `${publicPath}: expected lang=${locale.htmlLang}, received ${htmlLang}`,
        );
      }
      if (!title) failures.push(`${publicPath}: missing localized title`);
      if (canonical !== `${SITE_URL}${publicPath}`) {
        failures.push(`${publicPath}: incorrect canonical ${canonical}`);
      }
      if (alternateCount !== 7) {
        failures.push(
          `${publicPath}: expected 7 alternates, received ${alternateCount}`,
        );
      }
      if (html.includes("__MT_CONFIG__")) {
        failures.push(`${publicPath}: contains legacy translation global`);
      }
      // The regional safety replacement belongs to the anxiety proof route.
      // Other routes can contain 988 as historical data (for example, the
      // documented birth year in the Tummo lineage) without naming the US
      // crisis service.
      if (containsUsCrisisNumber(route, html)) {
        failures.push(`${publicPath}: contains the US-only crisis number`);
      }

      records.push(
        Object.freeze({
          alternateCount,
          bytes: Buffer.byteLength(html),
          canonical,
          htmlLang,
          publicPath,
          title,
        }),
      );
    }
  }

  const unapprovedArtifact = path.join(
    repoRoot,
    ".next/server/app/es/holiday-breathing-exercises.html",
  );
  if (fs.existsSync(unapprovedArtifact)) {
    failures.push(
      "/es/holiday-breathing-exercises: unapproved localized artifact exists",
    );
  }

  if (failures.length) {
    throw new Error(
      `Native preview build verification failed:\n- ${failures.join("\n- ")}`,
    );
  }

  return Object.freeze(records);
}

function main() {
  const records = verifyNativePreviewBuild();
  console.log(`Verified ${records.length} native preview HTML artifacts`);
}

if (path.resolve(process.argv[1] ?? "") === path.resolve(SCRIPT_PATH)) {
  main();
}
