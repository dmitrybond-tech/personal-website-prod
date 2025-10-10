import type { APIRoute } from 'astro';
import { stringify } from 'yaml';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
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
    
  const repo = 'dmitrybond-tech/personal-website-prod';
  const branch = 'main';

  // Canonical minimal config for Decap CMS
  const config = IS_LOCAL
    ? {
        // Local backend mode
        local_backend: true,
        backend: { name: 'test-repo' },
        publish_mode: 'simple',
        media_folder: `${REPO_PREFIX}public/uploads`,
        public_folder: '/uploads',
        media_library: { name: 'default' },
        collections: [
          {
            name: 'posts',
            label: 'Blog Posts',
            label_singular: 'Blog Post',
            folder: `${REPO_PREFIX}src/content/posts`,
            create: true,
            slug: '{{slug}}',
            format: 'frontmatter',
            extension: 'md',
            fields: [
              { label: 'Title', name: 'title', widget: 'string' },
              { label: 'Date', name: 'date', widget: 'datetime' },
              { label: 'Description', name: 'description', widget: 'text', required: false },
              { label: 'Body', name: 'body', widget: 'markdown' }
            ]
          }
        ]
      }
    : {
        // GitHub backend mode - canonical minimal config
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
            label: 'Blog Posts',
            label_singular: 'Blog Post',
            folder: `${REPO_PREFIX}src/content/posts`,
            create: true,
            slug: '{{slug}}',
            format: 'frontmatter',
            extension: 'md',
            fields: [
              { label: 'Title', name: 'title', widget: 'string' },
              { label: 'Date', name: 'date', widget: 'datetime' },
              { label: 'Description', name: 'description', widget: 'text', required: false },
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
  
  // Enhanced logging - log once per request with full details
  const backendName = IS_LOCAL ? 'test-repo' : 'github';
  const repoInfo = IS_LOCAL ? 'local' : `${repo}@${branch}`;
  const authEndpoint = IS_LOCAL ? 'n/a' : '/api/decap/authorize';
  
  console.log(`[config.yml] base_url=${siteOrigin} auth_endpoint=${authEndpoint} backend=${backendName} repo=${repoInfo} collections.len=${config.collections.length}`);
  console.log(`[config.yml] collection[0]: name=${config.collections[0].name} folder=${config.collections[0].folder}`);
  
  return new Response(yaml, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-store',
    }
  });
};