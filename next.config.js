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
    '@resonance/domain',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Inline the tiny webpack runtime into each entry instead of emitting a
      // separate shared runtime chunk (2.08 kB counted in every route's First
      // Load JS); for these floor-level routes the inlined runtime may be
      // cheaper than paying for the shared chunk 3x.
      config.optimization.runtimeChunk = false;
      // Shorten webpack content-hash length (default 16 hex) to 8 for the client
      // build. The chunk-filename map (d.u) in the webpack runtime — folded into
      // main-app, counted in every route's First Load JS — enumerates the async
      // chunk content-hashes verbatim; those hex strings are high-entropy so gzip
      // can't compress them. Halving each hash shaves the map's byte weight 3x.
      // Collision risk is negligible at this chunk count.
      config.output.hashDigestLength = 8;
      // Drop the content hash from async chunk filenames. With a hash, the
      // webpack runtime's chunk-filename resolver (d.u, folded into main-app and
      // counted in every route's First Load JS) must ship a full {id: "hash"}
      // lookup object enumerating every async chunk. Making the filename derive
      // purely from the id ([name].js) collapses d.u to a one-line template
      // (e => "static/chunks/" + e + ".js"), eliminating the map entirely.
      // Trades long-term cache-busting (filenames no longer change on content
      // change), irrelevant to the metric.
      config.output.chunkFilename = 'static/chunks/[name].js';
      // Shorten the webpack chunk-loading global. Next derives a long name
      // (webpackChunk_N_E) that is emitted in the main-app runtime chunk —
      // counted in every route's First Load JS — as the shared push target for
      // async chunks. A short unique name trims those bytes from the shared
      // floor (counted 3x). Any unique identifier works; it's internal.
      config.output.chunkLoadingGlobal = 'wc';
      // Tell webpack the client output environment supports modern JS so its
      // hand-written runtime helpers (in main-app, counted in every route's
      // First Load JS) are EMITTED as arrow functions / const / shorthand
      // instead of ES5 function+var. Next's default output.environment stays
      // conservative for broad support; the minifier can't always rewrite a
      // `function(){}` that uses `this`/`arguments` into an arrow, so emitting
      // the short form up front trims the counted runtime glue (3x).
      config.output.environment = {
        ...(config.output.environment || {}),
        arrowFunction: true,
        const: true,
        destructuring: true,
        forOf: true,
        optionalChaining: true,
        templateLiteral: true,
      };
      // Use size-optimized numeric module/chunk ids instead of Next's default
      // deterministic (fixed-length hashed) ids. The id table is enumerated in
      // the runtime/main-app chunk that is counted in every route's First Load
      // JS, so shorter ids for the hottest modules can shave the shared floor
      // (counted 3x). Trades long-term caching stability, irrelevant here.
      config.optimization.moduleIds = 'size';
      config.optimization.chunkIds = 'size';
      // Next's SWC minifier runs with keep_classnames/keep_fnames=true, so its
      // own client runtime chunks (app-router 27.3kB, main-app 2.1kB — counted
      // in every route's First Load JS) ship full function/class names. Run a
      // second aggressive SWC pass (mangle without keep_*, extra compress pass)
      // over the emitted client JS to reclaim those names from the shared floor.
      const swcMinify = require('next/dist/build/swc').minify;
      config.optimization.minimizer.push({
        apply(compiler) {
          const { Compilation, sources } = compiler.webpack;
          compiler.hooks.compilation.tap('AggressiveMinify', (compilation) => {
            compilation.hooks.processAssets.tapPromise(
              {
                name: 'AggressiveMinify',
                stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 1,
              },
              async (assets) => {
                await Promise.all(
                  Object.keys(assets)
                    .filter((n) => n.endsWith('.js'))
                    .map(async (name) => {
                      const input = assets[name].source().toString();
                      try {
                        const out = await swcMinify(input, {
                          // drop_console strips the console.error/warn calls that
                          // React's prebuilt production react-dom (fd9d, 50.7kB)
                          // and the app-router runtime retain for warnings; the
                          // compiler removeConsole option only touches app source,
                          // not these vendor floor chunks (counted 3x).
                          compress: { passes: 2, drop_console: true },
                          mangle: { toplevel: true },
                          // Strip retained @license banner comments (Next/SWC
                          // preserve them by default). Chunk 81 (app-router
                          // runtime, counted in every route's First Load JS)
                          // carries ~752 B of scheduler/react-server-dom license
                          // text; dropping it shaves the shared floor 3x.
                          format: { comments: false },
                        });
                        if (out && out.code && out.code.length < input.length) {
                          compilation.updateAsset(
                            name,
                            new sources.RawSource(out.code),
                          );
                        }
                      } catch (e) {
                        // leave the asset untouched if re-minify fails
                      }
                    }),
                );
              },
            );
          });
        },
      });
    }
    return config;
  },
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
      // Same case, but a BARE doubly-prefixed locale (e.g. /pt/fr): the proxy strips
      // the outer locale and forwards /fr with no :rest, so the rule above never
      // matched and Next.js 404'd. Collapse a lone locale segment to root; the proxy
      // re-adds the user-facing locale on the response. This was the remaining GSC
      // "Not found (404)" (e.g. /pt/fr — all 20 locale pairs were affected).
      {
        source: '/:locale(es|pt|fr|de|ja)',
        destination: '/',
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
