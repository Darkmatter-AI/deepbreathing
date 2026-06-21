# Per-user blob avatars — design research

> Source: `/fusion` multi-model panel (claude-firstprinciples + claude-skeptic, judged + synthesized), 2026-06-21.
> Question: give every user a distinct, deterministic "blob avatar" that stays on-brand, reusing the existing
> seeded-blob OG/Satori code and the Remotion orb-video pipeline. Both panelists read the actual code; key facts
> were judge-confirmed against the live tree (satori 0.16.0, `@vercel/og` 0.8.5, `og-scene.tsx`, `auth.ts:49`
> databaseHooks, Remotion is an out-of-repo sibling worktree).

## Phase-0 spike results — BUILT & RENDERED (2026-06-21)

The validation spike from §5 was built and rendered. Files (isolated, throwaway): `src/lib/avatar/params.ts`
(generator + OKLCH→hex gamut-clamp), `src/lib/avatar/avatar-scene.tsx` (Satori scene), `src/app/avatar/[seed]/route.tsx`
(edge PNG route), `src/app/avatar-spike/page.tsx` (48-seed contact sheet at 256/64/32px + a grayscale row),
`src/app/avatar-spike/svgtest/route.tsx` (path render test).

**Findings:**

1. **Satori renders `<svg><path>` and `<circle>` — CONFIRMED by actual render** (not source-map inference). The
   `/avatar-spike/svgtest` route returned a real filled blob PNG. So the v2.5 parametric-path escape hatch is
   **open** — a future continuous silhouette is viable. (Still not needed for v1; border-radius stays the DNA.)

2. **The generator looks great and clearly distinct at 64px and 256px** — organic silhouettes, soft tinted tiles,
   orbit ring, glow, particle constellation. On-brand. This is the range that matters for profile pics, the in-app
   header, emails, and social shares. Ship it there with confidence.

3. **At 32px, identity is HUE-dominated. Shape contributes ~nothing** — a blob at 32px is just a colored dot; the
   border-radius differences are imperceptible. This *refines* the panel's claim: "gross silhouette asymmetry"
   does NOT survive 32px. Only color does.

4. **The grayscale (colorblind / lightness-only) read at 32px is WEAK** — the spike's most important result, and it
   **falsifies** the panel's "lightness + gross silhouette carry identity at favicon size" assumption. With the
   original tight band L∈[0.55,0.72] the grayscale row was a near-uniform field of mid-gray dots. Widening to
   L∈[0.46,0.82] visibly improved the spread (clear darkest/lightest), but the majority still cluster mid-gray:
   **lightness alone cannot carry dozens of distinct identities at 32px** (only ~6–8 distinguishable lightness
   bands → heavy collision among 48 avatars). A single solid blob is inherently weak as a colorblind-safe favicon.
   Landed on a compromise band L∈[0.50,0.78].

5. **Minor: the yellow-green hue band (~90–130°) renders dull/olive** after the gamut clamp pulls chroma down.
   A couple of avatars look muddy. Optionally bias hue away from that band, or accept it.

**Consequences for the plan:**
- v1 (PNG for profile/header/email/social at ≥64px): **green-lit, looks good as-is.**
- **De-scope the per-user dynamic favicon** (the panel already suggested this; the spike now proves why — a solid
  blob doesn't differentiate at 16–32px, especially for colorblind users). Use the static brand favicon.
- If small-size colorblind-distinct avatars ever become a hard requirement, a pure solid blob can't deliver it;
  you'd need an added structural element (2-tone split, inner motif, or initials) — which departs from the pure-blob
  brand. Not worth it for v1.

### Iteration 2 (same session) — three fixes from eyeballing the sheet

1. **Tile background was wrong.** The first pass tinted each tile a pale version of its own blob hue, so no tile was
   actually beige. Fixed to the flat brand cream `#fdf8f2` (= globals.css `--background: 32 72% 97%`, the same CREAM
   the orb-video uses) for *all* tiles — cohesive set, and the blob (esp. reds/darks) pops against neutral cream.

2. **"Why are there no reds?"** Two compounding causes:
   - *Lightness:* a red hue only reads as red at L≈0.55–0.58 + high chroma; the old mid-bright band desaturated reds
     to coral/salmon, and the gamut clamp forced chroma down at high L. Fixed with **gamut-aware (cusp) lightness** —
     sample L around each hue's max-chroma lightness, so every hue (red included) renders vivid. Bonus: ties lightness
     to hue (reds dark, yellows light), which widens the grayscale spread the spike found weak.
   - *Hue distribution (the dominant cause):* uniform-angle sampling makes "red" a rare ~6% slice while green/teal
     eats ~30% of the wheel, so reds almost never appeared and greens dominated. Fixed by **anchoring hue on the 12
     brand colors** (incl. reds 18°/27° = `#e11d48`/`#dc2626`) with ±15° jitter → reds are now ~17% of draws and
     appear reliably; the palette is brand-coherent (blues/purples/ambers/greens/reds).

3. **Tradeoff to decide later:** brand-anchored hue is the panel's "curated palette" path — it guarantees on-brand
   color and reds, but collapses hue entropy to ~12 families (less raw color variety than free-wheel). For a calm
   wellness brand that's likely the right call; if more color variety is wanted, widen the jitter or weight a
   continuous distribution by inverse perceptual hue-width. Cusp lightness also made blobs more saturated/crayon-like
   than the first soft-pastel pass — dial the chroma factor (currently 0.85 × max) down for a softer look.

### Iteration 3 — DECISION LOCKED: tight brand color + parametric-path shape

Owner chose **less color variation, more shape variation**. Implemented:
- **Color:** pick one of **9 de-duplicated brand colors** (their exact OKLCH; dropped the emerald/sky twins) +
  TIGHT jitter (hue ±4°, L ±0.025). Every avatar is recognizably a brand color; reds are 2 of 9 (~22%). The
  cusp-lightness machinery is gone — brand colors are already vivid + in-gamut.
- **Shape (now the PRIMARY identity channel):** switched the silhouette from the 8-value border-radius to a
  **sum-of-sines polar-radius SVG `<path>`** — `r(θ)=R·(1+Σ aₖ·sin(kθ+φₖ))`. This is the parametric model the panel
  called v2.5, pulled forward because shape is now where per-user uniqueness lives. The glow + ring are the same path
  at larger radii, layered as plain filled paths (no stroke / filter / transform) to stay inside Satori's proven
  feature set. **Roundness is a tuning knob** (the harmonic amplitude budget): owner chose **round** — k=2..4, small
  budget (~0.20) with fast 1/k decay → gentle organic asymmetry, not spiky/lobed. Raise the budget toward ~0.42 for
  more dramatic blobs.
- This makes the **Satori `<path>` render a hard dependency** (no longer optional) — backed by the Phase-0 render
  test + 48 live renders. `borderRadius`/`morph` are retained in `AvatarParams` only for the future live-CSS orb.
- Open follow-ups: the live in-app orb (v2) must match via `clip-path: path()` to stay identical to the PNG; and at
  32px shape mostly collapses to a colored dot, so with color variety now low, favicon-scale distinctiveness is
  intentionally weak (reinforces de-scoping the dynamic favicon).

## TL;DR

Store **one opaque seed string per user**, derive everything from it with a single pure function
`seedToAvatarParams(seed, version)`, and render that on the surfaces you already own. Color is **OKLCH computed
in JS but emitted as hex**. The silhouette is the **8-value `border-radius`** you already animate — *not* a
parametric SVG path — because it is the only shape language all three of your surfaces (live CSS, Satori PNG,
Remotion MP4) natively share. Ship the static PNG first by parameterizing the existing `/og` route. Persist
seed + version only; never persist pixels in v1.

The much-feared "Satori can't render parametric blob paths" risk **evaporates** once you keep the silhouette in
border-radius space — you never ask Satori to render a path. The real residual risks are **OKLCH gamut clipping**
and **cross-runtime float drift**, addressed below.

Two deliberate departures from the original brief:
- The brief named "Satori can't render paths" as the biggest risk. It only is a risk *if you choose paths*.
  Choosing border-radius dissolves it.
- The brief leaned toward a continuous silhouette (sum-of-sines / superformula). Down-weighted for v1: it buys
  distinctiveness the eye can't read at avatar sizes, at the cost of fracturing the single source of truth. Keep
  it as a documented v2+ escape hatch behind a non-Satori SVG route.

---

## 1. Seed → AvatarParams generator

### 1.1 What seeds the avatar

| Source | Use it? | Why |
|---|---|---|
| `user.id` (signed-in) | Yes (as the *default* for the stored seed) | Immutable; survives email/name changes; the avatar never jumps under the user. |
| `localStorage` device id (anon) | Yes | Already your anonymous identity. No DB row required — the device id *is* the seed. |
| Email hash | No | PII / re-identification vector in a public, cacheable URL. |
| Display name | No | Mutable → renaming would silently change the user's face. |
| **Opaque `avatar_seed` column** | **Yes — the actual stored value** | Don't put `user.id` directly in the URL. Store a random `avatar_seed`, defaulted to a hash of `user.id` at account creation, that the user can overwrite by re-rolling. Stability by default, delight on demand, and keeps `user.id` out of public URLs (closes an enumeration blind spot). |

**Anon → signed-in migration:** on first sign-in, copy the device-id-derived seed onto the new account's
`avatar_seed`. The blob carries over instead of jarringly changing at signup.

### 1.2 Hashing — use xmur3, not djb2

The existing `/og` code uses **djb2 — do not reuse it for the avatar seed.** djb2 has weak avalanche: near-identical
input strings produce near-identical outputs. The re-roll feature generates exactly such strings (`seed#1`,
`seed#2`, …), so djb2 would make consecutive re-rolls look *similar* — the opposite of what re-roll is for. Use
**xmur3** to expand the seed into 32-bit state, then **mulberry32** (already in the codebase) for per-channel
streams. Diverging from the OG page seeds is intended — page OG images and user avatars are different products.

### 1.3 Channel-split derivation

Derive independent sub-streams per visual channel so a collision in one channel doesn't correlate with another:

```
hash = xmur3(seed + ":v" + version)
rngColor     = mulberry32(hash())
rngShape     = mulberry32(hash())
rngParticles = mulberry32(hash())
rngAccent    = mulberry32(hash())
```

### 1.4 Color model — OKLCH computed in JS, emitted as hex

Continuous OKLCH hue, brand-anchored L and C, **gamut-clamped, quantized, then converted to plain hex.**

1. **OKLCH over HSL** — HSL lightness is perceptually uneven; random HSL gives muddy/blown-out hues. OKLCH holds
   perceived lightness/chroma steady as hue sweeps.
2. **Emit hex, not `oklch()`** — Satori almost certainly can't parse `oklch()`, and `og-scene` already speaks hex.
3. **Mandatory chroma gamut-clamping** — a fixed C clips the sRGB gamut at some hues → desaturated/muddy colors
   for unlucky users. After picking (L, C, H), if OKLCH→sRGB lands out of gamut, **reduce C until it's in gamut**
   (binary search, ~8 iters). Non-negotiable; without it the "always pleasing" guarantee is false for a slice of
   users.

**Measured brand bands** (skeptic empirically converted all 12 brand hexes; full range L 0.51–0.77, C 0.111–0.230,
hues 18°–293°). Anchor slightly conservative:

- **L** ∈ [0.55, 0.72]  (pull in extremes so no avatar is near-black or washed out)
- **C** ∈ [0.12, 0.20]  (cap the top so no avatar screams)
- **H** ∈ full wheel, continuous

**Let L vary** rather than fixing it. At 32px particles and fine silhouette vanish, and **hue alone is not
colorblind-safe** — the only discriminators that survive at favicon size are **lightness contrast** and **gross
silhouette asymmetry**. Varying L adds color entropy *and* serves as the colorblind fallback.

**Quantize before converting:** snap H to ~1° steps, L and C to ~256 steps each, *before* the OKLCH→sRGB→hex math.
This makes the emitted hex robust to last-ULP float divergence between the Vercel edge (V8) renderer and the
Remotion (Node) renderer, so the static PNG and the animated blob agree on the byte.

**Library call:** hand-rolling the OKLab matrix + gamut clamp is ~40 lines and keeps the edge bundle lean; `culori`
is the pragmatic alternative. Leaning hand-rolled-and-quantized, because quantization + a tiny pure converter is
what buys cross-runtime determinism.

**Conservative fallback** (offer, don't default): anchor on the 12 vetted hexes and perturb H ±15° and L ±0.04.
Lower entropy, zero off-brand risk. Good A/B candidate; ship full-wheel first since the gamut clamp already
guarantees on-brand.

### 1.5 Silhouette model — border-radius, not paths (the central decision)

Tension: *distinctiveness* favors a continuous path model (effectively infinite silhouettes); *single source of
truth* favors the 8-value border-radius — the **only** representation live CSS, Remotion, **and** Satori all render
natively today. The structural argument wins for v1 **independent of whether Satori can render `<path>`**: choosing
a parametric path would strand the live-CSS and Remotion surfaces, forcing you to re-implement the path math in CSS
clip-path/Remotion or accept that the header blob and the emailed avatar are different shapes — fracturing the one
thing the brief asked you to preserve.

**On "can Satori 0.16.0 render an inline `<svg><path>`?"** — the honest answer is *source-indicated, not
render-verified*. SVG handlers appear in satori's source maps (suggestive), but neither panelist ran an
`ImageResponse` of an `<svg><path>` and inspected the PNG. Doesn't matter for v1 (no paths). **Do not build v2's
path route on the assumption it works** — run the one cheap render experiment first.

**Sampling border-radius pleasingly** — combine both constraints:
- Sample 8 percentages in **[30, 70]** (measured slot range).
- Enforce the **"opposite corners sum to ~100"** balance rule — keeps the blob convex/balanced, never pinched.
- This is a smooth organic continuum, not 8 discrete shapes — far more shape entropy than the static OG table's 8,
  while staying inside Satori's proven envelope.

```ts
function sampleBorderRadius(rng) {
  // 4 independent axes; opposite corner = 100 - axis  → balance / convexity
  const h = [0,1,2,3].map(() => 30 + rng() * 40); // horizontal radii, [30,70]
  const v = [0,1,2,3].map(() => 30 + rng() * 40); // vertical radii
  const hr = [h[0], h[1], 100 - h[0], 100 - h[1]];
  const vr = [v[0], v[1], 100 - v[0], 100 - v[1]];
  return `${hr[0]}% ${hr[1]}% ${hr[2]}% ${hr[3]}% / ${vr[0]}% ${vr[1]}% ${vr[2]}% ${vr[3]}%`;
}
```

The **live morph** then animates by drifting these 8 values between keyframes (what the CSS already does), with the
static PNG being the t=0 frame. The emailed avatar is provably a frame of the in-app animation — achieved in
border-radius space, so it holds across all three surfaces.

### 1.6 Particles and glow — identity vs richness

Particles are a **seeded constellation for richness, not an identity signal** — invisible below ~64px. Hard rule:
**drop particles AND the glow below 64px.** At favicon sizes, identity = color lightness + gross silhouette only.
Above 64px, generate the constellation with the existing mulberry32 path keyed off `rngParticles`.

### 1.7 The shared module signature

```ts
// src/lib/avatar/params.ts — THE single source of truth
export const AVATAR_VERSION = 1;

export interface AvatarParams {
  version: number;
  fill: string;          // hex, gamut-clamped OKLCH
  glow: string;          // hex, lighter/translucent derivative
  ring: string;          // hex, accent for orbit ring
  borderRadius: string;  // 8-value CSS string, shared by CSS + Satori + Remotion
  particles: Array<{ x: number; y: number; r: number; alpha: number }>;
  morph: string[];       // N border-radius strings the live blob tweens through; static PNG = morph[0]
  hueDrift: number;      // deg, for the live hue-rotate
}

export function seedToAvatarParams(seed: string, version = AVATAR_VERSION): AvatarParams;
```

Every surface imports this. No surface re-derives params.

---

## 2. Distinctiveness vs brand-coherence — the entropy verdict

**Reject the curated discrete combinatorial table (~12 colors × 8 shapes ≈ 96 distinct combos)** — it collides hard
on the two channels the eye reads at small size; particle constellations/accents add entropy that doesn't survive
downscaling. **Reject ML/diffusion** (overkill/slow/expensive). **Reject feTurbulence + feDisplacementMap as the
shared silhouette model** — satori's compiled bundle supports only `feFlood`/`feGaussianBlur`/`feComposite`, *not*
the turbulence primitives. Fine as a per-seed texture flourish on a non-Satori surface only; never identity-bearing.

Recommended generator's effective distinct-avatar count *at sizes that matter*: continuous hue (~360 perceptual
steps) × varied L (~6–8 distinguishable bands at small size) × balanced border-radius continuum (low-hundreds of
visually distinct silhouettes) → **low tens-of-thousands of avatars that look distinct at a glance**, far more at
large sizes where particles/glow re-enter. (JND-bounded, not "effectively infinite" — don't advertise it as such.)

**Largest unvalidated assumption in the whole brief:** neither panelist rendered a contact sheet. Both *assert*
"always pleasing AND distinct" with zero rendered evidence. Treat the "render 50 seeds" spike as a **gate**, not a
nicety — a ~30-min experiment that empirically settles pleasingness, 32px distinguishability, and colorblind-safety.

---

## 3. Rendering architecture — one module, three surfaces

```
                  seedToAvatarParams(seed, version)   ← single source of truth
                 /                |                    \
   v1: Satori /og PNG     v2: live CSS/React orb     v3: Remotion MP4
   (emails, social,        (header, profile          (shareable
    <img>, favicon)         while in-app)             "your blob" clips)
```

- **v1 — static PNG via the existing Satori `/og`-style edge route.** Add `/avatar/[seed]` (or
  `/og/avatar?seed=&v=&size=`). Reuse `src/lib/seo/og-scene.tsx`'s blob machinery; swap title-hash → `avatar_seed`,
  pattern-color → OKLCH-derived hex. Smallest shippable change, covers the most surfaces.
- **v2 — live in-app blob** rendered by the existing CSS/React orb, *consuming the same params module*. Glow /
  inset-shadow / `filter: blur` are fine here (real CSS, not Satori). Use the live React component for the header
  (you have it; it animates; it's free).
- **v2.5 (escape hatch, build only if needed)** — a separate `image/svg+xml` route for true multi-lobe parametric
  silhouettes, gated by the Phase-0 render test. Don't build in v1.
- **v3 — Remotion MP4, optional.** Ground truth: `tools/orb-video` is **not in this repo** — it's a sibling
  worktree (`/Users/abi/Sites/deepbreathing-orb-video/tools/orb-video/src`) that *re-ports* the math (own
  `breathing.ts`/`colors.ts`/`particles.ts`), it does not import it. So "one shared module feeds Remotion" is **not
  true today**. To honor single-source-of-truth: (a) add a `file:` dependency from the Remotion project onto the
  main app's `params.ts`, or (b) duplicate the module and add a **parity test** asserting byte-identical
  `seedToAvatarParams` output for a fixed seed set across both copies.

---

## 4. Storage / caching / versioning

- **Store the seed, render on the fly. No Vercel Blob in v1.** The generator is pure, so the URL
  `(seed, version, size)` *is* the cache key. Serve `Cache-Control: public, immutable, max-age=31536000`. Add Blob
  only if 1200px social renders become a measured cost/latency problem under load.
- **DB:** do **not** alter better-auth's managed `user` table. Add a side table (or existing settings table) with
  `avatar_seed TEXT`, `avatar_version INT`. Default both at user-create via the **`databaseHooks` block already in
  `src/lib/auth.ts:49`** (same hook that fires the welcome email). Anon users get no DB row (device id is the seed).
- **Versioning:** put `version` in both the params function and the cache key, and **pin each user's version at
  creation.** A future generator ships as `version + 1` and never silently changes existing faces; a bad render
  rolls *forward* (new key) instead of being cached forever.
- **Re-roll:** write a new `avatar_seed` (optionally bump to latest version) → new URL → new cache entry; old entry
  harmlessly expires. No invalidation needed.
- **Favicon delivery (de-scoped from v1):** a per-user dynamic favicon needs a Next.js dynamic `icon` route, and
  browsers cache favicons aggressively / ignore many formats at 16–32px. Use a static brand favicon site-wide;
  treat per-user favicons as a separate, explicitly-scoped task.
- **Cold-start / error fallback (mandatory):** define a brand-default blob (fixed seed) for brand-new users before
  any seed exists, and make the `/avatar` route return that default on any error rather than a broken image — a
  broken `<img>` in a welcome email is a visible failure.

---

## 5. Phased implementation plan (least new infra)

**Phase 0 — validation spike (gate, ~30–60 min). Do this first.**
Write `seedToAvatarParams` + the OKLCH→hex+gamut-clamp converter. Render a **contact sheet of ~50 seeds** at
32 / 64 / 256px. Inspect for pleasingness, small-size distinguishability, colorblind-safety (simulate). Tune the
L/C/H bands and the corners-sum rule against pixels. While here, run the **one render-verification experiment**:
pass an inline `<svg><path>` through `ImageResponse` and confirm whether the PNG contains the path — de-risks (or
kills) the v2.5 path escape hatch before anything depends on it.

**Phase 1 — v1 static PNG (smallest shippable).**
- `src/lib/avatar/params.ts` — the shared module (§1.7).
- Parameterize the existing `/og` Satori route → `/avatar/[seed]?v=&size=`, reusing `og-scene.tsx` with the new
  color + border-radius.
- Add `avatar_seed` + `avatar_version`, defaulted in the `databaseHooks` block (`auth.ts:49`).
- Anon → signed-in seed migration on first sign-in.
- Wire the avatar `<img>` into header, profile, and the better-auth Resend **welcome email**.
- Cold-start default + error-fallback image.

**Phase 2 — v2 live in-app blob.**
- Point the existing CSS/React orb at `seedToAvatarParams`. Real CSS → glow/blur/inset-shadow are back. Same
  border-radius morph keyframes → header blob and emailed PNG are visibly the same identity (t=0 frame).
- *(Optional v2.5)* the non-Satori `image/svg+xml` `/avatar` route, only if you outgrow border-radius — gated by
  the Phase-0 render test.

**Phase 3 — v3 Remotion shareable (optional).**
- Reconcile the re-ported math via `file:` dep or a byte-parity test (§3).

---

## Single biggest technical risk — restated

The brief nominated "Satori can't render arbitrary parametric SVG blob paths." **By choosing border-radius as the
silhouette DNA, you never take that risk on** — v1 ships entirely inside Satori's proven envelope. The risks that
*actually* remain, in order:

1. **Aesthetic, unvalidated** — nobody has rendered the avatars. → Phase-0 contact sheet (a gate).
2. **OKLCH→sRGB gamut clipping** — fixed-chroma designs go muddy for some hues. → mandatory chroma clamp (§1.4).
3. **Cross-runtime float drift** — edge V8 vs Remotion Node can disagree on the last hex byte. → quantize H/L/C to
   a fixed grid before conversion (§1.4).
4. **The path question itself** — deferred, not solved ("source-indicated, not render-verified"). → the one
   Phase-0 render test, before any v2.5 path route depends on it.

**Key file paths:** `src/app/og/route.tsx`, `src/lib/seo/og-scene.tsx`, `src/lib/auth.ts` (databaseHooks ~line 49),
new `src/lib/avatar/params.ts`, new `src/app/avatar/[seed]/route.tsx`. Remotion lives out-of-repo at
`/Users/abi/Sites/deepbreathing-orb-video/tools/orb-video/src/`.
