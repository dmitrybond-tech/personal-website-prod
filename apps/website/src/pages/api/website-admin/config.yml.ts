import type { APIRoute } from 'astro';
import { stringify } from 'yaml';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const DEBUG = process.env.DECAP_OAUTH_DEBUG === '1';
  const IS_LOCAL = process.env.DECAP_LOCAL_BACKEND === 'true';
  const REPO_PREFIX = IS_LOCAL ? '' : 'apps/website/';
  
  // Derive site origin safely behind proxies
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  const baseUrl = `${proto}://${host}`;
  
  // Prevent localhost fallback in production
  const siteOrigin = process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')
    ? process.env.PUBLIC_SITE_URL || 'https://dmitrybond.tech'
    : baseUrl;
    
  // Hardcoded repo name (was using wrong env var)
  const repo = 'dmitrybond-tech/personal-website-prod';
  const branch = process.env.DECAP_GITHUB_BRANCH || 'main';

  // Canonical minimal config for Decap CMS
  // All required fields present to satisfy strict schema validation
  const config = IS_LOCAL
    ? {
        // Local backend mode (decap-server writes to filesystem)
        local_backend: true,
        backend: { name: 'test-repo' },
        publish_mode: 'simple',
        media_folder: `${REPO_PREFIX}public/uploads`,
        public_folder: '/uploads',
        media_library: { name: 'default' },
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
      }
    : {
        // GitHub backend mode (production/staging)
        backend: {
          name: 'github',
          repo,
          branch,
          base_url: siteOrigin,
          auth_endpoint: '/api/decap/authorize',
        },
        publish_mode: 'simple',
        media_folder: `${REPO_PREFIX}public/uploads`,
        public_folder: '/uploads',
        media_library: { name: 'default' },
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

  // Guardrails: verify required fields are present
  const requiredFields = ['backend', 'media_folder', 'collections'];
  requiredFields.forEach(field => {
    if (!(config as any)[field]) {
      throw new Error(`[config.yml] Missing required field: ${field}`);
    }
  });

  const yaml = stringify(config);
  
  // Log canonical config summary
  const backendName = IS_LOCAL ? 'test-repo' : 'github';
  const authEndpoint = IS_LOCAL ? 'N/A (test-repo)' : '/api/decap/authorize';
  const repoInfo = IS_LOCAL ? 'local-fs' : `${repo}@${branch}`;
  const collectionsCount = config.collections.length;
  
  console.log(`[config.yml] base_url=${siteOrigin} auth_endpoint=${authEndpoint} backend=${backendName} repo=${repoInfo} collections.len=${collectionsCount}`);
  
  // Always log collection details (crucial for debugging)
  if (collectionsCount === 0) {
    console.warn('[config.yml] WARNING: collections.len=0 - CMS will not initialize!');
  } else {
    config.collections.forEach((col: any, idx: number) => {
      console.log(`[config.yml] collection[${idx}]: name=${col.name} folder=${col.folder}`);
    });
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'text/yaml; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Decap-Backend': backendName,
  };
  
  if (DEBUG) {
    headers['X-Decap-Debug'] = '1';
  }
  
  return new Response(yaml, { headers });
};