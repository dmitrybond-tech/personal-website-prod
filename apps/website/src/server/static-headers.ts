/**
 * Static asset cache headers configuration for SSR server.
 * This module provides header configuration for the Node adapter to properly cache
 * static assets when serving behind a reverse proxy like Caddy.
 * 
 * @see apps/website/src/middleware.ts for Astro middleware cache policy
 */

export interface AssetCacheConfig {
  pattern: RegExp;
  headers: Record<string, string>;
}

/**
 * Cache configurations for different asset types.
 * Order matters: first match wins.
 */
export const ASSET_CACHE_CONFIGS: AssetCacheConfig[] = [
  // Immutable hashed assets: /_astro/*
  {
    pattern: /^\/_astro\//,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  
  // Immutable fonts: /fonts/*
  {
    pattern: /^\/fonts\//,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  
  // User uploads: /uploads/* - shorter cache, can be updated
  {
    pattern: /^\/uploads\//,
    headers: {
      'Cache-Control': 'public, max-age=86400', // 1 day
      'X-Content-Type-Options': 'nosniff',
    },
  },
  
  // Favicons and manifests - moderate cache
  {
    pattern: /^\/(favicon\.ico|.*\.webmanifest|robots\.txt|sitemap\.xml)/,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  },
];

/**
 * Get cache headers for a given pathname.
 * Returns undefined if no specific cache policy applies.
 */
export function getCacheHeadersForPath(pathname: string): Record<string, string> | undefined {
  for (const config of ASSET_CACHE_CONFIGS) {
    if (config.pattern.test(pathname)) {
      return config.headers;
    }
  }
  return undefined;
}

/**
 * Apply cache headers to a Node.js ServerResponse object.
 */
export function applyCacheHeaders(
  res: { setHeader: (name: string, value: string) => void },
  pathname: string
): boolean {
  const headers = getCacheHeadersForPath(pathname);
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
    return true;
  }
  return false;
}

