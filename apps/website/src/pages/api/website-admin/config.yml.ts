import type { APIRoute } from 'astro';
import { stringify } from 'yaml';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const DEBUG = process.env.DECAP_OAUTH_DEBUG === '1';
  const IS_LOCAL = process.env.DECAP_LOCAL_BACKEND === 'true';
  const REPO_PREFIX = IS_LOCAL ? '' : 'apps/website/';
  
  // Get origin from request headers (proxy-aware) with fallback
  const getRequestOrigin = (req: Request) => {
    const url = new URL(req.url);
    const xfProto = req.headers.get('x-forwarded-proto');
    const xfHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const proto = (xfProto ?? url.protocol.replace(':', '')) || 'https';
    const host = xfHost ?? url.host;
    return `${proto}://${host}`;
  };
  
  const siteUrl = getRequestOrigin(request) || process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  // Prevent localhost fallback in production
  const baseUrl = process.env.NODE_ENV === 'production' && siteUrl.includes('localhost') 
    ? process.env.PUBLIC_SITE_URL || 'https://dmitrybond.tech'
    : siteUrl;
    
  const repo = process.env.DECAP_GITHUB_REPO || 'dmitrybond-tech/personal-website-pre-prod';
  const branch = process.env.DECAP_GITHUB_BRANCH || 'main';
  
  // Locked OAuth endpoint (flat structure) - supports both /api/decap/authorize and /api/decap/oauth/authorize
  const authEndpoint = '/api/decap/authorize';

  const config = {
    ...(IS_LOCAL ? { local_backend: true } : {}),
    backend: IS_LOCAL
      ? { name: 'test-repo' } // локалка пишет через decap-server в ФС
      : {
          name: 'github',
          repo: repo,
          branch: branch,
          base_url: baseUrl,
          auth_endpoint: authEndpoint
        },
    publish_mode: 'simple',
    media_folder: `${REPO_PREFIX}public/uploads`,
    public_folder: '/uploads',
    collections: [
      {
        name: 'posts',
        label: 'Blog posts',
        folder: `${REPO_PREFIX}src/content/posts`,
        create: true,
        slug: '{{slug}}',
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Body', name: 'body', widget: 'markdown' }
        ]
      }
    ]
  };

  const yaml = stringify(config);
  
  // Log config values for debugging (base_url and auth_endpoint)
  const resolvedAuthEndpoint = IS_LOCAL ? 'N/A (test-repo)' : authEndpoint;
  const collectionsCount = config.collections.length;
  
  // Always log configuration summary
  console.log('[config.yml] base_url=' + baseUrl + ' auth_endpoint=' + resolvedAuthEndpoint + ' collections.len=' + collectionsCount);
  
  // Warn if no collections (critical issue) and log each collection's folder path
  if (collectionsCount === 0) {
    console.warn('[config.yml] WARNING: collections.len=0 - CMS will not initialize!');
  } else if (DEBUG) {
    config.collections.forEach((col: any, idx: number) => {
      console.log('[config.yml] collection[' + idx + ']: name=' + col.name + ' folder=' + col.folder);
    });
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'text/yaml; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'X-Decap-Mode': IS_LOCAL ? 'local' : 'git'
  };
  
  if (DEBUG) {
    headers['X-Decap-Debug'] = '1';
  }
  
  if (collectionsCount === 0) {
    headers['X-Decap-Empty'] = '1';
  }
  
  return new Response(yaml, {
    headers
  });
};