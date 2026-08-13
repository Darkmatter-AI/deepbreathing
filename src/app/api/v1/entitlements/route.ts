/**
 * GET /api/v1/entitlements
 *
 * Returns the caller's EntitlementSnapshot — their current plan, resolved
 * capabilities, and timestamps. This is the cross-platform source of truth:
 * both the iOS WKWebView and future web billing flows read from here.
 *
 * Response shape: ApiResponse<EntitlementsResponse> from @resonance/api-contracts
 * (EntitlementsResponse = EntitlementSnapshot from @resonance/domain)
 *
 * ── WIRING NOTE ────────────────────────────────────────────────────────────
 * This route imports from @resonance/access-control and @resonance/domain.
 * These workspace packages are not yet listed in the root package.json or
 * wired as transpilePackages in next.config.js. Before this route goes live
 * you (the repo owner) need to run:
 *
 *   1. Add to root package.json dependencies:
 *        "@resonance/access-control": "workspace:^",
 *        "@resonance/api-contracts":  "workspace:^",
 *        "@resonance/domain":         "workspace:^"
 *
 *   2. Add to next.config.js:
 *        transpilePackages: ["@resonance/access-control", "@resonance/domain", "@resonance/api-contracts"],
 *
 *   3. pnpm install
 *
 * The resolver logic (resolveEntitlement) is fully tested in
 * packages/access-control/src/resolve-entitlement.test.ts.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Plan resolution (current — pre-billing):
 *  guest              → plan: "free", capabilities: [] (gated)
 *  authenticated user → plan: "free", capabilities: ["history.basic"]
 *
 * TODO(RevenueCat): on receipt of a RevenueCat webhook, write the user's
 * entitlement into a `user_entitlements` table. Query it here to return
 * plan:"pro" for active subscribers. See docs/monetization-plan.md.
 *
 * TODO(Stripe): same flow for web billing — Stripe webhook → user_entitlements
 * → pro plan returned here. One source of truth, both platforms covered.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resolveEntitlement } from "@resonance/access-control";
import type { EntitlementsResponse } from "@resonance/api-contracts";
import type { ApiResponse } from "@resonance/api-contracts";

// Never prerendered at build time. These handlers read request state (session,
// database) and a build-time prerender attempt evaluates that state with no env
// configured, which crashed the static worker on deployments without secrets.
// Cacheability is expressed per-response via Cache-Control, not by prerendering.
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<EntitlementsResponse>>> {
  const session = await auth.api.getSession({ headers: await headers() });

  const now = new Date().toISOString();

  if (!session) {
    // Guest — no session cookie present
    const { snapshot } = resolveEntitlement({
      userId: null,
      plan: "free",   // ignored for guests; resolver forces empty capabilities
      effectiveAt: now,
    });
    return NextResponse.json({ data: snapshot, error: null });
  }

  const userId = session.user.id;

  // TODO(RevenueCat/Stripe): replace this block with a real entitlement lookup.
  // Query user_entitlements table (to be created by the billing webhook handler)
  // to determine whether the user has an active "pro" subscription on any platform.
  //
  // Example (pseudocode):
  //   const { rows } = await pool.query(
  //     `SELECT 1 FROM user_entitlements
  //      WHERE user_id = $1 AND status = 'active' AND expires_at > now()
  //      LIMIT 1`,
  //     [userId]
  //   );
  //   const plan = rows.length > 0 ? "pro" : "free";
  //
  // For now all authenticated users are "free".
  const plan = "free" as const;

  const { snapshot } = resolveEntitlement({
    userId,
    plan,
    effectiveAt: now,
  });

  return NextResponse.json({ data: snapshot, error: null });
}
