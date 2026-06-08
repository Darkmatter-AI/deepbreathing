// Module resolution hook: map the app's `@/*` import alias to the worktree-root
// `src/*`, with TS extension probing, so the generator can import
// breathing-pages.ts (and its `@/components/resonance/types` dependency) using
// Node's native TS support — zero installs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// scripts/launch -> tools/orb-video -> tools -> <worktree root> -> src
const SRC = path.resolve(here, "../../../../src");

function resolveFile(base) {
  const tries = [base, base + ".ts", base + ".tsx", base + ".js", base + ".mjs",
    path.join(base, "index.ts"), path.join(base, "index.tsx")];
  for (const f of tries) {
    try { if (fs.statSync(f).isFile()) return f; } catch {}
  }
  return base;
}

// The only `@/` dependency that carries runtime TS enums (unsupported by
// strip-only mode) is the resonance types module — redirect it to a shim.
const TYPES_SHIM = pathToFileURL(path.join(here, "resonance-types-shim.mjs")).href;

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    if (specifier.replace(/\.tsx?$/, "").endsWith("components/resonance/types")) {
      return { url: TYPES_SHIM, shortCircuit: true };
    }
    const file = resolveFile(path.join(SRC, specifier.slice(2)));
    return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return next(specifier, context);
}
