"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface FadingHeroTitleProps {
  label: string;
  title: string;
  subtitle: string;
  headingLevel?: 1 | 2;
  className?: string;
  children?: React.ReactNode;
}

export function FadingHeroTitle({ label, title, subtitle, headingLevel = 1, className, children }: FadingHeroTitleProps) {
  const [running, setRunning] = useState(false);
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  useEffect(() => {
    const handleRunState = (event: Event) => {
      const custom = event as CustomEvent<{ running: boolean }>;
      setRunning(Boolean(custom.detail?.running));
    };

    window.addEventListener("resonance:run-state", handleRunState);
    return () => window.removeEventListener("resonance:run-state", handleRunState);
  }, []);

  return (
    <div
      className={cn(
        "space-y-4 text-foreground drop-shadow-sm transition-all duration-500",
        running ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        className
      )}
    >
      <p className="text-xs uppercase tracking-[0.35em] text-primary">{label}</p>
      <div>
        <HeadingTag className="text-xl font-semibold text-foreground sm:text-4xl lg:text-5xl">{title}</HeadingTag>
        <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-lg">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
