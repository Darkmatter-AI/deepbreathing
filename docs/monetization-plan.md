# Monetization Plan — Deep Breathing Exercises

_Last updated: 2026-06-21_

---

## 1. Overview

Two billing surfaces, one entitlement source of truth:

| Surface | Platform | Provider |
|---------|----------|----------|
| iOS app (WKWebView) | Apple App Store | RevenueCat |
| Web (future) | Browser | Stripe |

`GET /api/v1/entitlements` is the authoritative resolver. Every client — the iOS webview and any future native or web client — calls this endpoint to learn what the user can do. A user who buys on either platform is Pro everywhere.

---

## 2. Capability Split

Capability keys are defined in `packages/access-control/src/index.ts` as `CapabilityKey` and mapped per-plan in `PLAN_CAPABILITIES`.

### Free (all authenticated users, no subscription required)

| Capability key | What it unlocks |
|---|---|
| `history.basic` | Session history (last 7–14 sessions) |

Free users also have unrestricted access to the full visualizer, all standard breathing modes (box, 4-7-8, coherent breathing, physiological sigh, pursed lip, belly, Buteyko), and all phase cues. These are not gated by a capability key — they are always available.

### Pro (active subscriber)

| Capability key | What it unlocks |
|---|---|
| `history.basic` | (inherited from free) |
| `history.advanced` | Full session history, trends, streaks, export |
| `audio.extra_soundscapes` | Premium soundscapes + binaural beat presets |
| `protocols.advanced` | Wim Hof, Tummo, Nadi Shodhana, Ujjayi, Breath of Fire + custom protocols |
| `insights.trends` | Breathing quality score, HRV trend proxy, weekly/monthly analytics |
| `export.pdf` | PDF session report export (shareable, printable) |
| `reminders.cross_device` | Smart reminders that sync across devices |
| `routines.advanced` | Saved multi-step routines, scheduling, alarm integration |

### Guest (no session)

Guests receive `capabilities: []` — an empty list. The app should prompt sign-up before any capability check can pass. Guests can use the core visualizer and basic modes freely; history and any capability-gated feature prompts sign-up.

> Implementation detail: `EntitlementSnapshot.plan` has no "guest" variant (only `"free" | "pro"`). Guests receive `plan: "free"` with empty capabilities. `getFeatureAccess()` gates guests via the `UserState = "guest"` path, independently of the capability list.

---

## 3. Billing Mechanics

### RevenueCat (iOS App Store)

1. User taps "Go Pro" in the iOS app.
2. StoreKit purchase flow completes through RevenueCat's SDK.
3. RevenueCat fires a webhook to our server (endpoint TBD, e.g. `POST /api/webhooks/revenuecat`).
4. Webhook handler verifies the payload, identifies the user (by `app_user_id` = our `userId`), and upserts into `user_entitlements`:

   ```sql
   INSERT INTO user_entitlements (user_id, provider, status, expires_at, updated_at)
   VALUES ($1, 'apple', 'active', $2, now())
   ON CONFLICT (user_id, provider) DO UPDATE SET
     status = EXCLUDED.status,
     expires_at = EXCLUDED.expires_at,
     updated_at = now();
   ```

5. Next call to `GET /api/v1/entitlements` returns `plan: "pro"` with all pro capabilities.
6. The iOS WKWebView refreshes the entitlement (on app foreground / route focus) and unlocks Pro features.

### Stripe (Web — future)

Same flow, different provider:

1. User clicks "Go Pro" on the web paywall.
2. Stripe Checkout session created server-side, user redirected.
3. `checkout.session.completed` webhook fires.
4. Handler upserts `user_entitlements` with `provider: 'web'`.
5. `GET /api/v1/entitlements` returns pro — works on both web and the iOS app immediately.

### Cross-platform reconciliation

A user is Pro if **any** row in `user_entitlements` has `status = 'active' AND expires_at > now()`. Provider does not matter. A web subscriber who opens the iOS app gets Pro without paying twice.

```
RevenueCat webhook ─┐
                    ├──▶ user_entitlements table ──▶ GET /api/v1/entitlements ──▶ capabilities
Stripe webhook ─────┘
```

### Grace period

When a subscription lapses (webhook fires `status: 'grace'`), keep the user on Pro for a grace window (recommend 24–72h) so billing retries don't immediately lock them out. After grace: `status: 'lapsed'`, `getFeatureAccess()` returns `authenticated_lapsed` which gates all pro features.

---

## 4. Pricing (DIRECTIONAL — data ~Jan 2026)

| Plan | Price | Notes |
|------|-------|-------|
| Monthly | **$6.99 / mo** | Lowest friction entry point |
| Annual | **$39.99 / yr** (~$3.33/mo) | Primary anchor; 52% discount vs monthly |
| Lifetime | **$79.99** (one-time) | Optional; ~2yr payback; high LTV, no churn |

**Trial:** 7-day free trial on Annual only. Trials convert best on the plan users intend to stay on; monthly trials create churners.

### Competitive positioning

| App | Annual price | Notes |
|-----|-------------|-------|
| Calm | ~$70/yr | General wellness, high brand awareness |
| Breathwrk | ~$50/yr | Breathing-specific, closest comp |
| Othership | ~$60/yr | Guided breathwork, community focus |
| **Deep Breathing Exercises** | **$39.99/yr** | Focused, no fluff, <Calm and Breathwrk |

Positioning: simpler and more focused than Calm, cheaper than Breathwrk, strong SEO top-of-funnel.

### Apple's cut

- Year 1: 30% (Apple keeps $12.00 of the $39.99 annual)
- Year 2+: 15% (Small Business Program, if eligible; keep at <$1M revenue)
- Net annual on year 1: ~$28.00; year 2+: ~$34.00

**Anti-steering rule (App Store guideline 3.1.1):** We cannot show web checkout pricing or link to web checkout from within the iOS app. The web Stripe paywall must only be promoted on the website, emails, and marketing outside the app binary.

---

## 5. RevenueCat Product Identifiers

Enter these in App Store Connect (Subscriptions) and mirror them in RevenueCat Dashboard.

| Product | Identifier | Type |
|---------|-----------|------|
| Pro Monthly | `com.deepbreathing.app.pro.monthly` | Auto-renewable subscription |
| Pro Annual | `com.deepbreathing.app.pro.annual` | Auto-renewable subscription (7-day trial) |
| Pro Lifetime | `com.deepbreathing.app.pro.lifetime` | Non-consumable in-app purchase |

**Entitlement identifier in RevenueCat:** `pro`

**Offering identifier:** `default`

**App User ID strategy:** pass our internal `userId` (Better Auth UUID) as the RevenueCat App User ID on SDK initialization. This links RevenueCat purchases directly to our user records without an extra lookup.

```typescript
// Purchases.configure({ apiKey: RC_PUBLIC_KEY, appUserID: session.user.id });
```

---

## 6. Schema — user_entitlements (to create)

```sql
CREATE TABLE user_entitlements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('apple', 'google', 'web')),
  provider_sub_id TEXT,                       -- RevenueCat original_transaction_id or Stripe subscription_id
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'grace', 'lapsed', 'cancelled')),
  expires_at    TIMESTAMPTZ,                  -- NULL for lifetime purchases
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_entitlements_user_id ON user_entitlements (user_id);
```

---

## 7. Implementation Checklist

- [x] `packages/access-control` — capability matrix + `resolveEntitlement()` pure resolver
- [x] `packages/access-control/src/resolve-entitlement.test.ts` — 6 tests, all passing
- [x] `GET /api/v1/entitlements` route — reads session, returns snapshot
- [ ] Add `@resonance/*` packages to root `package.json` + `transpilePackages` in `next.config.js`, then `pnpm install`
- [ ] RevenueCat account setup + App Store Connect products entered
- [ ] `POST /api/webhooks/revenuecat` — webhook handler + `user_entitlements` upsert
- [ ] `user_entitlements` DB migration (SQL above)
- [ ] iOS SDK: configure RevenueCat with `appUserID = session.user.id`
- [ ] Web paywall UI (Stripe Checkout session endpoint)
- [ ] `POST /api/webhooks/stripe` — Stripe webhook handler
- [ ] Replace `plan: "free" as const` hardcode in entitlements route with real DB lookup
