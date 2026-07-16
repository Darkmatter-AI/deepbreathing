"use client";

import dynamic from "next/dynamic";

const SnowBackground = dynamic(
  () => import("@/components/resonance/components/SnowBackground"),
  {
    loading: () => (
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-slate-950" />
    ),
    ssr: false,
  },
);

export function HolidaySnowBackground() {
  return <SnowBackground tone="dark" />;
}
