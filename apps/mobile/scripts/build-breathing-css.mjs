#!/usr/bin/env node
/**
 * build-breathing-css.mjs
 *
 * One-shot Tailwind CSS pre-compile for the DOM breathing component.
 * Produces a single static stylesheet with no NativeWind / PostCSS-in-Metro.
 *
 * Run from repo root:
 *   node apps/mobile/scripts/build-breathing-css.mjs
 * Or via npm script in apps/mobile:
 *   npm run breathing:css
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All paths are absolute so this script works regardless of cwd.
const mobileRoot = path.resolve(__dirname, '..');
const repoRoot   = path.resolve(mobileRoot, '../..');

const configPath = path.join(mobileRoot, 'tailwind.config.cjs');
const inputCss   = path.join(mobileRoot, 'src/components/breathing-web/styles/source.css');
const outputCss  = path.join(mobileRoot, 'src/components/breathing-web/breathing-web.css');

console.log('Building breathing-web.css …');
console.log('  config :', configPath);
console.log('  input  :', inputCss);
console.log('  output :', outputCss);
console.log('  cwd    :', repoRoot);

// Prefer the binary already installed at repo root; fall back to npx.
const tailwindBin = path.join(repoRoot, 'node_modules/.bin/tailwindcss');

execFileSync(
  tailwindBin,
  [
    '-c', configPath,
    '-i', inputCss,
    '-o', outputCss,
    '--minify'
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit'
  }
);

console.log('Done. breathing-web.css written to:');
console.log(' ', outputCss);
