import fs from 'node:fs';
import path from 'node:path';

// Internal/branding pages are noindexed; listing them in the sitemap sends
// contradictory signals (Ahrefs: "noindex page in sitemap").
export const DEFAULT_EXCLUDED_ROUTES = [
  '/og-preview',
  '/brand-lab',
  '/sensory-studio',
  '/stats',
  '/recommend',
];
export const DEFAULT_LOCALE_PREFIXES = [];
export const EDGE_PROXY_LOCALE_PREFIXES = ['es', 'pt', 'fr', 'de', 'ja'];
// Routes that should only exist in English. The mass-translate proxy
// rewrites anchor hrefs on localized paths, which would mangle the
// cross-locale anchors on /languages into broken /de/es/... paths.
const EN_ONLY_ROUTES = new Set(['/languages']);

const LOCALE_PREFIX_TO_HREFLANG = {
  es: 'es-ES',
  pt: 'pt-BR',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
};

function isRouteGroup(segment) {
  return segment.startsWith('(') && segment.endsWith(')');
}

function isParallelSegment(segment) {
  return segment.startsWith('@');
}

function isPrivateSegment(segment) {
  return segment.startsWith('_');
}

function isDynamicSegment(segment) {
  return segment.includes('[') || segment.includes(']');
}

function isNonRoutableSegment(segment) {
  return isRouteGroup(segment) || isParallelSegment(segment) || isPrivateSegment(segment);
}

function normalizeRoute(routeSegments) {
  if (routeSegments.length === 0) return '/';
  return `/${routeSegments.join('/')}`;
}

function normalizeLocalePrefix(prefix) {
  return prefix.replace(/^\/+|\/+$/g, '');
}

function createLocalizedRoute(route, prefix) {
  const localePath = `/${prefix}`;
  return route === '/' ? localePath : `${localePath}${route}`;
}

function stripLocalePrefix(route, localePrefixes) {
  for (const prefix of localePrefixes) {
    const localePath = `/${prefix}`;

    if (route === localePath) {
      return '/';
    }

    if (route.startsWith(`${localePath}/`)) {
      return route.slice(localePath.length);
    }
  }

  return route;
}

// True when an absolute sitemap URL is a locale-prefixed page served through
// the mass-translate edge proxy (e.g. `${siteUrl}/es` or `${siteUrl}/de/...`),
// as opposed to an English canonical served from the Vercel edge. Used by the
// cache warmer to warm English origins first, then locale pages.
export function isLocaleUrl(url, siteUrl, localePrefixes = EDGE_PROXY_LOCALE_PREFIXES) {
  return localePrefixes.some(
    (prefix) => url === `${siteUrl}/${prefix}` || url.startsWith(`${siteUrl}/${prefix}/`)
  );
}

export function discoverPageRoutes(appDir, excludedRoutes = DEFAULT_EXCLUDED_ROUTES) {
  const excluded = new Set(excludedRoutes);
  const discovered = new Set();

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile() || entry.name !== 'page.tsx') {
        continue;
      }

      const relativeDir = path.relative(appDir, path.dirname(fullPath));
      const rawSegments = relativeDir === '' ? [] : relativeDir.split(path.sep);

      if (rawSegments.some(isDynamicSegment)) {
        continue;
      }

      const routeSegments = rawSegments.filter((segment) => !isNonRoutableSegment(segment));

      const route = normalizeRoute(routeSegments);

      if (!excluded.has(route)) {
        discovered.add(route);
      }
    }
  }

  walk(appDir);

  return Array.from(discovered).sort();
}

function createMetaMap(items) {
  const map = new Map();

  for (const item of items) {
    if (!item?.slug || !item?.dateModified) continue;
    map.set(item.slug, new Date(item.dateModified));
  }

  return map;
}

export function buildSitemapEntries({
  appDir,
  siteUrl,
  excludedRoutes = DEFAULT_EXCLUDED_ROUTES,
  localePrefixes = DEFAULT_LOCALE_PREFIXES,
  breathingPageMeta = [],
  useCasePageMeta = [],
  now = new Date(),
}) {
  const routes = discoverPageRoutes(appDir, excludedRoutes);
  const normalizedLocalePrefixes = Array.from(
    new Set(localePrefixes.map(normalizeLocalePrefix).filter(Boolean))
  );
  const breathingMetaBySlug = createMetaMap(breathingPageMeta);
  const useCaseMetaBySlug = createMetaMap(useCasePageMeta);
  const sitemapRoutes = Array.from(
    new Set(
      routes.flatMap((route) => {
        if (EN_ONLY_ROUTES.has(route)) return [route];
        return [
          route,
          ...normalizedLocalePrefixes.map((prefix) => createLocalizedRoute(route, prefix)),
        ];
      })
    )
  );

  function buildAlternates(canonicalRoute) {
    if (normalizedLocalePrefixes.length === 0) return undefined;
    if (EN_ONLY_ROUTES.has(canonicalRoute)) return undefined;
    // Root canonical is rendered by Next.js as trailing-slash URL; match it exactly
    // so hreflang targets are self-canonical (avoids "hreflang to non-canonical" errors).
    const enUrl = canonicalRoute === '/' ? `${siteUrl}/` : `${siteUrl}${canonicalRoute}`;
    const languages = {
      'en-US': enUrl,
      'x-default': enUrl,
    };
    for (const prefix of normalizedLocalePrefixes) {
      const hreflang = LOCALE_PREFIX_TO_HREFLANG[prefix] || prefix;
      languages[hreflang] = `${siteUrl}${createLocalizedRoute(canonicalRoute, prefix)}`;
    }
    return { languages };
  }

  return sitemapRoutes.map((route) => {
    const canonicalRoute = stripLocalePrefix(route, normalizedLocalePrefixes);
    const alternates = buildAlternates(canonicalRoute);

    if (canonicalRoute === '/') {
      return {
        url: route === '/' ? `${siteUrl}/` : `${siteUrl}${route}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 1,
        alternates,
      };
    }

    const url = `${siteUrl}${route}`;

    if (canonicalRoute === '/breathe' || canonicalRoute === '/for') {
      return {
        url,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates,
      };
    }

    if (canonicalRoute.startsWith('/breathe/')) {
      const slug = canonicalRoute.slice('/breathe/'.length);
      return {
        url,
        lastModified: breathingMetaBySlug.get(slug) ?? now,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates,
      };
    }

    if (canonicalRoute.startsWith('/for/')) {
      const slug = canonicalRoute.slice('/for/'.length);
      return {
        url,
        lastModified: useCaseMetaBySlug.get(slug) ?? now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates,
      };
    }

    return {
      url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates,
    };
  });
}
