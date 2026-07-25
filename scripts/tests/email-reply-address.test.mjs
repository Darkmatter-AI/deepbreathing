import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveMx } from "node:dns/promises";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/**
 * Domains confirmed to ACCEPT INBOUND mail (MX records present, real mailbox behind them).
 * Anything we ask a user to reply to must be on this list.
 * Run `pnpm run check:email-dns` before adding an entry.
 */
const RECEIVING_DOMAINS = ["abiassi.com"];

/**
 * Domains that can SEND (verified in Resend) but CANNOT RECEIVE.
 *
 * deepbreathingexercises.com has no MX record on the apex — Resend uses a custom
 * MAIL FROM on the `send.` subdomain, and the apex itself never got MX records.
 * Mail addressed to abi@ / noreply@ there falls back to the A record per RFC 5321,
 * finds port 25 closed on Vercel, and bounces back to the sender.
 *
 * This silently ate every user reply to the welcome email from 2026-03-16 (when the
 * email shipped with `replyTo: abi@deepbreathingexercises.com`) until 2026-07-25.
 * The email said "Hit reply, it goes straight to me" the entire time. It did not.
 */
const SEND_ONLY_DOMAINS = ["deepbreathingexercises.com"];

/** Copy that promises a human will read a reply. Requires a working replyTo. */
const INVITES_REPLY = /hit reply|just reply|reply to this|goes straight to me/i;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Every file under src/ that calls resend.emails.send(). */
function senderFiles() {
  return walk(SRC).filter((f) => /emails\.send\(/.test(fs.readFileSync(f, "utf8")));
}

/**
 * Extract each `emails.send({ ... })` argument block by brace matching, so body copy
 * stays paired with the replyTo of the same message.
 */
function sendCalls(src) {
  const calls = [];
  const marker = /emails\.send\(\s*\{/g;
  let m;
  while ((m = marker.exec(src))) {
    const start = src.indexOf("{", m.index + m[0].length - 1);
    let depth = 0;
    for (let i = start; i < src.length; i += 1) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          calls.push(src.slice(start, i + 1));
          break;
        }
      }
    }
  }
  return calls;
}

const field = (block, name) => block.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1] ?? null;
const domainOf = (value) => value?.match(/<?([^\s<>@]+)@([^\s<>]+?)>?$/)?.[2] ?? null;

test("at least one file sends email, so this contract has something to guard", () => {
  const files = senderFiles();
  assert.ok(files.length > 0, "expected at least one emails.send() call under src/");
});

test("every replyTo points at a domain confirmed to receive mail", () => {
  for (const file of senderFiles()) {
    const rel = path.relative(ROOT, file);
    for (const block of sendCalls(fs.readFileSync(file, "utf8"))) {
      const replyTo = field(block, "replyTo");
      if (!replyTo) continue;
      const domain = domainOf(replyTo);
      assert.ok(domain, `${rel}: could not parse a domain out of replyTo "${replyTo}"`);
      assert.ok(
        RECEIVING_DOMAINS.includes(domain),
        `${rel}: replyTo "${replyTo}" uses domain "${domain}", which is not a confirmed ` +
          `receiving domain (${RECEIVING_DOMAINS.join(", ")}). Verify MX with ` +
          `\`pnpm run check:email-dns\` and add it to RECEIVING_DOMAINS before shipping.`
      );
    }
  }
});

test("no replyTo uses a send-only domain that cannot receive mail", () => {
  for (const file of senderFiles()) {
    const rel = path.relative(ROOT, file);
    for (const block of sendCalls(fs.readFileSync(file, "utf8"))) {
      const replyTo = field(block, "replyTo");
      if (!replyTo) continue;
      const domain = domainOf(replyTo);
      assert.ok(
        !SEND_ONLY_DOMAINS.includes(domain),
        `${rel}: replyTo "${replyTo}" is on send-only domain "${domain}". It has no MX ` +
          `record, so replies bounce back to the user and never reach anyone.`
      );
    }
  }
});

test("any email whose copy invites a reply sets a replyTo", () => {
  for (const file of senderFiles()) {
    const rel = path.relative(ROOT, file);
    for (const block of sendCalls(fs.readFileSync(file, "utf8"))) {
      if (!INVITES_REPLY.test(block)) continue;
      const subject = field(block, "subject") ?? "(unknown subject)";
      const replyTo = field(block, "replyTo");
      assert.ok(
        replyTo,
        `${rel}: email "${subject}" invites the user to reply but sets no replyTo, so ` +
          `replies go to the From address. Set an explicit replyTo on a receiving domain.`
      );
    }
  }
});

test(
  "confirmed receiving domains really have MX records",
  { skip: process.env.CHECK_EMAIL_DNS ? false : "set CHECK_EMAIL_DNS=1 (needs network)" },
  async () => {
    for (const domain of RECEIVING_DOMAINS) {
      let records;
      try {
        records = await resolveMx(domain);
      } catch (err) {
        assert.fail(
          `${domain}: MX lookup failed (${err.code ?? err.message}). A reply address on ` +
            `this domain cannot receive mail.`
        );
      }
      assert.ok(
        records.length > 0,
        `${domain}: no MX records, so mail to this domain bounces back to the sender.`
      );
    }
  }
);

test(
  "send-only domains still have no MX, confirming the constraint is real",
  { skip: process.env.CHECK_EMAIL_DNS ? false : "set CHECK_EMAIL_DNS=1 (needs network)" },
  async () => {
    for (const domain of SEND_ONLY_DOMAINS) {
      let records = [];
      try {
        records = await resolveMx(domain);
      } catch {
        // ENODATA / ENOTFOUND is the expected outcome — no MX.
      }
      if (records.length > 0) {
        console.log(
          `[note] ${domain} now has MX records (${records
            .map((r) => r.exchange)
            .join(", ")}). If a real mailbox exists behind them, move it from ` +
            `SEND_ONLY_DOMAINS to RECEIVING_DOMAINS.`
        );
      }
    }
  }
);
