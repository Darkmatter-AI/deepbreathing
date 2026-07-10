# Signup-Conversion Research — 2026-07-10

Multi-agent research run (2 grounding, 4 web-research, 3 design, 9 adversarial-judge, 1 synthesis agents) after the non-blocking banner's ❌ Failed verdict. Question: how do we design the next experience to improve conversion to a full account?

## Judge scores

| Thesis | Proposal | Score /30 |
|---|---|---:|
| value-first | Claim Your Garden — endowed-progress session-end claim modal | 16 |
| moment-first | Second-Session Save — a milestone-gated, endowed-progress modal fired at the calm session-end | 17 |
| friction-first | One-Tap Save (session-safe) — cut the yes-path from 4 taps + a page reload to 1 tap, zero reload | 16 |

Per-lens verdicts (efficacy / retention-risk / cost+taste) are preserved in the workflow journal; the decisive objections are engaged in the synthesis below.

---

# Final Recommendation: Signup Conversion — Next Experiment

## 1. Recommendation

**Ship "Keep Your Practice" — a gain-framed, endowed-progress session-end modal with inline One Tap auth, ungated (fires on session 1 like Prompt C), plus silent per-day activity logging for the future.**

This is Proposal 2's form-factor logic with its riskiest element (the session-2 gate) removed, grafting:

- **From Claim Your Garden (P1):** the cumulative-progress substance — real streak, total minutes, sessions from `resonance_stats`, gain-framed ("keep", never "lose") — *without* betting on the garden visual, which P1's own risks concede is empty during the measurement window. Also graft its zero-UI instrumentation: start writing `resonance_active_days` to localStorage now, so a real garden exists in 3+ weeks if we ever want it.
- **From Second-Session Save (P2):** the modal-not-banner reversion argument (banner-blindness explains 9.3%→4.7% decay; modal cohort retention 50% vs banner 40% disproved the hidden-cost hypothesis), the P0 #2 fix shipped in the same PR, and the endowed-progress "2 of 3" quiet progress cue.
- **From One-Tap Save (P3):** Google One Tap / better-auth `oneTap` inline, no redirect, no reload — with the existing redirect button and magic link as fallbacks, so by construction it cannot underperform today's modal mechanics. Attribution must re-fire `conversion_signup_completed`/`signup_user_identified` from `markConverted` without the reload (agent-browser verify before trusting the baseline).

One coherent experience: guest finishes a ≥60s session → orb settles → 1.5s later a bottom sheet rises showing their real numbers ("14 minutes of calm · 3 sessions · 2-day streak"), a quiet session ✓ · save · sync cue, "Want to keep this?" phrasing, One Tap chip primed, session running behind the sheet. Dismiss is clean; existing every-3rd-session logic unchanged.

## 2. Why this and not the others

**Against the session-2 gate (P2's core idea, judged 17 but flawed):** the anti-judge nailed it — the rate lift is a selection artifact of purging session-1 users from the denominator, and on a ~4/wk-signup site suppressing the session-1 ask most plausibly cuts *absolute* signups, the actual goal. It also collapses the ~86/wk denominator below the 150-shown power gate, making INCONCLUSIVE the modal outcome. We keep the gate idea as a *cheap data pull first* (see §4), not a ship.

**Against the garden as the hook (P1):** the efficacy judge's fatal point stands — the mechanism doesn't fire during the window (cold-start, records only from ship-date), so P1 degrades to gain-framed copy anyway. And the retention judge is right that the `/stats` payoff surface is nearly unreachable (footer link only, experiment unverdicted until 2026-07-21). We take the copy substance and the logging, skip the promise we can't keep.

**Objections against what we're shipping, answered:**
- *"One Tap no-shows on mobile Safari, the highest-intent segment (8.8% vs 1.9%)."* True and pre-committed around: we instrument `signin_google_onetap_shown / prompt_shown`. If display <50%, the experiment is still a valid gain-framed-copy vs loss-framed-copy test against Prompt C — degraded, not dead. The fallback path is today's exact flow.
- *"The decline is demand-side; copy won't move it."* Possibly. That's why the criteria include a FAILED outcome at ≤13.8% and an absolute-signups floor — if this can't beat the modal it replaces, the next move is audience/traffic, not a fifth prompt variant.
- *"Rate metrics hide absolute losses."* Fixed: absolute weekly signups is now a committed guardrail, not loose corroboration.
- *"Dismisser retention is unmeasured."* Fixed: we add the dismisser-return read (GA4 segment: prompt_shown, no signup, returning within 7d) that the retention judge flagged as the banner's repeated blind spot.
- *"Day-7 return on N~10 is noise."* Conceded honestly: it's a directional guardrail, not a powered threshold, and the criteria say so.

No gating means the denominator stays ~86/wk, so 150 shown accrues in ~2 weeks — the only proposal shape that can actually reach a verdict at this traffic.

## 3. Experiment spec (paste into docs/PRODUCT-EXPERIMENTS.md)

**Name:** Keep Your Practice — gain-framed endowed-progress modal + inline One Tap (`keep_practice`)

**Hypothesis:** The loss-framed single-session receipt underperforms a gain-framed cumulative-progress ask (Rothman & Salovey: gain-framing wins for maintenance behaviors; Nunes & Drèze endowed progress), and the 4-tap redirect+reload yes-path leaks converters (One Tap lifts 47–126% external, fallback-safe here). Same modal moment, better substance and mechanics → intent ≥18%.

**Change:**
- `src/lib/conversion/variant.ts`: add `keep_practice`, `ACTIVE_CHALLENGER='keep_practice'`, `CHALLENGER_SHARE=1`, bump `VARIANT_KEY` v3→v4. Rollback lever: `ACTIVE_CHALLENGER='loss_aversion'`.
- NEW `src/components/auth/keep-practice-sheet.tsx`: fork `loss-aversion-sign-in-sheet.tsx`; real stats via `computeLiveStreak`/`last7Days` (`src/lib/stats/streak-calendar.ts`); progress cue; theme via `BREATHING_PATTERNS`; extract shared `trackEvent` (no 4th copy).
- `src/components/auth/session-complete-prompt.tsx`: add variant case.
- `src/lib/auth.ts` / `src/lib/auth-client.ts`: better-auth `oneTap` plugin + GIS script (existing Google client ID). Verify inline attribution end-to-end with agent-browser.
- `src/components/resonance/Resonance.tsx`: (a) write `resonance_active_days` on session complete (silent, future garden); (b) P0 #2 fix — session keeps running behind any auth sheet (same PR, blocking).
- New events: `signin_google_onetap_shown`, `signin_onetap_accepted`. Trigger gate unchanged (`sessionsOver60s >= 1`).

**Baseline (GA4 DKMT 527524722 / G-53DLCBMRL3):** modal intent 13.8% (N=87, directional — Prompt C had no formal verdict); day-7 return ~50% (N=12); ~86 prompt-shown/wk; ~4–7 signups/wk; identified/shown ~7–9%.

**Method:** 100% pre/post swap (50/50 underpowered). MDE pre-registered at ~30% relative.

**Pre-committed criteria (evaluated only at ≥150 prompt-shown):**
- ✅ **SUCCESS:** intent ≥18% AND identified/shown ≥7% AND absolute signups ≥ trailing-4-wk baseline AND day-7 return ≥45% (directional) AND dismisser 7-day return not down >10pp.
- ❌ **FAILED:** intent ≤13.8% OR absolute weekly signups below baseline for 2 consecutive weeks OR identified/shown collapses (<5%, phantom One Tap taps).
- 🟡 **MIXED:** intent 13.8–18% with clearly improved day-7 return or dismisser retention.
- ⚪ **INCONCLUSIVE:** <150 prompt-shown by verdict date. Also pre-committed: if `onetap_shown/prompt_shown` <50%, score the result as the copy test only and file the One Tap mobile gap separately.

**Verdict date:** 3 weeks post-ship, or early once ≥150 shown AND result crosses a boundary (≥18% or ≤10%), per the banner's escape-clause precedent. Retention leg via Neon (`dbe-accounts-auth`).

## 4. Deliberately not picked

- **Session-2 gate (P2):** revisit trigger — first pull GA4 `session_count` segmentation of *existing* `conversion_prompt_shown`/`signup_completed` data (free, no build). If session-2+ intent is >2x session-1, gate the *next* variant.
- **Garden claim modal (P1):** revisit once (a) `resonance_active_days` has ≥3 weeks of accrual and (b) the /stats experiment verdict lands (2026-07-21) with a reachable entry point.
- **Banner iteration:** dead. Two Failed conditions met; form factor, not copy.
- **Passkeys / email-later accounts:** no infra, evidence is sign-in-convenience not signup; revisit only if One Tap proves the friction thesis.

## 5. Open questions for Abi

1. **Headline copy (taste call):** "Want to keep this?" vs "That's 3 sessions of calm — keep it?" — inline-written, needs your read before ship.
2. **One Tap aesthetics:** Google's chip is visually Google-branded chrome on a meditative surface. Acceptable, or require the sheet-embedded button-only variant (loses the auto-prompt lift)?
3. **P0 #2 fix flavor:** keep session running behind the sheet (recommended, richer) vs hide the header sign-up button during sessions (cheaper). Same PR either way.
4. **Scope check:** the failed tap-to-pause hint is still live in prod despite its ❌ verdict. Roll it back in this PR or separately?
