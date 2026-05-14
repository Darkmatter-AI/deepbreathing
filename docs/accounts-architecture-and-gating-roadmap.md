# Accounts Architecture + Feature Gating Roadmap

Last updated: 2026-02-13

## Objective
- Design and ship account infrastructure before upsell behavior.
- Keep onboarding friction low (guest-first).
- Support a single user identity across web, iOS, and Android.
- Gate premium capabilities consistently across all clients.

## Product Principles
- Guest-first: no login wall on first use.
- Value-first: account prompts appear only after meaningful usage.
- Local-first runtime: sessions must run without network.
- Cloud-backed continuity: progress sync once account exists.
- Capability-based gating: feature checks use capabilities, not ad hoc plan strings.

## Scope by Phase

### Phase 0: Architecture Foundation (Now)
- Finalize domain model, API contract, and gating policy.
- Implement shared capability model and client guard helpers.
- Add auth/entitlement integration points only; no upsell prompts yet.

### Phase 1: Optional Accounts + Core Sync
- Guest sessions remain default.
- Optional sign-in and account creation.
- Sync core user data across devices.
- No paywall flow yet.

### Phase 2: Subscriptions + Premium Gating
- Add billing providers and entitlement sync.
- Enable premium capabilities behind unified policy checks.

### Phase 3: Optimization + Expansion
- Personalization, routines, reminders, and deeper analytics.
- Higher-touch premium experiences.

## User States
- `guest`: local-only identity (`guest_id`), no cloud sync.
- `authenticated_free`: account exists, free entitlement.
- `authenticated_pro`: account exists, active paid entitlement.
- `authenticated_lapsed`: account exists, paid entitlement expired.

## Commercial Model (Locked for v1)
- One paid tier only: `pro`.
- One free tier: `free`.
- No add-ons, bundles, or lifetime purchases in v1.
- Keep all gating and entitlement logic binary (`free` vs `pro`) for initial launch.

## Core Domain Model

### Identity
- `users`
  - `id`, `email`, `created_at`, `deleted_at`
- `user_identities`
  - `user_id`, `provider`, `provider_user_id`
- `guest_links`
  - `guest_id`, `user_id`, `linked_at`

### Progress + Preferences
- `user_settings`
  - mode, speed, duration, muted, haptics, keep_awake, theme
- `session_events`
  - `id`, `user_id|guest_id`, `started_at`, `ended_at`, `seconds`, `mode`, `completed`, `platform`
- `user_stats`
  - `total_minutes`, `sessions_completed`, `updated_at`

### Entitlements
- `subscriptions`
  - `user_id`, `provider`, `provider_customer_id`, `status`, `period_end`
- `entitlements`
  - `user_id`, `plan` (`free|pro`), `capabilities[]`, `effective_at`, `expires_at`

## Auth Architecture

### Recommendation
- Use a central auth service on the web backend (compatible with Better Auth style flows).
- Expose token/session endpoints consumable by both Next.js web and Expo mobile.
- Keep provider choice abstracted behind an `AuthAdapter` interface.

### Required Capabilities
- Email magic link (low-friction default).
- Optional social providers later.
- Session issuance and refresh.
- Account deletion endpoint.
- Guest-to-account merge endpoint.

### Client Storage
- Web: secure session cookie for browser auth.
- Mobile: short-lived access token + refresh token in secure storage.

## Sync Architecture (Local-First)

### Rules
- App runtime always reads local store first.
- Sync is async and retryable.
- Session execution never depends on live API calls.

### Merge Strategy
- Session events: append-only.
- Settings: last-write-wins with server timestamp.
- Stats: server recomputes from session events when conflicts occur.

### Sync Queue
- Write-ahead queue on client.
- Exponential backoff with jitter for retries.
- Idempotency key per mutation to avoid duplicates.

## Feature Gating Architecture

### Capability Model
- Define capability keys, for example:
  - `history.basic`
  - `history.advanced`
  - `audio.extra_soundscapes`
  - `protocols.advanced`
  - `insights.trends`
  - `export.pdf`

### Server Policy
- Server computes entitlements and returns canonical capabilities.
- Clients may cache capabilities but should treat server as source of truth.

### Client Guard Layer
- Create shared package: `packages/access-control`.
- Export:
  - `hasCapability(capabilities, key)`
  - `getFeatureAccess(userState, capabilities, featureKey)`
  - `featureMatrix`

### Why This Matters
- Prevents gating drift between web and mobile.
- Lets product evolve plans without changing feature code everywhere.

## Feature Flags (Day 1 Requirement)

### Flag Domains
- `auth.enabled`
- `sync.enabled`
- `entitlements.enabled`
- `premium.gating.enabled`
- `premium.paywall.enabled`

### Rules
- Flags are server-driven and cached client-side with short TTL.
- Default behavior when flag fetch fails: safe fallback to current local behavior.
- All new auth/sync/premium UI must be wrapped with explicit flags.

### Rollout
- Stage by platform (`web`, `ios`, `android`) and percentage rollout.
- Keep kill-switches for auth and paywall paths.

## Monorepo Implementation Plan

### New Shared Packages
- `packages/domain`
  - Shared types: `User`, `SessionEvent`, `Entitlement`, `Capability`.
- `packages/access-control`
  - Feature matrix and gating helpers.
- `packages/api-client`
  - Typed API calls for auth, sync, and entitlements.

### Web Integration
- Integrate auth/session in Next app routes.
- Add sync client for `resonance_stats` and session events currently stored in localStorage.
- Keep current breathing flow intact.

### Mobile Integration
- Integrate auth flow in Expo app.
- Migrate AsyncStorage stats/settings to synchronized model while preserving offline behavior.
- Reuse shared access-control package for UI gating.

## API Surface (Initial)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/merge-guest`
- `GET /api/me`
- `GET /api/entitlements`
- `POST /api/sync/session-events`
- `PUT /api/sync/settings`
- `GET /api/sync/bootstrap`
- `GET /api/feature-flags`

## Additional Design Defaults (Approved)
- Source of truth:
  - Server-authoritative: entitlements, canonical stats, account profile.
  - Client-authoritative until sync: in-session runtime state and pending queue.
- Entitlement reconciliation:
  - Most-recent verified store event wins.
  - Include a grace window before downgrade to `lapsed`.
- Identity linking:
  - One user per verified email.
  - Linking second provider to same email attaches to existing user.
- API versioning:
  - Start all new endpoints at `/api/v1/*`.
  - Keep additive schema changes backward compatible.
- Offline behavior:
  - Server timestamps resolve ordering/conflicts.
  - Client clock is never trusted for conflict arbitration.
- Deletion and portability:
  - Include account deletion and JSON data export in Phase 1 scope.
- Test matrix minimum:
  - guest merge, multi-device sync conflict, token refresh failure, entitlement downgrade, restore purchase.

## Security + Privacy
- Encrypt tokens at rest on mobile secure store.
- Use HttpOnly secure cookies for web sessions.
- Audit logs for auth events and entitlement changes.
- Data deletion workflow for account removal.
- Avoid storing sensitive health claims; keep data model minimal and transparent.

## Analytics Plan (Before Upsell)
- Track:
  - `session_start`, `session_stop`, `session_complete`
  - `auth_started`, `auth_completed`, `auth_failed`
  - `sync_success`, `sync_failed`
  - `entitlement_loaded`
- Build dashboards for:
  - Guest vs authenticated retention
  - Sync reliability
  - Auth funnel completion

## Premium Rollout Candidates (Post-Architecture)
- Advanced history and trends.
- Cross-device reminders/routines.
- Advanced protocol packs and soundscapes.
- Export/shareable reports.
- Personalized guided plans.

## Execution Checklist

### Phase 0 Checklist (Architecture First)
- [ ] Finalize capability matrix and plan-to-capability mapping.
- [ ] Finalize guest-to-account merge rules.
- [x] Create `packages/domain` types.
- [ ] Create `packages/access-control` helpers + tests.
- [x] Define API contracts and error model.
- [x] Define feature flag schema and rollout ownership.
- [ ] Add auth + entitlement integration interfaces in web and mobile.
- [ ] Add observability events for auth/sync/entitlements.

### Phase 1 Checklist (Optional Accounts + Sync)
- [ ] Implement auth endpoints and sessions.
- [ ] Implement bootstrap and sync endpoints.
- [ ] Implement mobile secure token handling.
- [ ] Implement guest merge endpoint + conflict tests.
- [ ] Add account settings surfaces in web + mobile.
- [ ] Run cross-platform QA scenarios.

### Phase 2 Checklist (Subscriptions + Gating)
- [ ] Integrate billing providers.
- [ ] Implement server entitlement resolver.
- [ ] Gate premium features via capability checks only.
- [ ] Add restore-purchase/reconcile paths.
- [ ] Add lapsed entitlement handling.

## Risks + Mitigations
- Gating drift across clients:
  - Mitigation: shared `access-control` package + contract tests.
- Data inconsistencies from offline writes:
  - Mitigation: idempotency keys + append-only session events.
- Auth complexity on mobile:
  - Mitigation: start with magic-link and one provider only.
- Incorrect stats trust:
  - Mitigation: server-side stat recomputation from session events.

## Current Codebase Alignment
- Web session start/stop hooks exist in:
  - `/Users/abi/Sites/deepbreathing/src/components/resonance/Resonance.tsx`
- Mobile session start/stop hooks exist in:
  - `/Users/abi/Sites/deepbreathing/apps/resonance-mobile-app/app/index.tsx`
- Shared breathing engine already exists in:
  - `/Users/abi/Sites/deepbreathing/packages/engine/src`

This means we can add shared identity/entitlement/sync packages without rewriting breathing runtime logic.

## Decision Log
- 2026-02-13: Sequence approved: architecture + gating before upsell behavior.
- 2026-02-13: Guest-first remains mandatory.
- 2026-02-13: Capability-based gating selected over plan-string checks.
- 2026-02-13: Single premium model selected for v1 (`free` + `pro` only).
- 2026-02-13: Created shared package scaffolding:
  - `@resonance/domain`
  - `@resonance/access-control`
  - `@resonance/api-contracts`
