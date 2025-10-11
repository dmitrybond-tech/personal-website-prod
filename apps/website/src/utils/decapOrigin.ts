/**
 * Shared utilities for Decap OAuth origin and CORS handling
 * Used across all /api/decap/* endpoints
 */

/**
 * Compute origin from request, respecting proxy headers and DECAP_ORIGIN override
 */
export function computeOrigin(req: Request): string {
  const u = new URL(req.url);
  
  // Force origin from env if set (for production reliability)
  const forced = process.env.DECAP_ORIGIN;
  if (forced) {
    try {
      const t = new URL(forced);
      return `${t.protocol}//${t.host}`;
    } catch {
      // Invalid DECAP_ORIGIN, fall through
    }
  }
  
  // Respect proxy headers
  const proto = (req.headers.get('x-forwarded-proto') || u.protocol.replace(':', '')).toLowerCase();
  const host = req.headers.get('x-forwarded-host') || u.host;
  return `${proto}://${host}`;
}

/**
 * Generate CORS headers for OAuth endpoints
 */
export function cors(origin: string) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-allow-credentials': 'true',
    'vary': 'Origin',
  };
}

