"use client";

import { createElement, lazy, Suspense } from "react";

// The footer language switcher renders nothing until it mounts on the client
// (it returns null until a client-only effect resolves the current locale), so
// deferring it is SEO- and UX-neutral while keeping its module out of the
// first-load JS bundle. Using React.lazy + Suspense (both already in the
// framework chunk) instead of next/dynamic avoids bundling next/dynamic's
// react-loadable runtime into each page's first-load chunk. SSR shows the null
// fallback, matching its existing client-only render.
const LazyLanguageSwitcherFooter = lazy(() =>
  import("@/components/language-switcher").then((m) => ({
    default: m.LanguageSwitcherFooter,
  }))
);

export function LanguageSwitcherFooter() {
  // createElement (not JSX) keeps react/jsx-runtime out of the page's first-load
  // client chunk; createElement is already in the shared React framework chunk.
  return createElement(Suspense, { fallback: null }, createElement(LazyLanguageSwitcherFooter, null));
}
