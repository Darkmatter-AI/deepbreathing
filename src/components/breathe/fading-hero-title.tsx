// Server component: renders the hero heading/subtitle as static markup. The fade
// on session start is driven by pure CSS (globals.css:
// body[data-resonance-running] .resonance-hero-fade) using a body attribute set
// by the (already-loaded) Resonance chunk, so NO run-state listener component
// lands in the route's first-load JS.
function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface FadingHeroTitleProps {
  label: string;
  title: string;
  subtitle: string;
  headingLevel?: 1 | 2;
  className?: string;
  children?: React.ReactNode;
}

export function FadingHeroTitle({ label, title, subtitle, headingLevel = 1, className, children }: FadingHeroTitleProps) {
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  return (
    <div
      className={joinClasses(
        "resonance-hero-fade space-y-4 text-foreground drop-shadow-sm transition-all duration-500",
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
