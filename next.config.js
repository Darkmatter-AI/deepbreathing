/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
      // Strip ?duration= query parameter from /breathe/* pages to prevent
      // duplicate content issues with search engines (e.g. Ahrefs crawling
      // /breathe/coherent?duration=30, /breathe/box?duration=60, etc.)
      {
        source: '/breathe/:slug',
        has: [{ type: 'query', key: 'duration' }],
        destination: '/breathe/:slug',
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
      // Strip locale prefix on URLs that reach Next.js with one — the mass-translate
      // proxy normally strips locales before forwarding, so Next.js seeing /es/...
      // means the original URL was doubly-prefixed (/de/es/...) and the proxy
      // stripped the outer one. Redirect to the canonical (un-prefixed) path; the
      // proxy will re-add the user-facing locale on the response. Eliminates 404s
      // flagged in GSC for stale doubly-prefixed crawls.
      {
        source: '/:locale(es|pt|fr|de|ja)/:rest+',
        destination: '/:rest+',
        permanent: true,
      },
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
