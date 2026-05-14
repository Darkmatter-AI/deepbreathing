Goal (incl. success criteria):
- Establish accounts, cross-platform identity, and premium gating architecture before any upsell behavior.
- Produce a single implementation roadmap that covers web + iOS + Android and can be executed in phases.

Constraints/Assumptions:
- Workspace: /Users/abi/Sites/deepbreathing.
- Keep guest-first onboarding.
- Keep breathing runtime local-first and offline-safe.
- Keep continuity notes concise and compaction-safe.

Key decisions:
- Work sequence is now architecture/gating first, upsell later.
- Use capability-based feature gating shared across web/mobile.
- Use one identity model across platforms with guest-to-account merge.
- Commercial model is v1 simple: single paid `pro` subscription plus `free`.
- Feature flags are required from day one (`auth/sync/entitlements/premium` domains).

State:
- Done: Wrote canonical roadmap and scaffolded shared Phase 0 packages (`domain`, `access-control`, `api-contracts`).
- Now: Implement access-control tests, then wire auth/entitlement interfaces into web and mobile.
- Next: Add `/api/v1` route stubs and feature-flag response wiring.

Done:
- Added `/Users/abi/Sites/deepbreathing/docs/accounts-architecture-and-gating-roadmap.md`.
- Documented:
  - user states (guest/free/pro/lapsed),
  - domain model (identity, session events, entitlements),
  - auth and sync architecture,
  - capability-based gating design,
  - phased rollout and checklists,
  - risks and mitigations.
- Added new packages:
  - `/Users/abi/Sites/deepbreathing/packages/domain`
  - `/Users/abi/Sites/deepbreathing/packages/access-control`
  - `/Users/abi/Sites/deepbreathing/packages/api-contracts`
- Ran `pnpm install` and confirmed `pnpm exec tsc --noEmit` passes.

Now:
- Keep upsell work paused and execute architecture tasks first.

Next:
- If requested, scaffold `packages/domain`, `packages/access-control`, and initial API contract types.

Open questions (UNCONFIRMED if needed):
- UNCONFIRMED: Final auth provider selection (Better Auth vs alternative).
- UNCONFIRMED: Billing stack choice for cross-platform subscriptions.

Working set (files/ids/commands):
- /Users/abi/Sites/deepbreathing/CONTINUITY.md
- /Users/abi/Sites/deepbreathing/docs/accounts-architecture-and-gating-roadmap.md
