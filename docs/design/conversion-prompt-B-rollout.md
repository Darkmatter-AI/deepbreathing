# Conversion Prompt B — rollout, measurement, and review

Status as of 2026-06-01. **Decision: ship the challenger at 100% and measure
pre/post against the funnel baseline** (simplest, and the only viable read at
current traffic). Simulated social proof is accepted for now (founder's call).

## What ships

`SocialStatsSignInSheet` replaces the control `SignInSheet` in the post-session
prompt (`SessionCompletePrompt`) for all visitors. Files:

- `src/lib/conversion/variant.ts` — bucket helper. `SOCIAL_STATS_SHARE` is the
  one knob: **`1` = challenger to everyone (current)**, `0` = instant rollback
  to the control `SignInSheet`, `0.5` = a true 50/50 split (only worth it if
  traffic grows). Bucket persists in `localStorage` (`resonance_conversion_variant`).
- `src/lib/conversion/use-conversion-triggers.ts` — assigns the bucket, exposes
  `variant`, tags `conversion_prompt_shown`, `conversion_prompt_dismissed`,
  `conversion_signup_completed`.
- `src/components/auth/auth-provider.tsx` — tags `signup_user_identified` and
  sets a `conversion_variant` GA4 user property (segmentable after the redirect).
- `src/components/auth/session-complete-prompt.tsx` — renders the challenger when
  `variant === "social_stats"`, else the control sheet.
- `src/components/auth/social-stats-sign-in-sheet.tsx` — the prompt itself.

Even at 100%, tagging stays useful: it marks the post-change period in GA4 and
the user property, and the knob gives instant rollback.

## Data honesty (accepted state)

- **Social proof is simulated.** The live count ("~1,240 breathing right now")
  ticks via client-side jitter; the avatars are decorative gradients. Founder
  has approved simulating this for launch. If we ever want it real, add a
  lightweight presence/aggregate endpoint.
- **`yourMinutes` is real** (the existing `totalMinutes`). The stats block is
  gated on `yourMinutes > 0` (`showStats`) so we never blur a "0"; when hidden,
  the prompt leads on social proof alone.
- **`dayStreak` is still simulated** and unblurs to a non-real number on the
  email path. Lowest-confidence element; wire a real streak before leaning on it.
- Minor: when `showStats` is false the subtitle still says "your own week is
  already adding up." Edge case (prompt only fires after a >=60s session, so
  minutes are almost always > 0). Polish later.

## The metric

- **Primary:** `conversion_prompt_shown` -> `conversion_signup_completed`, per
  arm. This is signup **intent** (the email path fires on "link sent", which is
  a pre-existing property of the funnel, not new here).
- **Truth / guardrail:** `conversion_prompt_shown` -> `signup_user_identified`
  per arm (real account created), plus `conversion_prompt_dismissed` rate.

### Baseline (from docs/FUNNEL-DASHBOARD.md, current week)

| Metric | Value |
|---|---|
| `conversion_prompt_shown` | 52 / wk |
| `conversion_signup_completed` | 6 → **11.5% of prompt-shown** (intent) |
| `signup_user_identified` | 4 → ~7.7% of prompt-shown (truth) |
| prior-period intent rate | 23.5% (high variance on small N) |

### Power reality (why 100% pre/post, not a split)

At ~52 prompt impressions/wk and ~11.5% baseline, a clean fixed-horizon 50/50
read needs on the order of 1,000+ impressions **per arm**, which is months. So
we ship at 100% (`SOCIAL_STATS_SHARE = 1`) and read pre/post against this
baseline, the way the rest of `PRODUCT-EXPERIMENTS.md` does. Pre/post is weaker
causally (seasonality, other changes can confound), so keep the window tight and
watch the dashboard's other lines for co-movement. Flip to `0.5` for a real
split only once traffic supports it.

---

## Measures (committed)

The finalized experiment entry with pre-committed criteria lives in
[docs/PRODUCT-EXPERIMENTS.md](../PRODUCT-EXPERIMENTS.md) under
"2026-06-01: Conversion Prompt B". Summary: ✅ Success if prompt_shown -> signup
reaches **>= 16%** (from 11.5%) without regressing signup_user_identified or
raising the dismiss rate; first read 2026-06-15, verdict 2026-06-29. The block
below is the original draft, kept for reference.

```markdown
### 2026-06-__: Conversion Prompt B (social proof + personal stats), 100% challenger

**Hypothesis:** Reframing the post-session prompt around social proof
("people breathing right now") + endowment (your own blurred week stats),
instead of "Save your progress", lifts prompt_shown -> signup.

**Design:** Ship the challenger to 100% (`SOCIAL_STATS_SHARE = 1`), read pre/post
vs the baseline below. Social proof (live count + avatars) is simulated; only
yourMinutes is real (stats gated on > 0). Events carry a `variant` param and
converted users get a `conversion_variant` GA4 user property, marking the
post-change period. `SOCIAL_STATS_SHARE = 0` is the instant rollback.

**Baseline (week of 2026-06-01):**
- conversion_prompt_shown: 52/wk
- conversion_signup_completed: 6 = 11.5% of prompt-shown (intent)
- signup_user_identified: 4 = ~7.7% of prompt-shown (truth)
- prior-period intent rate: 23.5% (noisy, small N)

**Pre-committed criteria (measure-after TODO):**
- ✅ Success if: prompt_shown -> conversion_signup_completed rises to >= TODO%
  (from 11.5%), sustained over TODO weeks, AND signup_user_identified rate does
  not regress AND dismiss rate does not rise materially.
- ❌ Failed if: signup rate <= baseline (or dismiss rate up) over the window.
- 🟡 Mixed if: intent up but truth (signup_user_identified) flat/down.

**Status:** 🔄 Implemented [commit TODO]. measure-after: TODO (suggest first read
at the next weekly funnel refresh after >= TODO prompt impressions accrue).
```

---

## First-evening review checklist (after deploy)

What the scheduled review verifies. GA4: DKMT property `527524722`, measurement
ID `G-53DLCBMRL3`. Use Realtime + DebugView for same-evening signal (standard
reports lag 24-48h).

1. The new prompt renders in prod: social headline, ticking live count, blurred
   stats (when minutes > 0). No console errors.
2. `conversion_prompt_shown` arrives carrying `variant = social_stats` (at 100%,
   that single value; no `control` should appear for new visitors).
3. `conversion_signup_completed` and `signup_user_identified` carry `variant`;
   `conversion_variant` user property present on identified users.
4. Bucket is stable: reloading does not re-roll `resonance_conversion_variant`.
5. `conversion_prompt_shown` volume is in line with pre-deploy levels (no drop
   from a bug suppressing the event), and at least one signup event has fired.
6. Early `conversion_signup_completed / conversion_prompt_shown` is sane vs the
   11.5% baseline (directional only on evening 1; small N).
