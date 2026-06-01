# Conversion Prompt B (Social + Stats) — implementation handoff

From the Claude Design bundle "conversion-prompt". The user iterated through five
directions and landed on **B: social-led, stats-backed**. Social proof leads
("people breathing right now"), and the visitor's own blurred week stats give a
private reason to finish signing up. It fires anytime, so it works even with no
fresh session to anchor.

## What shipped in this change

- **`src/components/auth/social-stats-sign-in-sheet.tsx`** — a faithful,
  production-grade React port. It is a **sibling** to `SignInSheet`, not a
  replacement. The live funnel is untouched.
- **`docs/design/conversion-prompt-B-social-stats.preview.html`** — standalone
  visual preview (orb backdrop + sheet + reopen pill) for design review and
  browser verification. Open it with any static server, for example:
  `python3 -m http.server` from `docs/design/`, then load the file.

The component reuses the codebase's own primitives: Radix `Sheet`/`SheetContent`,
`lucide-react` icons, `better-auth` `signIn.social` / `signIn.magicLink`, and the
`gtag` tracking helper. It is controlled (`open` / `onOpenChange` / `onSuccess`),
matching the `SignInSheet` API so it can drop into the same call sites.

### Verification done

- `tsc --noEmit` and `eslint` both pass clean.
- The **standalone preview** was browser-verified across every state: default
  form, live-count tick, email expand, magic-link success ("Check your email"),
  the unblur payoff, close, and reopen.
- The **real component** was mounted under the app layout (via a temporary,
  production-guarded dev route at `/dev-preview/conversion-prompt-b`, since
  removed) and browser-verified: it renders identically, in Inter, with the
  email-expand interaction working. The temporary route is not part of this
  change.

## Honest changes from the prototype

1. **Google does not animate in-page.** Real `signIn.social({provider:"google"})`
   redirects the browser away, so the prototype's "unblur then You're in" cannot
   fire for Google. The unblur payoff lives on the **email magic-link** path,
   which resolves to "Check your email" exactly like the real sheet's `sent`
   state. The preview wires Google to the unblur+success purely so that visual
   can be reviewed in one click.
2. **Copy is English literals via props.** The real `SignInSheet` routes every
   string through `runtime-phrases` (`t(...)`). See i18n follow-up below.
3. **Only one stat is real.** `yourMinutes` maps to the existing `totalMinutes`
   prop. `dayStreak`, `liveCount`, and the avatars are placeholders.

## Before wiring into the live funnel — required steps

The project `CLAUDE.md` gates any conversion/UX change behind a
`docs/PRODUCT-EXPERIMENTS.md` entry with **hypothesis, baseline, and
pre-committed success criteria** written *before* shipping. Do that first.
Suggested frame:

- **Hypothesis:** reframing the post-session prompt around social proof +
  endowment (vs. the current "Save your progress") lifts signup conversion.
- **Baseline:** pull current prompt-view -> signup rate from
  `docs/FUNNEL-DASHBOARD.md`.
- **Success criteria:** e.g. "Success if signup rate from the prompt moves by
  >= X% over N days." Pre-commit X and N.
- **A/B, do not hard-swap.** Keep `SignInSheet` as control. Route a share of
  sessions to `SocialStatsSignInSheet` from `SessionCompletePrompt` (or wherever
  the prompt mounts in `Resonance.tsx`). The new `signin_prompt_view`,
  `signin_google_clicked`, and `signin_magic_link_sent` events carry
  `variant: "social_stats"` so the two arms are separable in GA4.

## Follow-ups before this is fully production-ready

1. **Real data for the placeholders.**
   - `liveCount`: needs a concurrent-users source. If a returning visitor has no
     real number, fall back to the plain `SignInSheet`. Do not show a fake count.
   - `dayStreak`: needs a real streak value per user.
   - Avatars and any testimonial must be real, not stand-ins.
2. **i18n.** Add `runtime-phrases` keys for the new copy ("You're in good
   company", "breathing right now", "Your minutes", "Day streak", "Unlock",
   "Check your email", "or use email", "Not now") and resolve them with `t(...)`
   like `SignInSheet`, instead of the English literal props.
3. **Endowment honesty.** The blurred stats imply the visitor already has logged
   minutes. Only show the stats block when `yourMinutes > 0` (mirror the existing
   `totalMinutes != null && > 0` guard); otherwise lead with social proof alone.
4. **App-wide font (observation, out of scope).** `layout.tsx` loads Inter via
   `next/font` and exposes it as `--font-sans`, but nothing applies it as a
   `font-family` (no `fontFamily.sans` in `tailwind.config.ts`, no rule in
   `globals.css`), so the app currently falls back to the system sans stack. This
   sheet pins Inter via `var(--font-sans)` so it matches the brand regardless. If
   the intent is Inter site-wide, add `fontFamily.sans: ["var(--font-sans)", ...]`
   to the Tailwind theme. Tracked here, not changed in this commit.

## How to mount it (sketch)

```tsx
// Same props as SignInSheet, plus the social/stats inputs.
<SocialStatsSignInSheet
  open={open}
  onOpenChange={setOpen}
  onSuccess={handleSignedIn}
  yourMinutes={totalMinutes}      // real
  dayStreak={streak}              // wire to real source
  liveCount={liveNow}             // wire to real source
/>
```
