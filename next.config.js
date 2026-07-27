const nativeI18nMode = process.env.NATIVE_I18N_MODE || 'proxy';
const supportedNativeI18nModes = new Set(['proxy', 'native-preview', 'native']);

if (!supportedNativeI18nModes.has(nativeI18nMode)) {
  throw new Error(`Unsupported NATIVE_I18N_MODE: ${nativeI18nMode}`);
}

const proxyLocalePrefixRedirects = nativeI18nMode === 'proxy'
  ? [
      {
        source: '/:locale(es|pt|fr|de|ja)/:rest+',
        destination: '/:rest+',
        permanent: true,
      },
      {
        source: '/:locale(es|pt|fr|de|ja)',
        destination: '/',
        permanent: true,
      },
    ]
  : [];

// Native and native-preview modes: locale-aware redirects for legacy URLs and double-locale paths
const nativeLocaleRedirects = nativeI18nMode === 'proxy'
  ? []
  : [
      // Legacy /about/methodology redirects for all locales
      {
        source: '/:locale(es|pt|fr|de|ja)/about/methodology',
        destination: '/:locale/about/editorial-policy',
        permanent: true,
      },
      {
        source: '/:locale(es|pt|fr|de|ja)/about/methodology/:path*',
        destination: '/:locale/about/editorial-policy',
        permanent: true,
      },
      // /languages is EN-only route; localized paths redirect to root
      {
        source: '/:locale(es|pt|fr|de|ja)/languages',
        destination: '/languages',
        permanent: true,
      },
      // Double-locale bare paths: /:outer/:inner -> /:outer/
      {
        source: '/:outer(es|pt|fr|de|ja)/:inner(es|pt|fr|de|ja)',
        destination: '/:outer/',
        permanent: true,
      },
      // Double-locale nested paths: /:outer/:inner/:rest* -> /:outer/:rest*
      {
        source: '/:outer(es|pt|fr|de|ja)/:inner(es|pt|fr|de|ja)/:rest*',
        destination: '/:outer/:rest*',
        permanent: true,
      },
    ];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Strip console.* (except error/warn) from production client bundles so any
    // stray logging in first-load client chunks doesn't ship its byte weight.
    removeConsole: { exclude: ['error', 'warn'] },
  },
  transpilePackages: [
    '@resonance/access-control',
    '@resonance/api-contracts',
    '@resonance/audio',
    '@resonance/domain',
  ],
  // NOTE: A custom webpack block (from the 2026-07 first-load-JS experiment,
  // PR #31) lived here until 2026-07-22, when its unhashed async chunk
  // filenames + Vercel's immutable /_next/static caching broke production for
  // every returning visitor after a deploy, and its drop_console pass
  // suppressed the error. Removed wholesale in favor of Next defaults:
  // hashed chunk filenames, deterministic module ids, standard minification.
  // Any future bundle-size work must preserve content-hashed filenames and
  // console.error, and gets logged in docs/SEO-EXPERIMENTS.md first.
  async headers() {
    return [
      {
        // Allow embedding only for /embed/* routes
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // NOTE: The ?duration= query stripping redirect was removed — it caused a
      // circular 301 redirect loop (Next.js preserves source query params when
      // destination has none, so the rule matched itself infinitely). Safari
      // "too many redirects" error. SEO deduplication is handled by
      // alternates.canonical in each /breathe/:slug page's metadata instead.
      // Canonical host: www -> apex. The www subdomain points at Vercel directly
      // (bypassing the Cloudflare proxy), so it must be claimed by this project and
      // redirected, otherwise it hard-404s (DEPLOYMENT_NOT_FOUND) — a GSC 404.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.deepbreathingexercises.com' }],
        destination: 'https://deepbreathingexercises.com/:path*',
        permanent: true,
      },
      // Content redirects
      {
        source: '/about/methodology',
        destination: '/about/editorial-policy',
        permanent: true,
      },
      {
        source: '/about/methodology/:path*',
        destination: '/about/editorial-policy',
        permanent: true,
      },
      {
        source: '/4-7-8',
        destination: '/breathe/4-7-8',
        permanent: true,
      },
      {
        source: '/box',
        destination: '/breathe/box',
        permanent: true,
      },
      {
        source: '/coherent',
        destination: '/breathe/coherent',
        permanent: true,
      },
      {
        source: '/physiological-sigh',
        destination: '/breathe/physiological-sigh',
        permanent: true,
      },
      {
        source: '/wim-hof',
        destination: '/breathe/wim-hof',
        permanent: true,
      },
      {
        source: '/how-to-lower-blood-pressure-with-fourfold-deep-breathing/:path*',
        destination: '/for/high-blood-pressure',
        permanent: true,
      },
      {
        source: '/cleansing-breath-exercise/:path*',
        destination: '/breathe',
        permanent: true,
      },
      {
        source: '/youre-doing-just-fine/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/page/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/the-dos-and-donts-of-paper-bag-breathing/:path*',
        destination: '/for/panic-attacks',
        permanent: true,
      },
      {
        source: '/breathing-exercises-that-help-with-asthma/:path*',
        destination: '/breathe',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/breathing-app',
        permanent: true,
      },
      {
        source: '/app/',
        destination: '/breathing-app',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: '/breathing-app',
        permanent: true,
      },
      // Proxy mode keeps the legacy locale stripping contract. Native preview
      // and native modes must let the App Router own recognized prefixes.
      ...proxyLocalePrefixRedirects,
      // Native modes add locale-aware redirects for legacy URLs and double-locale paths.
      ...nativeLocaleRedirects,
      // Single-page routes with no nested children — collapse stray sub-paths to root.
      {
        source: '/breathing-app/:path+',
        destination: '/breathing-app',
        permanent: true,
      },
      {
        source: '/4-7-8-breathing-timer/:path+',
        destination: '/4-7-8-breathing-timer',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
