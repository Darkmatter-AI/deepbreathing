"use client";

import { useState } from "react";
import Link from "next/link";

import { LanguageSwitcherFooter } from "@/components/language-switcher";
import type {
  EmbedGeneratorLocaleCode,
  EmbedGeneratorProps,
} from "@/i18n/content/bespoke/embed/types";

const EMBED_BASE = "https://deepbreathingexercises.com/embed";

type ThemeOption = "auto" | "light" | "dark";
type LocaleCode = EmbedGeneratorLocaleCode;

const DURATION_VALUES = [null, 30, 60, 180, 300, 600] as const;

function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  const ta = document.createElement("textarea");
  ta.value = value;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  return Promise.resolve();
}

function buildEmbedUrl(
  slug: string,
  theme: ThemeOption,
  localePrefix: string,
  duration: number | null,
  binaural: boolean,
  eyesClosed: boolean,
): string {
  const params = new URLSearchParams();
  if (theme !== "auto") params.set("theme", theme);
  if (duration !== null) params.set("duration", String(duration));
  // Only emit non-default values so existing snippets stay short.
  if (!binaural) params.set("binaural", "0");
  if (eyesClosed) params.set("eyesClosed", "1");
  const qs = params.toString();
  const base = localePrefix
    ? `https://deepbreathingexercises.com${localePrefix}/embed`
    : EMBED_BASE;
  return `${base}/${slug}${qs ? `?${qs}` : ""}`;
}

function buildPreviewUrl(
  slug: string,
  theme: ThemeOption,
  localePrefix: string,
  duration: number | null,
  binaural: boolean,
  eyesClosed: boolean,
): string {
  const params = new URLSearchParams();
  if (theme !== "auto") params.set("theme", theme);
  if (duration !== null) params.set("duration", String(duration));
  if (!binaural) params.set("binaural", "0");
  if (eyesClosed) params.set("eyesClosed", "1");
  const qs = params.toString();
  return `${localePrefix}/embed/${slug}${qs ? `?${qs}` : ""}`;
}

function fillPatternTemplate(template: string, pattern: string): string {
  return template.replace("{pattern}", pattern);
}

export function EmbedGenerator({
  content,
  footerLinks,
  initialLocale,
  localeOptions,
  pageLocale,
  patterns,
}: EmbedGeneratorProps) {
  const [selectedSlug, setSelectedSlug] = useState("box");
  const [theme, setTheme] = useState<ThemeOption>("auto");
  const [locale, setLocale] = useState<LocaleCode>(initialLocale);
  const [duration, setDuration] = useState<number | null>(60);
  const [binaural, setBinaural] = useState(true);
  // eyesClosed param plumbing kept in URL builder for internal testing, but
  // not surfaced as a generator toggle until narration ships.
  const eyesClosed = false;
  const [copied, setCopied] = useState(false);

  const durationOptions = [
    { label: content.durationLabels.open, value: DURATION_VALUES[0] },
    { label: content.durationLabels.seconds30, value: DURATION_VALUES[1] },
    { label: content.durationLabels.minute1, value: DURATION_VALUES[2] },
    { label: content.durationLabels.minutes3, value: DURATION_VALUES[3] },
    { label: content.durationLabels.minutes5, value: DURATION_VALUES[4] },
    { label: content.durationLabels.minutes10, value: DURATION_VALUES[5] },
  ];
  const localePrefix =
    localeOptions.find((option) => option.code === locale)?.prefix ?? "";
  const selected =
    patterns.find((pattern) => pattern.slug === selectedSlug) ?? patterns[0];
  if (!selected) return null;

  const embedUrl = buildEmbedUrl(
    selected.slug,
    theme,
    localePrefix,
    duration,
    binaural,
    eyesClosed,
  );
  const snippet = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allow="autoplay" style="border-radius:16px;"></iframe>`;
  const previewSrc = buildPreviewUrl(
    selected.slug,
    theme,
    localePrefix,
    duration,
    binaural,
    eyesClosed,
  );

  const handleCopy = async () => {
    await copyToClipboard(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">
          {content.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {content.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {content.intro}
        </p>
      </header>

      {/* Pattern selector */}
      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
          {content.choosePattern}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => (
            <button
              key={pattern.slug}
              onClick={() => setSelectedSlug(pattern.slug)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                pattern.slug === selectedSlug
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: pattern.color }}
                />
                <p className="font-medium text-card-foreground">
                  {pattern.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pattern.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Appearance: theme + language */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
          {content.appearance.title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-border overflow-hidden">
            {(["auto", "light", "dark"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  theme === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-card-foreground"
                }`}
              >
                {content.appearance[option]}
              </button>
            ))}
          </div>

          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as LocaleCode)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label={content.widgetLanguageAria}
          >
            {localeOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={duration ?? ""}
            onChange={(event) =>
              setDuration(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label={content.durationAria}
          >
            {durationOptions.map((option) => (
              <option key={option.value ?? "open"} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Sound options */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
          {content.sound.title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40">
            <input
              type="checkbox"
              checked={binaural}
              onChange={(event) => setBinaural(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            {content.sound.binauralLabel}
          </label>
        </div>
      </section>

      {/* Preview */}
      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
          {content.preview.title}
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden aspect-video">
          <iframe
            key={`${selected.slug}-${theme}-${locale}-${duration}-${binaural ? 1 : 0}-${eyesClosed ? 1 : 0}`}
            src={previewSrc}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay"
            style={{ borderRadius: 16 }}
            title={fillPatternTemplate(
              content.preview.iframeTitleTemplate,
              selected.title,
            )}
          />
        </div>
      </section>

      {/* Snippet */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
            {content.snippet.title}
          </h2>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                {content.snippet.copied}
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
                {content.snippet.copy}
              </>
            )}
          </button>
        </div>
        <pre className="rounded-2xl border border-border bg-muted/50 p-6 text-sm text-card-foreground overflow-x-auto whitespace-pre-wrap break-all">
          {snippet}
        </pre>
      </section>

      {/* Info */}
      <section className="mt-10 grid gap-6 sm:grid-cols-3">
        {[content.info.free, content.info.responsive, content.info.theme].map(
          (card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold text-card-foreground">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
              </p>
            </div>
          ),
        )}
      </section>

      <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcherFooter basePath="/embed" locale={pageLocale} />
        </div>
      </footer>
    </main>
  );
}
