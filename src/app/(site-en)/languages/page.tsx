import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://deepbreathingexercises.com";

const LOCALES = [
  { prefix: "", native: "English", name: "English", code: "en" },
  { prefix: "/es", native: "Español", name: "Spanish", code: "es" },
  { prefix: "/pt", native: "Português", name: "Portuguese (Brazil)", code: "pt" },
  { prefix: "/fr", native: "Français", name: "French", code: "fr" },
  { prefix: "/de", native: "Deutsch", name: "German", code: "de" },
  { prefix: "/ja", native: "日本語", name: "Japanese", code: "ja" },
] as const;

const KEY_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/breathe", label: "Techniques" },
  { path: "/for", label: "Use cases" },
  { path: "/breathing-visualizer", label: "Breathing visualizer" },
  { path: "/breathing-app", label: "Breathing app" },
  { path: "/4-7-8-breathing-timer", label: "4-7-8 breathing timer" },
  { path: "/box-breathing-app", label: "Box breathing app" },
  { path: "/coherent-breathing-app", label: "Coherent breathing app" },
  { path: "/breathe/4-7-8", label: "4-7-8 breathing" },
  { path: "/breathe/box", label: "Box breathing" },
  { path: "/breathe/buteyko", label: "Buteyko breathing" },
  { path: "/breathe/coherent", label: "Coherent breathing" },
  { path: "/breathe/tummo", label: "Tummo breathing" },
  { path: "/breathe/ujjayi", label: "Ujjayi breathing" },
  { path: "/breathe/wim-hof", label: "Wim Hof breathing" },
  { path: "/breathe/physiological-sigh", label: "Physiological sigh" },
  { path: "/breathe/belly", label: "Belly breathing" },
  { path: "/breathe/breath-of-fire", label: "Breath of fire" },
  { path: "/breathe/nadi-shodhana", label: "Nadi Shodhana" },
  { path: "/breathe/pursed-lip", label: "Pursed-lip breathing" },
  { path: "/for/anxiety", label: "For anxiety" },
  { path: "/for/panic-attacks", label: "For panic attacks" },
  { path: "/for/sleep", label: "For sleep" },
  { path: "/for/stress", label: "For stress" },
  { path: "/for/huberman", label: "Huberman protocols" },
];

function resolveHref(prefix: string, path: string): string {
  if (path === "/") return `${SITE_URL}${prefix || "/"}`;
  return `${SITE_URL}${prefix}${path}`;
}

export const metadata: Metadata = {
  title: "Languages — Deep Breathing Exercises in 6 languages",
  description:
    "Deep Breathing Exercises is available in English, Español, Português, Français, Deutsch, and 日本語. Jump straight to techniques and guides in your language.",
  alternates: { canonical: `${SITE_URL}/languages` },
  robots: { index: true, follow: true },
};

export default function LanguagesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
        Available in 6 languages
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Deep Breathing Exercises is translated into Spanish, Portuguese, French, German, and
        Japanese. Each language has its own set of breathing techniques, timers, and guides.
        Pick a language below to browse translated pages.
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {LOCALES.map(({ prefix, native, name, code }) => (
          <section key={code} aria-labelledby={`lang-${code}`} className="space-y-3">
            <h2
              id={`lang-${code}`}
              lang={code === "en" ? undefined : code}
              className="text-xl font-semibold text-foreground"
            >
              <a
                href={resolveHref(prefix, "/")}
                className="underline underline-offset-4 hover:text-primary"
              >
                {native}
              </a>
              <span className="ml-2 text-sm font-normal text-muted-foreground">({name})</span>
            </h2>
            <ul className="space-y-1.5 text-sm">
              {KEY_PAGES.map(({ path, label }) => (
                <li key={path}>
                  <a
                    href={resolveHref(prefix, path)}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4 hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
