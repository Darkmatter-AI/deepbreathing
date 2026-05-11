"use client";

import Resonance from "@/components/resonance/Resonance";
import { ModeName } from "@/components/resonance/constants";

export function BreathingVisualizer({ className }: { className?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return (
    <section className={`relative isolate flex min-h-[60vh] w-full flex-col bg-transparent lg:min-h-screen${className ? ` ${className}` : ""}`}>
      <div className="relative flex flex-1 flex-col w-full min-h-0">
        <Resonance
          apiKey={apiKey}
          className="flex-1 min-h-[60vh] w-full overflow-hidden lg:min-h-screen"
          defaultMode={ModeName.Box}
          noMobileBottomPad
        />
      </div>
    </section>
  );
}
