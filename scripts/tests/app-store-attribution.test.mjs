import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_STORE_URL,
  createAppleCampaignToken,
  createAppStoreAnalyticsParams,
  createAppStoreDestination,
} from "../../src/lib/app-store-attribution.ts";

test("captures allowlisted campaign context without copying arbitrary values", () => {
  const currentUrl = new URL(
    "https://deepbreathingexercises.com/breathe/box?utm_source=newsletter&utm_campaign=launch&gclid=private-click-id&email=person%40example.com",
  );
  const params = createAppStoreAnalyticsParams({
    currentUrl,
    destination: APP_STORE_URL,
    variant: "strip",
  });

  assert.equal(params.origin_path, "/breathe/box");
  assert.equal(params.app_store_placement, "strip");
  assert.equal(params.utm_source, "newsletter");
  assert.equal(params.utm_campaign, "launch");
  assert.equal(params.has_gclid, true);
  assert.equal("gclid" in params, false);
  assert.equal("email" in params, false);
});

test("keeps the normal App Store URL until a provider token is configured", () => {
  const currentUrl = new URL("https://deepbreathingexercises.com/");

  assert.equal(createAppStoreDestination({ currentUrl }), APP_STORE_URL);
  assert.equal(
    createAppStoreDestination({ currentUrl, providerToken: "not-a-token" }),
    APP_STORE_URL,
  );
});

test("builds a valid page-specific Apple campaign link with a provider token", () => {
  const currentUrl = new URL(
    "https://deepbreathingexercises.com/box-breathing-before-presentation",
  );
  const destination = new URL(
    createAppStoreDestination({ currentUrl, providerToken: "123456" }),
  );
  const campaignToken = destination.searchParams.get("ct");

  assert.equal(destination.searchParams.get("pt"), "123456");
  assert.equal(destination.searchParams.get("mt"), "8");
  assert.equal(campaignToken, createAppleCampaignToken(currentUrl.pathname));
  assert.ok(campaignToken);
  assert.ok(campaignToken.length <= 30);
});
