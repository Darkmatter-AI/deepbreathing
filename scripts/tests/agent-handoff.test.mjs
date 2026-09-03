import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { AGENT_RECOMMENDATIONS } from "../../src/data/agent-recommendations.ts";
import {
  AGENT_HANDOFF_DEFAULTS,
  buildAgentReferralHref,
  readAgentReferralParams,
  resolveAgentHandoffSessionId,
} from "../../src/lib/agent-referral.ts";
import {
  DEFAULT_EXCLUDED_ROUTES,
  discoverPageRoutes,
} from "../../src/lib/seo/sitemap-routes.mjs";

const ROOT = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("recommendation catalog is small, safe, complete, and points to real canonical routes", () => {
  assert.ok(AGENT_RECOMMENDATIONS.length > 0);
  assert.ok(AGENT_RECOMMENDATIONS.length < 8);
  assert.equal(
    new Set(AGENT_RECOMMENDATIONS.map(({ intent }) => intent)).size,
    AGENT_RECOMMENDATIONS.length,
  );

  for (const recommendation of AGENT_RECOMMENDATIONS) {
    assert.match(recommendation.intent, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(recommendation.situation.length > 0);
    assert.ok(recommendation.exercise.length > 0);
    assert.ok(recommendation.duration.length > 0);
    assert.ok(recommendation.safetyNote.length > 0);
    assert.equal(recommendation.free, true);
    assert.equal(recommendation.requiresAccount, false);
    assert.equal(recommendation.requiresInstall, false);
    assert.doesNotMatch(recommendation.path, /[?#]/);
    assert.ok(
      fs.existsSync(path.join(ROOT, "src/app/(site-en)", recommendation.path, "page.tsx")),
      `missing canonical route ${recommendation.path}`,
    );
    assert.doesNotMatch(recommendation.exercise, /wim hof|tummo|breath of fire/i);
  }
});

test("llms.txt advertises the measurable handoff and no duration query URLs", () => {
  const llms = read("public/llms.txt");

  assert.match(
    llms,
    /\/recommend\?agent_handoff=assistant&utm_source=ai_assistant&utm_medium=referral&utm_campaign=recommendation_handoff/,
  );
  assert.doesNotMatch(llms, /\?duration=/);
  assert.match(llms, /No web account is required\./);
  assert.match(llms, /No installation is required\./);
  for (const locale of ["es", "pt", "fr", "de", "ja"]) {
    assert.match(llms, new RegExp(`https://deepbreathingexercises\\.com/${locale}`));
  }
});

test("homepage exposes one ordinary llms.txt anchor", () => {
  const homepage = read("src/app/(site-en)/home-page.tsx");
  const anchors = homepage.match(/href="\/llms\.txt"/g) ?? [];

  assert.equal(anchors.length, 1);
  assert.doesNotMatch(homepage, /href=\{href\("\/llms\.txt"\)\}/);
  assert.doesNotMatch(homepage, /href="\/llms\.txt"[^>]*rel="[^"]*nofollow/);
});

test("referral helper preserves only closed attribution values", () => {
  const params = readAgentReferralParams({
    agent_handoff: "assistant",
    utm_source: "claude",
    utm_medium: "referral",
    utm_campaign: "recommendation_handoff",
    email: "person@example.com",
    name: "A Person",
    arbitrary: "keep-me-out",
  });

  assert.deepEqual(Object.fromEntries(params), {
    agent_handoff: "assistant",
    utm_source: "claude",
    utm_medium: "referral",
    utm_campaign: "recommendation_handoff",
  });
});

test("plain human and invalid /recommend landings produce untagged exercise links", () => {
  for (const recommendSearchParams of [
    {},
    { utm_source: "claude" },
    { agent_handoff: "not-assistant" },
    { agent_handoff: ["not-assistant", "assistant"] },
    { agent_handoff: ["assistant", "not-assistant"] },
  ]) {
    assert.equal(readAgentReferralParams(recommendSearchParams).size, 0);
    assert.equal(
      buildAgentReferralHref("/breathe/box", recommendSearchParams),
      "/breathe/box",
    );
  }
});

test("valid assistant handoffs get bounded defaults for missing or rejected UTM values", () => {
  assert.deepEqual(
    Object.fromEntries(readAgentReferralParams({ agent_handoff: "assistant" })),
    AGENT_HANDOFF_DEFAULTS,
  );
  assert.deepEqual(
    Object.fromEntries(readAgentReferralParams({
      agent_handoff: "assistant",
      utm_source: "person@example.com",
      utm_medium: "email",
      utm_campaign: "private-person-name",
    })),
    AGENT_HANDOFF_DEFAULTS,
  );
});

test("referral helper emits stable links and rejects non-plain internal paths", () => {
  const first = buildAgentReferralHref("/breathe/box", {
    agent_handoff: "assistant",
  });
  const second = buildAgentReferralHref("/breathe/box", {
    agent_handoff: "assistant",
  });

  assert.equal(first, second);
  assert.equal(
    first,
    "/breathe/box?agent_handoff=assistant&utm_source=ai_assistant&utm_medium=referral&utm_campaign=recommendation_handoff",
  );
  assert.doesNotMatch(first, /duration=/);
  assert.throws(() => buildAgentReferralHref("https://example.com", {}));
  assert.throws(() => buildAgentReferralHref("//example.com", {}));
  assert.throws(() => buildAgentReferralHref("/breathe/box?duration=120", {}));
  assert.throws(() => buildAgentReferralHref("/breathe/box#start", {}));
});

test("handoff session IDs dedupe across tabs without suppressing later GA4 sessions", () => {
  assert.equal(
    resolveAgentHandoffSessionId({
      storedSessionId: null,
      currentSessionId: 123,
    }),
    "123",
  );
  assert.equal(
    resolveAgentHandoffSessionId({
      storedSessionId: "123",
      currentSessionId: "123",
    }),
    null,
  );
  assert.equal(
    resolveAgentHandoffSessionId({
      storedSessionId: "123",
      currentSessionId: "456",
    }),
    "456",
  );

  for (const invalidSessionId of [
    null,
    undefined,
    "",
    "0",
    -1,
    1.5,
    Number.NaN,
  ]) {
    assert.equal(
      resolveAgentHandoffSessionId({
        storedSessionId: null,
        currentSessionId: invalidSessionId,
      }),
      null,
    );
  }
});

test("tracker keeps the production, marker, route, event-field, and GA-session contract", () => {
  const tracker = read("src/components/analytics/AgentHandoffLandingTracker.tsx");

  assert.match(tracker, /pathname === "\/recommend"/);
  assert.match(tracker, /PRODUCTION_HOSTNAMES\.has\(hostname\)/);
  assert.match(tracker, /marker === "assistant"/);
  assert.match(
    tracker,
    /gtag\("get", GOOGLE_ANALYTICS_MEASUREMENT_ID, "session_id"/,
  );
  assert.match(tracker, /localStorage\.getItem\(TRACKED_SESSION_KEY\)/);
  assert.match(
    tracker,
    /localStorage\.setItem\(TRACKED_SESSION_KEY, sessionIdToTrack\)/,
  );
  assert.doesNotMatch(tracker, /sessionStorage/);
  assert.equal(
    (tracker.match(/gtag\("event", "agent_handoff_landing"/g) ?? []).length,
    1,
  );
  assert.match(tracker, /handoff_agent: "assistant"/);
  assert.match(tracker, /handoff_surface: "recommend"/);
  assert.doesNotMatch(tracker, /page_view/);
});

test("recommend page is noindex-follow, canonical, complete, and tracked only there", () => {
  const page = read("src/app/(site-en)/recommend/page.tsx");

  assert.match(page, /canonical: "\/recommend"/);
  assert.match(page, /index: false/);
  assert.match(page, /follow: true/);
  assert.match(page, /<AgentHandoffLandingTracker \/>/);
  assert.match(page, /AGENT_RECOMMENDATIONS\.map/);
  assert.match(page, /recommendation\.situation/);
  assert.match(page, /recommendation\.exercise/);
  assert.match(page, /recommendation\.duration/);
  assert.match(page, /recommendation\.safetyNote/);
  assert.match(page, /buildAgentReferralHref\(recommendation\.path, referralSearchParams\)/);
});

test("recommend is excluded from sitemap discovery without changing locale publication", () => {
  assert.ok(DEFAULT_EXCLUDED_ROUTES.includes("/recommend"));
  assert.equal(
    discoverPageRoutes(path.join(ROOT, "src/app"), DEFAULT_EXCLUDED_ROUTES).includes("/recommend"),
    false,
  );
});
