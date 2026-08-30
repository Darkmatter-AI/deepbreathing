import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Static source-assertion tests (matches the repo's other auth/event tests, which
// read the .tsx/.ts source directly rather than transpiling + running it).
const ROOT = process.cwd();
const VARIANT = path.join(ROOT, "src", "lib", "conversion", "variant.ts");
const SHEET = path.join(ROOT, "src", "components", "auth", "loss-aversion-sign-in-sheet.tsx");
const KEEP_SHEET = path.join(ROOT, "src", "components", "auth", "keep-practice-sheet.tsx");
const PROMPT = path.join(ROOT, "src", "components", "auth", "session-complete-prompt.tsx");
const RESONANCE = path.join(ROOT, "src", "components", "resonance", "Resonance.tsx");

const read = (p) => fs.readFileSync(p, "utf8");

test("variant.ts: provider-complete keep_practice is the active guest completion at 100% share", () => {
  const src = read(VARIANT);

  assert.match(
    src,
    /export type ConversionVariant =[^;]*"loss_aversion_banner"/,
    "ConversionVariant union should include loss_aversion_banner (the shipped non-blocking banner)"
  );
  const active = src.match(/export const ACTIVE_CHALLENGER:\s*ConversionVariant\s*=\s*"([^"]+)"/);
  assert.ok(active, "ACTIVE_CHALLENGER should be declared with an explicit variant");
  assert.equal(
    active[1],
    "keep_practice",
    "every signed-out completion should use the provider-complete Save your progress prompt"
  );
  const union = [...src.matchAll(/\|\s*"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(
    union.includes(active[1]),
    `ACTIVE_CHALLENGER "${active[1]}" must be a member of the ConversionVariant union (${union.join(", ")})`
  );
  assert.match(
    src,
    /export const CHALLENGER_SHARE\s*=\s*1\b/,
    "CHALLENGER_SHARE should be 1 (100% challenger); 0 is the instant rollback"
  );
  // At CHALLENGER_SHARE=1, Math.random() (always < 1) resolves to ACTIVE_CHALLENGER.
  assert.match(
    src,
    /Math\.random\(\)\s*<\s*CHALLENGER_SHARE\s*\?\s*ACTIVE_CHALLENGER\s*:\s*"control"/,
    "getConversionVariant should bucket via CHALLENGER_SHARE -> ACTIVE_CHALLENGER"
  );
  // isVariant() must accept the active challenger, or a persisted assignment is
  // discarded on the next visit and the visitor silently re-buckets.
  assert.match(
    src,
    new RegExp(`v === "${active[1]}"`),
    `isVariant() should accept "${active[1]}" so a persisted value is honored`
  );
});

test("variant.ts: provider-parity storage key re-buckets returning visitors", () => {
  const src = read(VARIANT);
  assert.match(
    src,
    /const VARIANT_KEY\s*=\s*"resonance_conversion_variant_v6"/,
    "the provider-parity hotfix must re-bucket returning loss_aversion visitors"
  );
  // The active key const must not still be the un-bumped key.
  assert.doesNotMatch(
    src,
    /const VARIANT_KEY\s*=\s*"resonance_conversion_variant"\s*;/,
    "the active VARIANT_KEY const should no longer be the un-suffixed key"
  );
});

test("active guest completion sheet renders both Apple and Google signup actions", () => {
  const prompt = read(PROMPT);
  const sheet = read(KEEP_SHEET);

  assert.match(
    prompt,
    /variant === "keep_practice"[\s\S]*?<KeepPracticeSheet/,
    "the active keep_practice variant should route to KeepPracticeSheet"
  );
  assert.match(sheet, /provider:\s*"apple"/, "Apple signup should use the Apple provider");
  assert.match(sheet, /t\("auth\.continue_apple"\)/, "Apple signup should be visible");
  assert.match(sheet, /provider:\s*"google"/, "Google signup should use the Google provider");
  assert.match(sheet, /t\("auth\.continue_google"\)/, "Google signup should be visible");
});

test("loss-aversion sheet fires signin_* events tagged variant: loss_aversion", () => {
  const src = read(SHEET);
  for (const evt of ["signin_prompt_view", "signin_google_clicked", "signin_magic_link_sent"]) {
    assert.match(
      src,
      new RegExp(`trackEvent\\(\\s*"${evt}"\\s*,\\s*\\{\\s*variant:\\s*"loss_aversion"\\s*\\}`),
      `${evt} should fire with { variant: "loss_aversion" }`
    );
  }
});

test("loss-aversion sheet renders the real session card + reference copy", () => {
  const src = read(SHEET);
  assert.match(src, /SESSION COMPLETE/, "shows the SESSION COMPLETE eyebrow");
  assert.match(src, /\{sessionMode\}/, "renders the real mode label from props");
  assert.match(src, /just now/, "shows 'just now'");
  assert.match(src, /formatDuration\(sessionSeconds\)/, "renders M:SS from sessionSeconds");
  assert.match(src, /Keep tonight(&apos;|')s calm\./, "literal headline 'Keep tonight's calm.'");
  assert.match(src, /this session lives on this device only/, "loss-aversion body copy");
  assert.match(src, /Continue with Google/, "Google primary CTA");
  assert.match(src, /One tap\. No password\./, "Google subtitle");
  assert.match(src, /or save with email/, "email expand label");
  assert.match(src, />\s*Not now\s*</, "Not now dismiss");
  // honest-by-construction: none of the simulated social-proof from Prompt B
  assert.doesNotMatch(src, /breathing right now/, "must not carry the fake live count");
  assert.doesNotMatch(src, /Day streak/, "must not carry the fake streak");
});

test("session-complete-prompt routes loss_aversion to the new sheet with real session props", () => {
  const src = read(PROMPT);
  assert.match(src, /activeMode:\s*ModeName/, "adds activeMode: ModeName to the props");
  assert.match(
    src,
    /variant === "loss_aversion"/,
    "branches on the loss_aversion variant"
  );
  assert.match(
    src,
    /<LossAversionSignInSheet[\s\S]*?sessionMode=\{pattern\.name\}[\s\S]*?accentColor=\{pattern\.color\}[\s\S]*?sessionSeconds=\{sessionSeconds\}/,
    "passes the resolved mode label + accent color + sessionSeconds (no hardcoding)"
  );
});

test("Resonance passes activeMode down to SessionCompletePrompt", () => {
  const src = read(RESONANCE);
  const block = src.match(/<SessionCompletePrompt[\s\S]*?\/>/);
  assert.ok(block, "expected the SessionCompletePrompt render block");
  assert.match(block[0], /activeMode=\{activeMode\}/, "must thread activeMode through");
});

// ── Shipped non-blocking banner (loss_aversion_banner) ──────────────────────
const BANNER = path.join(ROOT, "src", "components", "auth", "non-blocking-sign-in-banner.tsx");

test("session-complete-prompt routes loss_aversion_banner to the NonBlockingSignInBanner", () => {
  const src = read(PROMPT);
  assert.match(
    src,
    /import \{\s*NonBlockingSignInBanner/,
    "imports the NonBlockingSignInBanner"
  );
  assert.match(
    src,
    /variant === "loss_aversion_banner"/,
    "branches on the loss_aversion_banner variant"
  );
  assert.match(
    src,
    /<NonBlockingSignInBanner[\s\S]*?sessionMode=\{pattern\.name\}[\s\S]*?accentColor=\{pattern\.color\}/,
    "renders the banner with the resolved mode label + accent color"
  );
});

test("non-blocking banner tags signin_* events with surface: banner", () => {
  const src = read(BANNER);
  for (const evt of ["signin_prompt_view", "signin_google_clicked", "signin_magic_link_sent"]) {
    assert.match(
      src,
      new RegExp(`trackEvent\\(\\s*"${evt}"[\\s\\S]*?surface:\\s*"banner"`),
      `${evt} should fire tagged surface: "banner"`
    );
  }
});

test("non-blocking banner hides on play via the resonance:run-state event", () => {
  const src = read(BANNER);
  assert.match(src, /resonance:run-state/, "listens to the orb's run-state event");
  assert.match(src, /setHiddenByPlay\(true\)/, "tucks away when a session starts (disappears on play)");
});
