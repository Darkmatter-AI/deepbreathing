# `(not set)` landing page — root cause + proposed fix

**Date**: 2026-05-12
**Question**: GA4 reports 151 sessions (9.9% of last 28d) with Landing page = `(not set)`, 0 new users, 25s avg engagement. What causes these, and how do we fix attribution?
**Method**: GA4 Landing Page report inspection + codebase audit of `src/lib/analytics/google-analytics.ts`, `src/app/layout.tsx`, `src/components/resonance/Resonance.tsx`.

---

## Diagnosis

**`(not set)` happens because no `page_view` event was associated with the session's first hit.** GA4 assigns landing-page from the first `page_view` event in a session; if events fire before/without a `page_view`, the landing column is blank.

In our codebase, GA4 is initialised exactly once on each hard page load:

```ts
// src/lib/analytics/google-analytics.ts:5
gtag('config','G-53DLCBMRL3');
```

…injected via `<Script strategy="afterInteractive">` in `src/app/layout.tsx:89-91`. The `config` call implicitly fires one `page_view`. There is **no client-side route-change listener** that re-fires `page_view` (verified: `grep -rn "page_view" src` returns only one occurrence, the custom `page_viewed_breathing` event in `Resonance.tsx:1026`).

This produces `(not set)` in two scenarios:

### Scenario A — Session timeout on a long-lived tab (likely majority cause)

1. User loads a breathing page → `page_view` fires → landing page is recorded correctly.
2. Tab stays open; user walks away.
3. GA4 default 30-min idle timeout expires.
4. User returns and clicks "Start" → `breathing_session_start` fires.
5. GA4 auto-fires `session_start` for the new session, but **no fresh `page_view`** because the page never reloaded.
6. The new session's only events are the custom ones → landing page = `(not set)`.

**Strong evidence for this:**
- 151 sessions, **0 new users** — every single `(not set)` session is a returning user. A user-acquisition cause (e.g. bots, broken referrers) would show some new users.
- 25s avg engagement — matches "user comes back, does one quick thing, leaves."
- 90 active users behind 151 sessions = ~1.7 sessions per user → these are repeat-return patterns.

### Scenario B — Client-side navigation between two routes that share the same React tree (minor)

Next.js App Router navigation uses `history.pushState`. GA4's Enhanced Measurement **does** auto-detect history changes if enabled — but if a custom `trackEvent` call fires before the auto `page_view` (race condition) or if Enhanced Measurement is disabled for this stream, the landing page is unset. Worth checking Admin → Data Streams → Enhanced measurement settings.

---

## Why this matters

`(not set)` is currently the **#3 landing page (9.9% of sessions)**. Every "what's our top landing page?" or "which page do shared links arrive on?" question is being silently distorted by ~10%. Fixing it sharpens:

- Direct-traffic landing analysis (the very question that triggered this investigation)
- Per-page funnel measurement
- Future share-channel attribution once UTM-tagged shares (`d81f5e7`) ramp up

---

## Proposed fix

Add a single client component that fires a `page_view` event on every route change. Standard Next.js App Router pattern:

```tsx
// src/components/analytics/PageViewTracker.tsx
'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (typeof window === 'undefined' || typeof (window as any).gtag !== 'function') return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);
  return null;
}
```

Mount it in `src/app/layout.tsx` inside `<body>`, ideally before `<AuthProvider>`.

**Important**: To prevent a *double* `page_view` on initial load (Scenario A's reset depends on this), update `GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT` to disable the auto page_view:

```ts
// src/lib/analytics/google-analytics.ts
export const GOOGLE_ANALYTICS_INLINE_INIT_SCRIPT =
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GOOGLE_ANALYTICS_MEASUREMENT_ID}',{send_page_view:false});`;
```

This way `PageViewTracker` is the single source of `page_view` events, fires on initial render *and* every subsequent route change, and the data is consistent.

**This alone won't fix Scenario A** (timeout while tab is open). For that, also fire `page_view` on `visibilitychange` when the tab becomes visible:

```tsx
// inside PageViewTracker useEffect, add a separate effect
useEffect(() => {
  if (typeof document === 'undefined') return;
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    if (typeof (window as any).gtag !== 'function') return;
    (window as any).gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}, []);
```

This re-fires `page_view` every time the user returns to the tab. If GA4 has timed the session out, the new `page_view` will be the first hit of the new session — landing page = correct URL.

(Caveat: this also fires `page_view` on visibility return even within an existing session, slightly inflating event_count for `page_view`. Acceptable trade-off; `session_start` count is unaffected and is the metric that matters for landing-page attribution.)

---

## Test plan

1. Apply the fix locally; open `localhost:3000`, leave tab open 35 minutes, return and click "Start". In GA4 DebugView, verify a new `session_start` fires with a `page_view` immediately before it on the same hit, and that landing page shows the correct path.
2. Ship to prod; wait 7 days; check Landing Page report. Expectation: `(not set)` drops from ~10% to <1%. If it doesn't, Scenario B is also contributing — re-investigate Enhanced Measurement settings.

---

## Followups

1. Implement the `PageViewTracker` + `send_page_view:false` change in one PR (small, ~30 lines).
2. After 7 days in prod, re-pull Landing Page report — confirm `(not set)` collapsed.
3. If collapse is partial, check GA4 Admin → Data Streams → Web Stream → Enhanced measurement → "Page changes based on browser history events" is enabled.
