'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BREATHING_PATTERNS } from '@/components/resonance/constants';
import { breathingPageMap } from '@/data/breathing-pages';
import { LanguageSwitcherFooter } from '@/components/language-switcher';

const EMBED_BASE = 'https://deepbreathingexercises.com/embed';

const HIDDEN_SLUGS = new Set(['nadi-shodhana', 'ujjayi', 'tummo', 'buteyko', 'breath-of-fire']);

const patterns = Object.entries(breathingPageMap)
  .filter(([slug]) => !HIDDEN_SLUGS.has(slug))
  .map(([slug, page]) => ({
    slug,
    title: page.hero.title,
    mode: page.mode,
    color: BREATHING_PATTERNS[page.mode].color,
    description: BREATHING_PATTERNS[page.mode].description,
  }));

type ThemeOption = 'auto' | 'light' | 'dark';

const DURATION_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Open', value: null },
  { label: '30s',  value: 30   },
  { label: '1 min', value: 60  },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

const LOCALE_OPTIONS = [
  { code: 'en', label: 'English',    prefix: ''    },
  { code: 'es', label: 'Español',    prefix: '/es' },
  { code: 'pt', label: 'Português',  prefix: '/pt' },
  { code: 'fr', label: 'Français',   prefix: '/fr' },
  { code: 'de', label: 'Deutsch',    prefix: '/de' },
  { code: 'ja', label: '日本語',      prefix: '/ja' },
] as const;

type LocaleCode = typeof LOCALE_OPTIONS[number]['code'];

function detectLocaleCode(): LocaleCode {
  if (typeof window === 'undefined') return 'en';
  // Mass-translate injects window.__MT_CONFIG__ with the current lang (e.g. "pt-br")
  const config = (window as { __MT_CONFIG__?: { lang?: string } }).__MT_CONFIG__;
  if (config?.lang && config.lang !== 'en') {
    const code = config.lang.split('-')[0] as LocaleCode;
    if (LOCALE_OPTIONS.some(l => l.code === code)) return code;
  }
  // Fallback: detect from URL pathname
  const pathname = window.location.pathname;
  for (const loc of LOCALE_OPTIONS) {
    if (loc.prefix && (pathname.startsWith(loc.prefix + '/') || pathname === loc.prefix)) {
      return loc.code;
    }
  }
  return 'en';
}

function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
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
  if (theme !== 'auto') params.set('theme', theme);
  if (duration !== null) params.set('duration', String(duration));
  // Only emit non-default values so existing snippets stay short.
  if (!binaural) params.set('binaural', '0');
  if (eyesClosed) params.set('eyesClosed', '1');
  const qs = params.toString();
  const base = localePrefix
    ? `https://deepbreathingexercises.com${localePrefix}/embed`
    : EMBED_BASE;
  return `${base}/${slug}${qs ? `?${qs}` : ''}`;
}

export function EmbedGenerator() {
  const [selectedSlug, setSelectedSlug] = useState('box');
  const [theme, setTheme] = useState<ThemeOption>('auto');
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [duration, setDuration] = useState<number | null>(60);
  const [binaural, setBinaural] = useState(true);
  // eyesClosed param plumbing kept in URL builder for internal testing, but
  // not surfaced as a generator toggle until narration ships.
  const eyesClosed = false;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocale(detectLocaleCode());
  }, []);

  const localePrefix = LOCALE_OPTIONS.find(l => l.code === locale)?.prefix ?? '';
  const selected = patterns.find(p => p.slug === selectedSlug) ?? patterns[0];
  const embedUrl = buildEmbedUrl(selected.slug, theme, localePrefix, duration, binaural, eyesClosed);
  const snippet = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allow="autoplay" style="border-radius:16px;"></iframe>`;

  const previewParams = new URLSearchParams();
  if (theme !== 'auto') previewParams.set('theme', theme);
  if (duration !== null) previewParams.set('duration', String(duration));
  if (!binaural) previewParams.set('binaural', '0');
  if (eyesClosed) previewParams.set('eyesClosed', '1');
  const previewQs = previewParams.toString();
  const previewSrc = `${localePrefix}/embed/${selected.slug}${previewQs ? `?${previewQs}` : ''}`;

  const handleCopy = async () => {
    await copyToClipboard(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Free Widget</p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Embed a breathing exercise
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Add an interactive breathing visualizer to your website, blog, or app.
          Pick a pattern, copy the snippet, paste into your HTML. Free forever.
        </p>
      </header>

      {/* Pattern selector */}
      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Choose a pattern</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedSlug(p.slug)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                p.slug === selectedSlug
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                <p className="font-medium text-card-foreground">{p.title}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Appearance: theme + language */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Appearance</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-border overflow-hidden">
            {(['auto', 'light', 'dark'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setTheme(opt)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  theme === opt
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-card-foreground'
                }`}
              >
                {opt === 'auto' ? 'Auto' : opt === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>

          <select
            value={locale}
            onChange={e => setLocale(e.target.value as LocaleCode)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Widget language"
          >
            {LOCALE_OPTIONS.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          <select
            value={duration ?? ''}
            onChange={e => setDuration(e.target.value === '' ? null : Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Session duration"
          >
            {DURATION_OPTIONS.map(d => (
              <option key={d.value ?? 'open'} value={d.value ?? ''}>{d.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Sound options */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Sound</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary/40">
            <input
              type="checkbox"
              checked={binaural}
              onChange={e => setBinaural(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Binaural beats (headphones recommended)
          </label>
        </div>
      </section>

      {/* Preview */}
      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Preview</h2>
        <div className="rounded-2xl border border-border overflow-hidden aspect-video">
          <iframe
            key={`${selected.slug}-${theme}-${locale}-${duration}-${binaural ? 1 : 0}-${eyesClosed ? 1 : 0}`}
            src={previewSrc}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay"
            style={{ borderRadius: 16 }}
            title={`${selected.title} embed preview`}
          />
        </div>
      </section>

      {/* Snippet */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Embed code</h2>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                Copy snippet
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
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Free forever</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No API key, no account, no usage limits. Just paste the snippet.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Responsive</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Width adapts to any container. Works on desktop, tablet, and mobile.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Light &amp; dark mode</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Auto-detects user preference, or force light/dark to match your site.
          </p>
        </div>
      </section>

      <footer className="mt-12 rounded-[32px] border border-border bg-card p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/breathe" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Techniques
          </Link>
          <Link href="/for" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Guides
          </Link>
          <Link href="/breathing-app" className="underline underline-offset-2 transition-colors hover:text-foreground">
            App
          </Link>
          <Link href="/about" className="underline underline-offset-2 transition-colors hover:text-foreground">
            About
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcherFooter />
        </div>
      </footer>
    </main>
  );
}
