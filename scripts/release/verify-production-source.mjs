#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const MAIN_REF = "main";
const MAIN_REMOTE = "https://github.com/Darkmatter-AI/deepbreathing.git";
const SHA_PATTERN = /^[0-9a-f]{40}$/i;

export function isProductionEnvironment(env) {
  return env.VERCEL_ENV === "production" || env.VERCEL_TARGET_ENV === "production";
}

export function validateProductionMetadata(env, remoteMainSha) {
  if (!isProductionEnvironment(env)) return [];

  const failures = [];
  const ref = env.VERCEL_GIT_COMMIT_REF;
  const sha = env.VERCEL_GIT_COMMIT_SHA;

  if (ref !== MAIN_REF) {
    failures.push(`production deployments must come from ${MAIN_REF}; received ${ref || "(missing)"}`);
  }
  if (!SHA_PATTERN.test(sha || "")) {
    failures.push("production deployments require a valid VERCEL_GIT_COMMIT_SHA");
  }
  if (!SHA_PATTERN.test(remoteMainSha || "")) {
    failures.push("could not resolve the current GitHub main SHA");
  } else if (SHA_PATTERN.test(sha || "") && sha.toLowerCase() !== remoteMainSha.toLowerCase()) {
    failures.push(`deployment SHA ${sha} does not match GitHub main ${remoteMainSha}`);
  }

  return failures;
}

export async function resolveRemoteMainSha() {
  const { stdout } = await execFileAsync(
    "git",
    ["ls-remote", "--exit-code", MAIN_REMOTE, `refs/heads/${MAIN_REF}`],
    { encoding: "utf8", timeout: 20_000 }
  );
  return stdout.trim().split(/\s+/)[0] || "";
}

export async function main(env = process.env) {
  if (!isProductionEnvironment(env)) {
    console.log("Production source guard: SKIP (non-production environment)");
    return;
  }

  let remoteMainSha = "";
  try {
    remoteMainSha = await resolveRemoteMainSha();
  } catch (error) {
    console.error(`Production source guard: remote lookup failed (${error.message})`);
  }

  const failures = validateProductionMetadata(env, remoteMainSha);
  if (failures.length > 0) {
    console.error("Production source guard: FAIL");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Production source guard: PASS (${MAIN_REF}@${remoteMainSha})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
