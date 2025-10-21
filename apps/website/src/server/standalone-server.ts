/**
 * Enhanced standalone server for Astro SSR with proper static asset handling.
 * 
 * This module wraps the default Astro Node adapter server to ensure proper
 * cache headers for static assets when running behind a reverse proxy.
 * 
 * Usage: node ./dist/server/entry.mjs (default Astro start script)
 * The entry.mjs will import this module if configured in astro.config.ts
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { applyCacheHeaders } from './static-headers.js';

/**
 * Middleware to apply cache headers to static assets before the static handler.
 * This ensures consistent headers across all static assets served by the Node adapter.
 */
export function createStaticHeaderMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url;
    if (!url) {
      return next();
    }

    // Extract pathname (remove query string)
    const [pathname] = url.split('?');
    
    // Apply cache headers if this is a static asset
    applyCacheHeaders(res, pathname);
    
    // Continue to static file handler or SSR
    next();
  };
}

/**
 * Wrapper for the standalone server handler that ensures proper header handling.
 */
export function wrapStandaloneHandler(
  originalHandler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
) {
  const middleware = createStaticHeaderMiddleware();
  
  return async (req: IncomingMessage, res: ServerResponse) => {
    // Apply static headers first
    middleware(req, res, () => {
      // Then delegate to original handler
      return originalHandler(req, res);
    });
  };
}

