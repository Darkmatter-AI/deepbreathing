# Direct traffic investigation — is the website being shared?

**Date**: 2026-05-12
**Question**: Direct/no-tag traffic is substantial — is this word-of-mouth sharing, or returning users / branded recall / noise? Should we invest in sound + illustrations to amplify sharing?
**Method**: GA4 (DKMT property `527524722`) Traffic Acquisition + Landing Page reports, 28–30d window. Codebase audit of `src/lib/analytics/google-analytics.ts` and `src/app/layout.tsx`.

---

## Headline

The sharing hypothesis is **partially confirmed but not dominant**. Real evidence that people are pasting deep links to the visualizer, but Direct is mostly returning users with brief sessions. Sound is still the right investment because it would lift the exact weakness in the data (short Direct sessions). Illustrations should wait.

UTM-tagged share buttons shipped in `d81f5e7` (2 commits before this analysis) — re-pull in ~14 days to actually measure the share channel via `utm_source` instead of inferring from Direct.

---

## Traffic acquisition, last 30 days (Apr 12 – May 11, 2026)

| Channel | Sessions | % | Engagement rate | Avg engagement | Events/session |
|---|---:|---:|---:|---:|---:|
| Organic Search | 784 | 49.1% | 61.1% | 1m 27s | 6.85 |
| **Direct** | **584** | **36.6%** | **45.0%** | **51s** | 6.74 |
| Referral | 122 | 7.6% | 59.8% | 1m 32s | 6.98 |
| Unassigned | 104 | 6.5% | 53.9% | 1m 03s | 6.84 |
| Organic Social | 5 | 0.3% | 60.0% | 39s | 6.60 |
| **Total** | **1,596** | 100% | 54.8% | 1m 12s | 6.83 |

**Key signal**: Direct's engagement rate (45%) and avg time (51s) are roughly *half* of Organic's (61% / 1m 27s). If Direct were dominantly word-of-mouth shares, you'd expect *higher* engagement than organic, not lower. So Direct is a mix — some shares, mostly something else.

---

## Landing pages, last 28 days (Apr 14 – May 11, all channels)

| Rank | Page | Sessions | % | New users | % new | Avg eng. |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `/` | 208 | 13.7% | 121 | 58% | 1m 14s |
| 2 | `/breathing-visualizer` | 200 | 13.2% | 161 | **80%** | 1m 34s |
| 3 | `(not set)` | 151 | 9.9% | 0 | **0%** | **25s** |
| 4 | `/breathe/coherent` | 118 | 7.8% | 34 | 29% | **2m 30s** |
| 5 | `/breathe/4-7-8` | 86 | 5.7% | 50 | 58% | 29s |
| 6 | `/breathe/box` | 83 | 5.5% | 54 | 65% | 1m 05s |
| 7 | `/4-7-8-breathing-timer` | 77 | 5.1% | 56 | 73% | 1m 20s |

Total in window: 1,519 sessions, 967 active users, 918 new users.

---

## Interpretation

Three things are mixed into the "Direct" bucket:

1. **Returning users** (largest slice). Brand recall, direct type-ins, bookmark hits. Short sessions (people coming back for a quick breathing round) explain the 51s avg.
2. **Word-of-mouth sharing IS happening.** Strongest evidence: `/breathing-visualizer` is the #2 landing page with **80% new users (161/200)** at 1m 34s engagement. That page has no SEO authority (DR 0.2, not a primary keyword target) — cold strangers don't land there from Google. Someone is pasting `deepbreathingexercises.com/breathing-visualizer` into chat apps and friends are clicking through.
3. **iOS Safari / dark social.** Some referrers get stripped by iMessage, WhatsApp, Signal, in-app browsers. These show up as Direct.

The loyal-core signal is also visible: `/breathe/coherent` lands 71% returning users at **2m 30s engagement** — that's the deepest engagement of any landing page. Coherent breathing has a small but devoted return audience.

---

## What this means for sound + illustrations

**Sound — ship it.** The 51s vs 1m 27s engagement gap on Direct landings is exactly the gap an immersive audio layer would close. When someone lands cold from a pasted link with zero context, audio signals "this is an experience, not a tool." Audio also gives a shareable sensory hook (people screen-record and re-share calming experiences).

**Illustrations — hold.** The orb is already pulling 1m 34s engagement at 80% new users on `/breathing-visualizer`. Adding scene art risks fragmenting the minimal visual identity that's already working. Revisit after we have UTM share-channel data.

---

## Open thread — `(not set)` landing page

151 sessions, 0 new users, 25s engagement. All returning users, no captured landing path. See [direct-traffic-not-set-investigation-2026-05-12.md](./direct-traffic-not-set-investigation-2026-05-12.md) — fixing this sharpens every future attribution analysis.

---

## Followups

1. **+14 days**: Re-pull traffic acquisition filtered to `utm_source` containing "share" to size the real word-of-mouth channel now that share buttons are UTM-tagged (`d81f5e7`).
2. **Sound experiment**: Log a PRODUCT-EXPERIMENTS entry with hypothesis "minimal audio layer lifts Direct-landing avg engagement from 51s → ≥1m 02s (+20%)" before shipping.
3. **Fix `(not set)` landing**: see linked doc.
