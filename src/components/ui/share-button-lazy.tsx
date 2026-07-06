"use client";

import { createElement, lazy, Suspense } from "react";
import type { ShareButtonProps } from "@/components/ui/share-button";

// ShareButton is interaction-gated (share / copy-embed) and already renders
// client-only. Declaring the dynamic(ssr:false) import inside a Server Component
// (pattern-page) still pulls its chunk into first-load JS; wrapping it in this
// "use client" module defers the chunk until after hydration. Using React.lazy +
// Suspense (both already in the framework chunk) instead of next/dynamic avoids
// bundling next/dynamic's react-loadable runtime into each page's first-load
// chunk. ShareButton renders client-only, so SSR shows the null fallback.
const LazyShareButton = lazy(() =>
  import("@/components/ui/share-button").then((m) => ({
    default: m.ShareButton,
  }))
);

export function ShareButton(props: ShareButtonProps) {
  // createElement (not JSX) keeps react/jsx-runtime out of the page's first-load
  // client chunk; createElement is already in the shared React framework chunk.
  return createElement(Suspense, { fallback: null }, createElement(LazyShareButton, props));
}
