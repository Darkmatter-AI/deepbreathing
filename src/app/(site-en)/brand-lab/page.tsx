import type { Metadata } from "next";
import Link from "next/link";

import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const ogImage = createOgImagePath("Deep Breathing Brand Lab", {
  subtitle: "Three visual directions for the site",
  color: "#e11d48",
});

export const metadata: Metadata = {
  title: "Brand Lab",
  description:
    "An internal visual exploration page for Deep Breathing Exercises with three candidate brand directions.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${siteUrl}/brand-lab`,
  },
  openGraph: {
    title: "Deep Breathing Brand Lab",
    description:
      "Three candidate visual directions for the future Deep Breathing Exercises brand.",
    url: `${siteUrl}/brand-lab`,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Deep Breathing brand exploration page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Breathing Brand Lab",
    description:
      "Three candidate visual directions for the future Deep Breathing Exercises brand.",
    images: [ogImage],
  },
};

type Concept = {
  name: "Soft Orbit" | "Signal Glow" | "Quiet Editorial";
  strap: string;
  summary: string;
  logo: string;
  palette: string[];
  cues: string[];
  personality: string;
  interfaceMood: string;
  note: string;
};

const concepts: Concept[] = [
  {
    name: "Soft Orbit",
    strap: "Warm, luminous, body-first calm",
    summary:
      "Build the brand around the feeling that your nervous system is being gently guided back into rhythm.",
    logo: "Resonance",
    palette: ["#fff6ef", "#ffd6c7", "#ff9e7a", "#e11d48", "#4a1d1f"],
    cues: ["orbital glow", "gentle gradients", "rounded forms", "felt safety"],
    personality: "Human, soft, sensorial, quietly premium.",
    interfaceMood: "The current site is already closest to this direction.",
    note: "Best if we want the product to feel emotionally restorative rather than informational.",
  },
  {
    name: "Signal Glow",
    strap: "Biofeedback, rhythm, nervous-system tech",
    summary:
      "Position the experience as precision breath training with visible signals, timing, and measurable composure.",
    logo: "DB / Resonance",
    palette: ["#07111f", "#103153", "#0ea5e9", "#67e8f9", "#dff8ff"],
    cues: ["waveforms", "grid rhythm", "pulse rings", "focused contrast"],
    personality: "Confident, modern, measured, performance-oriented.",
    interfaceMood: "Useful if we want more authority with athletes, focus, HRV, and stress-performance queries.",
    note: "Best if the brand should feel like a calm instrument instead of a wellness product.",
  },
  {
    name: "Quiet Editorial",
    strap: "Trusted guidance, restrained and intelligent",
    summary:
      "Frame the site as the most beautifully edited breathing reference on the web: less app energy, more trusted companion.",
    logo: "Deep Breathing",
    palette: ["#f8f3ec", "#ddd0bf", "#8f6d52", "#36261e", "#18110d"],
    cues: ["serif voice", "breathing room", "paper warmth", "editorial hierarchy"],
    personality: "Assured, literate, calm, timeless.",
    interfaceMood: "Best if the content library and translations become the main moat.",
    note: "This would differentiate the site from generic app-like breathwork tools.",
  },
];

function toSectionId(name: Concept["name"]) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function BrandMark({ concept }: { concept: Concept }) {
  if (concept.name === "Soft Orbit") {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute h-28 w-28 rounded-full border border-white/50" />
        <div className="absolute h-20 w-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffd8c2_0%,#ff9e7a_48%,#e11d48_100%)] shadow-[0_0_70px_rgba(225,29,72,0.32)]" />
        <div className="absolute h-8 w-8 -translate-x-10 translate-y-8 rounded-full bg-white/80 blur-[1px]" />
      </div>
    );
  }

  if (concept.name === "Signal Glow") {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#08111d]">
        <div className="absolute inset-4 rounded-[1.4rem] border border-cyan-300/20" />
        <div className="absolute h-px w-24 bg-cyan-300/50" />
        <div className="absolute h-24 w-24 rounded-full border border-sky-400/30" />
        <div className="absolute h-14 w-14 rounded-full bg-[radial-gradient(circle,#67e8f9_0%,#0ea5e9_65%,transparent_66%)] blur-[1px]" />
      </div>
    );
  }

  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-stone-700/10 bg-[#f3ece2]">
      <div className="absolute inset-4 rounded-[1.4rem] border border-stone-700/10" />
      <div
        className="text-center text-[2.1rem] leading-none text-[#2c1f18]"
        style={{ fontFamily: "Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif" }}
      >
        db
      </div>
    </div>
  );
}

function PreviewPanel({ concept }: { concept: Concept }) {
  if (concept.name === "Soft Orbit") {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-rose-200/60 bg-[linear-gradient(145deg,#fff9f3_0%,#ffe3d2_42%,#ffd4de_100%)] p-6 text-[#4a1d1f] shadow-[0_30px_90px_rgba(225,29,72,0.12)]">
        <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-rose-300/40 blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="relative flex min-h-[20rem] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-700/70">soft orbit</p>
            <h3 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">Calm arrives as a felt shift.</h3>
            <p className="mt-4 max-w-md text-base text-rose-950/70">
              Warmth, glow, and gentle motion make the experience feel like it is holding your attention rather than demanding it.
            </p>
          </div>
          <div className="mt-10 flex items-end justify-between gap-6">
            <div className="relative h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffd8c2_0%,#ff9e7a_40%,#e11d48_100%)] shadow-[0_0_100px_rgba(225,29,72,0.3)]">
              <div className="absolute inset-[-1rem] rounded-full border border-white/60" />
              <div className="absolute inset-[1.3rem] rounded-full border border-white/25" />
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-white/60 px-5 py-4 backdrop-blur-md">
              <p className="text-sm uppercase tracking-[0.28em] text-rose-700/70">Tagline</p>
              <p className="mt-2 text-2xl font-medium">Breathe back into balance</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (concept.name === "Signal Glow") {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(160deg,#07111f_0%,#0d1f35_55%,#12304d_100%)] p-6 text-cyan-50 shadow-[0_30px_90px_rgba(7,17,31,0.45)]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative flex min-h-[20rem] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">signal glow</p>
            <h3 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">Train composure like a system.</h3>
            <p className="mt-4 max-w-md text-base text-cyan-50/72">
              Breath patterns become visual signals. The brand feels measured, crisp, and quietly high-performance.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-[1.3fr,0.7fr]">
            <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-100/5 p-5">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/70">Live cadence</p>
              </div>
              <div className="mt-5 flex items-center gap-3">
                {[24, 52, 36, 70, 28, 18].map((height, index) => (
                  <span
                    key={height}
                    className="block w-5 rounded-full bg-[linear-gradient(180deg,#67e8f9_0%,#0ea5e9_100%)]"
                    style={{ height, opacity: 1 - index * 0.08 }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-100/5 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/70">State</p>
              <p className="mt-4 text-4xl font-semibold">4.2</p>
              <p className="mt-2 text-sm text-cyan-50/70">cycles complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-300 bg-[linear-gradient(160deg,#fbf7f0_0%,#f2e8db_100%)] p-6 text-[#2c1f18] shadow-[0_30px_90px_rgba(54,38,30,0.12)]">
      <div className="relative flex min-h-[20rem] flex-col justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-[0.35em] text-stone-600"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            quiet editorial
          </p>
          <h3
            className="mt-4 max-w-md text-5xl leading-[1.02]"
            style={{ fontFamily: "Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif" }}
          >
            Guidance you trust at a slower pace.
          </h3>
          <p className="mt-4 max-w-md text-base text-stone-700">
            This direction gives the content more gravity and gives the brand a calmer, more timeless authority.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[1.5rem] border border-stone-300/90 bg-white/65 p-5">
            <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Editorial note</p>
            <p className="mt-4 text-lg leading-relaxed text-stone-800">
              Small, steady breaths often work better than forceful ones.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-stone-300/90 bg-[#f8f2e8] p-5">
            <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
              <span className="text-sm uppercase tracking-[0.28em] text-stone-500">Method</span>
              <span className="text-sm text-stone-500">Issue 01</span>
            </div>
            <p
              className="mt-5 text-3xl leading-tight"
              style={{ fontFamily: "Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif" }}
            >
              The most useful breathing guide is the one that feels quiet enough to trust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandLabPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8f2_0%,#fff2ea_26%,#f8efe6_100%)] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_30px_80px_rgba(74,29,31,0.08)] backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.38em] text-rose-700/70">Deep Breathing Brand Lab</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Three visual directions for making the site feel more like a brand.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-700">
                This page is intentionally opinionated. Each concept pushes a different emotional promise so you can point to the one that feels most true.
              </p>
            </div>
            <div className="max-w-sm rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-stone-500">How To React</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
                <li>Which one feels most native to the current breathing orb?</li>
                <li>Which one feels most ownable as a future logo system?</li>
                <li>Which one would still feel good after the 200th translated page?</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-5 rounded-[2rem] border border-white/60 bg-white/50 p-4 backdrop-blur-md sm:grid-cols-3">
          {concepts.map((concept) => (
            <a
              key={concept.name}
              href={`#${toSectionId(concept.name)}`}
              className="rounded-[1.4rem] border border-stone-200/80 bg-white/80 px-4 py-4 transition-transform hover:-translate-y-0.5"
            >
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">{concept.name}</p>
              <p className="mt-2 text-sm text-stone-700">{concept.strap}</p>
            </a>
          ))}
        </div>

        <section className="grid gap-10">
          {concepts.map((concept) => {
            const sectionId = toSectionId(concept.name);
            return (
              <section
                id={sectionId}
                key={concept.name}
                className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/60 p-5 shadow-[0_24px_70px_rgba(74,29,31,0.08)] backdrop-blur-md lg:grid-cols-[0.9fr,1.1fr] lg:p-6"
              >
                <div className="rounded-[1.7rem] border border-stone-200/80 bg-white/70 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{concept.name}</p>
                      <h2 className="mt-3 text-3xl font-semibold">{concept.strap}</h2>
                    </div>
                    <BrandMark concept={concept} />
                  </div>

                  <p className="mt-6 text-base leading-relaxed text-stone-700">{concept.summary}</p>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Logo Attitude</p>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">{concept.logo}</p>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Palette</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {concept.palette.map((color) => (
                        <div key={color} className="space-y-2">
                          <div
                            className="h-10 w-10 rounded-full border border-black/5 shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-stone-500">{color}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Keywords</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {concept.cues.map((cue) => (
                          <span
                            key={cue}
                            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-600"
                          >
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Personality</p>
                      <p className="mt-3 text-sm leading-relaxed text-stone-700">{concept.personality}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 rounded-[1.4rem] border border-stone-200/90 bg-stone-50/80 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Interface Mood</p>
                      <p className="mt-2 text-sm leading-relaxed text-stone-700">{concept.interfaceMood}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Brand Note</p>
                      <p className="mt-2 text-sm leading-relaxed text-stone-700">{concept.note}</p>
                    </div>
                  </div>
                </div>

                <PreviewPanel concept={concept} />
              </section>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,#fffdfb_0%,#fff6ef_100%)] p-6 shadow-[0_24px_70px_rgba(74,29,31,0.06)]">
          <div className="grid gap-5 lg:grid-cols-[1fr,auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Gut Check</p>
              <h2 className="mt-3 text-3xl font-semibold">What I’d bet on today</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-700">
                <strong>Soft Orbit</strong> feels like the natural evolution of what is already working. <strong>Signal Glow</strong> is the best challenger if you want more authority and product energy. <strong>Quiet Editorial</strong> is the smartest wildcard if translations and evergreen content become the main moat.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
