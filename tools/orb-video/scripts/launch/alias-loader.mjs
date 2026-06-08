// Preload entry: registers the `@/*` -> worktree-root `src/*` resolve hook
// (in-thread, synchronous) so the generator can import breathing-pages.ts via
// Node's native TS support. Run the generator with:
//   node --import ./scripts/launch/alias-loader.mjs scripts/launch/gen-launch-package.mjs
import { registerHooks } from "node:module";
import { resolve } from "./alias-hooks.mjs";
registerHooks({ resolve });
