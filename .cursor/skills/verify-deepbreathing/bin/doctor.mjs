#!/usr/bin/env node
/**
 * Doctor: verify the dev server we launched is healthy and owned by this checkout.
 * - Confirms PID from run/dev.pid exists
 * - Confirms GET / on http://localhost:PORT returns <500
 * - Confirms /proc/$PID/cmdline includes "next" and "dev"
 *
 * Prints:
 *   pid:<PID>
 *   port:<PORT>
 *   http:<STATUS_CODE>
 */
import fs from "node:fs/promises";
import http from "node:http";

const SKILL_DIR = ".cursor/skills/verify-deepbreathing";
const RUN_DIR = `${SKILL_DIR}/run`;
const PID_FILE = `${RUN_DIR}/dev.pid`;
const PORT = Number(process.env.PORT || process.env.VERIFY_DB_PORT || 4317);

async function httpStatus(path = "/") {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}${path}`, (res) => {
      resolve(res.statusCode || 0);
      res.resume(); // drain
    });
    req.on("error", reject);
  });
}

async function main() {
  const pidText = await fs.readFile(PID_FILE, "utf8").catch(() => "");
  const pid = Number(pidText.trim());
  if (!pid) {
    console.error("No PID found; server not launched");
    process.exit(1);
  }
  let cmdline = "";
  try {
    cmdline = await fs.readFile(`/proc/${pid}/cmdline`, "utf8");
  } catch {
    console.error(`Process ${pid} not found`);
    process.exit(1);
  }
  const okOwner = /next[\s\S]*?dev/.test(cmdline);
  if (!okOwner) {
    console.error(`PID ${pid} is not a Next dev server`);
    process.exit(1);
  }
  let status = 0;
  try {
    status = (await httpStatus("/")) || 0;
  } catch (err) {
    console.error("HTTP check failed:", err?.message || String(err));
    process.exit(1);
  }
  if (status >= 500 || status === 0) {
    console.error(`Unhealthy HTTP status: ${status}`);
    process.exit(1);
  }
  console.log(`pid:${pid}`);
  console.log(`port:${PORT}`);
  console.log(`http:${status}`);
}

await main();
