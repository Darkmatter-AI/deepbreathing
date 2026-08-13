"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

/**
 * Keep the browser-only visualizer behind a client boundary. Next 15 no longer
 * permits `ssr: false` directly in Server Components, so pages import this
 * client wrapper instead of declaring their own dynamic island.
 */
const DynamicResonance = dynamic(
  () => import("./Resonance"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="min-h-screen flex items-center justify-center bg-background"
      >
        <div className="h-12 w-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    ),
  },
);

export type ResonanceClientProps = ComponentProps<typeof DynamicResonance>;

export function ResonanceClient(props: ResonanceClientProps) {
  return <DynamicResonance {...props} />;
}
