#!/usr/bin/env node

/**
 * Validate the checked-in iOS release contract without touching EAS or ASC.
 *
 * This is intentionally a local, deterministic check: it reads the release docs and EAS
 * configuration, then exits non-zero when the Build 18 hygiene decisions drift. It does not
 * build, upload, submit, release, or generate screenshot assets.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function section(source, heading, nextHeading = "\n## ") {
  const start = source.indexOf(heading);
  if (start < 0) return "";
  const bodyStart = start + heading.length;
  const end = source.indexOf(nextHeading, bodyStart);
  return source.slice(bodyStart, end < 0 ? source.length : end);
}

const [packageJsonText, mobilePackageJsonText, easJsonText, easIgnore, finalListing, namingHistory, checklist, healthAudit, screenshotScript, workflow] =
  await Promise.all([
    read("package.json"),
    read("apps/mobile/package.json"),
    read("apps/mobile/eas.json"),
    read(".easignore"),
    read("docs/appstore/listing-FINAL.md"),
    read("docs/appstore/listing.md"),
    read("docs/appstore/submission-checklist.md"),
    read("docs/appstore/health-claims-audit.md"),
    read("docs/appstore/screenshots/generate-current-marketing.mjs"),
    read(".github/workflows/ios-release-gate.yml"),
  ]);

const packageJson = JSON.parse(packageJsonText);
const mobilePackageJson = JSON.parse(mobilePackageJsonText);
const eas = JSON.parse(easJsonText);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const finalDescription = section(finalListing, "## Full Description (", "\n## Keywords");
const historyDescription = section(namingHistory, "## Full Description (", "\n## Keywords");
const finalScreenshots = section(finalListing, "## Screenshots", "\n---");

check(eas.cli?.requireCommit === true, "apps/mobile/eas.json must set cli.requireCommit=true");
check(eas.cli?.appVersionSource === "remote", "apps/mobile/eas.json must keep remote appVersionSource");
check(eas.build?.production?.autoIncrement === true, "production EAS profile must auto-increment");
check(packageJson.dependencies?.next === "15.5.23", "root Next.js must stay on the audited 15.5.23 release");
check(packageJson.dependencies?.["better-auth"] === "1.6.27", "root Better Auth must stay on the audited 1.6.27 release");
check(packageJson.dependencies?.["@better-auth/expo"] === "1.6.27", "root Better Auth Expo adapter must match 1.6.27");
check(mobilePackageJson.dependencies?.["better-auth"] === "1.6.27", "mobile Better Auth must stay on the audited 1.6.27 release");
check(mobilePackageJson.dependencies?.["@better-auth/expo"] === "1.6.27", "mobile Better Auth Expo adapter must match 1.6.27");
check(mobilePackageJson.dependencies?.["@expo/dom-webview"] === "~56.0.6", "mobile Expo DOM WebView must match SDK 56.0.6");

for (const pattern of [
  "**/.claude/worktrees/",
  "**/.codex/worktrees/",
  "**/.herdr/worktrees/",
  "**/.agents/worktrees/",
  "**/.worktrees/",
  "**/.git/worktrees/",
]) {
  check(easIgnore.includes(pattern), `.easignore is missing nested-worktree exclusion: ${pattern}`);
}

for (const [name, body] of [
  ["Build 18 listing description", finalDescription],
  ["historical listing description", historyDescription],
]) {
  check(!/open[- ]ended/i.test(body), `${name} still advertises an open-ended session`);
  check(!/\b30\s*(?:seconds?|s)\b/i.test(body), `${name} still advertises a 30-second duration`);
  check(!/\b1\s*,\s*2\s*,\s*5\s*,\s*or\s*10\s*minutes?/i.test(body), `${name} still has the obsolete 1/2/5/10 timer set`);
  check(/1, 3, 5, or 10 minute session/i.test(body), `${name} must state the 1/3/5/10 minute choices`);
  check(/does not diagnose, treat, or prevent/i.test(body), `${name} is missing the non-medical disclaimer`);
}

check(/provisional/i.test(finalScreenshots), "listing-FINAL must mark screenshots provisional");
check(/do not upload/i.test(finalScreenshots), "listing-FINAL must tell operators not to upload pre-gate screenshots");
check(/physical-device gate/i.test(finalScreenshots), "listing-FINAL must tie screenshots to the physical-device gate");
check(/1\/3\/5\/10/i.test(finalScreenshots), "listing-FINAL screenshot guidance must use 1/3/5/10 minute chips");

for (const required of [
  "Build 18 physical-device gate",
  "Rollback and observability decisions",
  "Support contact deployment (blocking)",
  "hi@abiassi.com",
  "currently deployed support page",
  "1, 3, 5, and 10 minutes",
]) {
  check(checklist.toLowerCase().includes(required.toLowerCase()), `submission checklist is missing: ${required}`);
}
check(/Build 17 is historical evidence\s*>?\s*only/i.test(checklist), "checklist must quarantine Build 17 evidence");
check(/do not upload or call them final/i.test(checklist), "checklist must block pre-gate screenshot uploads");
check(!/Build 17 uploaded through EAS Submit/i.test(checklist), "checklist must not present Build 17 as the current submission");

check(!/routinely approved/i.test(healthAudit), "health audit must not make an approval prediction");
check(/Individual results are not guaranteed/i.test(healthAudit), "health audit must state that results are not guaranteed");
check(/Wim Hof is excluded from the iOS mode library/i.test(healthAudit), "health audit must keep Wim Hof out of Build 18 scope");

check(/provisional marketing compositions/i.test(screenshotScript), "screenshot generator must identify provisional outputs");
check(/does not generate the final Build 18 screenshot set/i.test(screenshotScript), "screenshot generator must not claim final Build 18 output");

for (const command of [
  "pnpm audit --prod --audit-level critical",
  "pnpm test",
  "pnpm exec next build",
  "pnpm --filter mobile test",
  "pnpm --filter mobile exec tsc --noEmit",
  "pnpm --filter mobile lint",
  "expo-doctor@1.20.1",
]) {
  check(workflow.includes(command), `iOS release workflow is missing: ${command}`);
}
check(/node-version:\s*22\.22\.2/.test(workflow), "iOS release workflow must use the pinned Node 22.22.2 toolchain");

if (failures.length > 0) {
  console.error("iOS release hygiene: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("iOS release hygiene: PASS");
  console.log("- Build 18 copy, timer choices, screenshot hold, and health wording are consistent");
  console.log("- EAS clean-commit guard and nested-worktree exclusions are present");
  console.log("- CI commands cover tests, typecheck, lint, and pinned Expo Doctor");
  console.log("- No EAS/ASC/build/upload action was performed");
}
