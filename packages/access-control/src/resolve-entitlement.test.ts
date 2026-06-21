/**
 * Tests for the pure entitlement resolver.
 *
 * Run from the repo root:
 *   cd packages/access-control && node --require sucrase/register/ts src/resolve-entitlement.test.ts
 *   OR (shorter):
 *   cd packages/access-control && ../../node_modules/.bin/sucrase-node src/resolve-entitlement.test.ts
 *
 * Uses Node.js built-in test runner (node:test) — no additional test framework needed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveEntitlement } from "./resolve-entitlement";
import { PLAN_CAPABILITIES, getFeatureAccess } from "./index";

const FIXED_NOW = "2026-06-21T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Failing test — written first per TDD; implementation must satisfy it
// ---------------------------------------------------------------------------

test("guest: snapshot has plan=free, empty capabilities, userId=guest", () => {
  const result = resolveEntitlement({
    userId: null,
    plan: "free",
    effectiveAt: FIXED_NOW,
  });

  assert.equal(result.snapshot.plan, "free");
  assert.deepEqual(result.snapshot.capabilities, []);
  assert.equal(result.snapshot.userId, "guest");
  assert.equal(result.snapshot.effectiveAt, FIXED_NOW);
  assert.equal(result.snapshot.expiresAt, null);
  assert.equal(result.userState, "guest");
});

test("authenticated free: snapshot has plan=free, capabilities matching PLAN_CAPABILITIES.free", () => {
  const result = resolveEntitlement({
    userId: "user-abc",
    plan: "free",
    effectiveAt: FIXED_NOW,
  });

  assert.equal(result.snapshot.plan, "free");
  assert.equal(result.snapshot.userId, "user-abc");
  assert.deepEqual(result.snapshot.capabilities, PLAN_CAPABILITIES.free);
  assert.ok(result.snapshot.capabilities.includes("history.basic"));
  assert.equal(result.userState, "authenticated_free");
});

test("authenticated pro: snapshot has plan=pro, all pro capabilities", () => {
  const result = resolveEntitlement({
    userId: "user-pro-123",
    plan: "pro",
    effectiveAt: FIXED_NOW,
  });

  assert.equal(result.snapshot.plan, "pro");
  assert.equal(result.snapshot.userId, "user-pro-123");
  assert.deepEqual(result.snapshot.capabilities, PLAN_CAPABILITIES.pro);

  // Spot-check pro-only capabilities
  assert.ok(result.snapshot.capabilities.includes("audio.extra_soundscapes"));
  assert.ok(result.snapshot.capabilities.includes("protocols.advanced"));
  assert.ok(result.snapshot.capabilities.includes("insights.trends"));
  assert.ok(result.snapshot.capabilities.includes("export.pdf"));
  assert.ok(result.snapshot.capabilities.includes("reminders.cross_device"));
  assert.ok(result.snapshot.capabilities.includes("routines.advanced"));
  assert.equal(result.userState, "authenticated_pro");
});

test("guest capabilities are a strict subset of free member capabilities (guest is more restricted)", () => {
  const guestResult = resolveEntitlement({
    userId: null,
    plan: "free",
    effectiveAt: FIXED_NOW,
  });
  const freeResult = resolveEntitlement({
    userId: "user-free",
    plan: "free",
    effectiveAt: FIXED_NOW,
  });

  // Guest has NO capabilities; free has at least history.basic
  assert.equal(guestResult.snapshot.capabilities.length, 0);
  assert.ok(freeResult.snapshot.capabilities.length > 0);
});

test("free plan does NOT include pro-only capabilities", () => {
  const result = resolveEntitlement({
    userId: "user-free-2",
    plan: "free",
    effectiveAt: FIXED_NOW,
  });

  const proOnlyKeys = [
    "audio.extra_soundscapes",
    "protocols.advanced",
    "insights.trends",
    "export.pdf",
    "reminders.cross_device",
    "routines.advanced",
    "history.advanced",
  ] as const;

  for (const key of proOnlyKeys) {
    assert.ok(
      !result.snapshot.capabilities.includes(key),
      `free plan should not include ${key}`
    );
  }
});

test("effectiveAt is preserved verbatim in the snapshot", () => {
  const ts = "2025-01-15T12:30:00.000Z";
  const result = resolveEntitlement({
    userId: "user-ts",
    plan: "free",
    effectiveAt: ts,
  });
  assert.equal(result.snapshot.effectiveAt, ts);
});

// ---------------------------------------------------------------------------
// getFeatureAccess — verify it works end-to-end with resolver output
// These tests give @resonance/access-control its first real integration consumer.
// ---------------------------------------------------------------------------

test("getFeatureAccess: guest is blocked from basic_history", () => {
  const { userState, snapshot } = resolveEntitlement({
    userId: null,
    plan: "free",
    effectiveAt: FIXED_NOW,
  });
  const access = getFeatureAccess(userState, snapshot.capabilities, "basic_history");
  assert.equal(access.allowed, false);
  assert.equal(access.reason, "guest");
});

test("getFeatureAccess: authenticated_free can access basic_history", () => {
  const { userState, snapshot } = resolveEntitlement({
    userId: "user-free",
    plan: "free",
    effectiveAt: FIXED_NOW,
  });
  const access = getFeatureAccess(userState, snapshot.capabilities, "basic_history");
  assert.equal(access.allowed, true);
  assert.equal(access.reason, "ok");
});

test("getFeatureAccess: authenticated_free is blocked from advanced_history", () => {
  const { userState, snapshot } = resolveEntitlement({
    userId: "user-free",
    plan: "free",
    effectiveAt: FIXED_NOW,
  });
  const access = getFeatureAccess(userState, snapshot.capabilities, "advanced_history");
  assert.equal(access.allowed, false);
  assert.equal(access.reason, "missing_capability");
});

test("getFeatureAccess: authenticated_pro can access advanced_history", () => {
  const { userState, snapshot } = resolveEntitlement({
    userId: "user-pro",
    plan: "pro",
    effectiveAt: FIXED_NOW,
  });
  const access = getFeatureAccess(userState, snapshot.capabilities, "advanced_history");
  assert.equal(access.allowed, true);
  assert.equal(access.reason, "ok");
});

test("getFeatureAccess: authenticated_pro can access all pro-only features", () => {
  const { userState, snapshot } = resolveEntitlement({
    userId: "user-pro",
    plan: "pro",
    effectiveAt: FIXED_NOW,
  });
  const proFeatures = [
    "advanced_history",
    "advanced_protocols",
    "extra_soundscapes",
    "insights_trends",
    "pdf_export",
    "cross_device_reminders",
    "advanced_routines",
  ] as const;
  for (const feature of proFeatures) {
    const access = getFeatureAccess(userState, snapshot.capabilities, feature);
    assert.equal(access.allowed, true, `pro user should have access to ${feature}`);
  }
});
