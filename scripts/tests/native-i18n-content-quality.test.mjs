import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const repoRoot = new URL("../../", import.meta.url).pathname;
const contentRoot = join(repoRoot, "src/i18n/content");

async function readJson(path) {
  return JSON.parse(await readFile(join(repoRoot, path), "utf8"));
}

async function jsonFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(path));
    else if (entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}

function stringLeaves(value, prefix = "") {
  if (typeof value === "string") return [[prefix, value]];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    stringLeaves(child, prefix ? `${prefix}.${key}` : key)
  );
}

function getPath(value, path) {
  if (Object.hasOwn(value, path)) return value[path];
  return path.split(".").reduce((cursor, key) => cursor[key], value);
}

test("localized runtime metadata contains no known malformed-title patterns", async () => {
  const failures = [];
  for (const file of await jsonFiles(contentRoot)) {
    const localPath = relative(contentRoot, file);
    if (!/(?:^|\/)(?:messages|routes)(?:\/|$)/.test(localPath)) continue;
    const value = JSON.parse(await readFile(file, "utf8"));
    for (const [path, text] of stringLeaves(value)) {
      if (!/(?:^|\.)(?:metadata|meta)\.(?:title|socialTitle|twitterTitle)$/.test(path)) continue;
      if (/\*\*|\|\s*$|\((?:timer|gratis|pacer)\s*$/iu.test(text)) {
        failures.push(`${localPath}:${path}=${text}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("Japanese localized runtime footer labels do not fall back to About", async () => {
  const failures = [];
  for (const file of await jsonFiles(contentRoot)) {
    const localPath = relative(contentRoot, file);
    const isJapanese = /(?:^|\/)ja-jp(?:\/|\.json$)/.test(localPath);
    const isRuntime = /(?:^|\/)(?:messages|routes|chrome)(?:\/|$)/.test(localPath);
    if (!isJapanese || !isRuntime) continue;
    const value = JSON.parse(await readFile(file, "utf8"));
    for (const [path, text] of stringLeaves(value)) {
      if (/(?:^|\.)footer(?:\.|$)/.test(path) && text === "About") {
        failures.push(`${localPath}:${path}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("confirmed migration defects stay corrected in generated bundles", async () => {
  const checks = [
    ["src/i18n/content/bespoke/breathing-visualizer/messages/es-es.json", "metadata.title", "Visualizador de respiración guiada online gratis (2026): 10 técnicas, sin descargas"],
    ["src/i18n/content/bespoke/breathing-visualizer/messages/pt-br.json", "howItWorks.title", "Como funciona"],
    ["src/i18n/content/use-cases/routes/pt-br/pranayama.json", "meta.title", "Pranayama: guia completo da respiração iogue (2026)"],
    ["src/i18n/content/use-cases/routes/pt-br/public-speaking.json", "meta.title", "Exercícios de respiração para falar em público: elimine o medo de palco em 60 segundos"],
    ["src/i18n/content/bespoke/insomnia-4-7-8/messages/de-de.json", "metadata.title", "4-7-8 Atemtechnik bei Schlaflosigkeit: Einschlafen (Gratis-Timer)"],
    ["src/i18n/content/breathe/routes/fr-fr/9d-breathwork.json", "meta.title", "9D Breathwork expliqué : respiration, audio, coût (pacer gratuit)"],
    ["src/i18n/content/bespoke/privacy-support/messages/privacy/es-es.json", "metadata.socialDescription", "Política de privacidad de Deep Breathing Exercises."],
    ["src/i18n/content/use-cases/routes/es-es/anxiety.json", "meta.ogDescription", "La técnica respiratoria que usan los Navy SEALs para la ansiedad. Detén los pensamientos acelerados y la opresión en el pecho en 60 segundos. Visualizador gratuito."],
  ];

  for (const [file, path, expected] of checks) {
    assert.equal(getPath(await readJson(file), path), expected, `${file}:${path}`);
  }
});

test("trust-page structured data uses localized descriptions and breadcrumb labels", async () => {
  const [abiPage, editorialPage, i18n] = await Promise.all([
    readFile(join(repoRoot, "src/app/(site-en)/about/abi/abi-page.tsx"), "utf8"),
    readFile(join(repoRoot, "src/app/(site-en)/about/editorial-policy/editorial-policy-page.tsx"), "utf8"),
    readFile(join(repoRoot, "src/i18n/index.ts"), "utf8"),
  ]);
  assert.match(abiPage, /description: content\.metadata\.description/);
  assert.match(abiPage, /getLocalizedHomeLabel\(renderContext\.locale\)/);
  assert.match(editorialPage, /getLocalizedHomeLabel\(renderContext\.locale\)/);
  for (const label of ["Inicio", "Início", "Accueil", "Startseite", "ホーム"]) {
    assert.ok(i18n.includes(label), `missing localized Home label ${label}`);
  }
});
