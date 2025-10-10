import type { APIRoute } from 'astro';
import { stringify } from 'yaml';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
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

  const config = {
    ...(IS_LOCAL ? { local_backend: true } : {}),
    backend: IS_LOCAL
      ? { name: 'test-repo' } // локалка пишет через decap-server в ФС
      : {
          name: 'github',
          repo: repo,
          branch: branch,
          base_url: baseUrl,
          auth_endpoint: '/api/decap/oauth'
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
        format: 'frontmatter',
        extension: 'md',
        slug: '{{slug}}',
        path: '{{locale}}/{{slug}}',
        i18n: true,
        fields: [
          { label: 'Title', name: 'title', widget: 'string', i18n: 'translate', required: false, default: '' },
          { label: 'Date', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', time_format: false, default: '{{now}}', i18n: false },
          { label: 'Draft', name: 'draft', widget: 'boolean', default: false, i18n: false },
          { label: 'Description', name: 'description', widget: 'text', required: false, i18n: 'translate' },
          { label: 'Body', name: 'body', widget: 'markdown', i18n: 'translate' }
        ]
      }
    ]
  };

  const yaml = stringify(config);
  // Log config values for debugging (base_url and auth_endpoint)
  const authEndpoint = IS_LOCAL ? 'N/A (test-repo)' : '/api/decap/oauth';
  console.log(`[config.yml] Generated config: base_url=${baseUrl}, auth_endpoint=${authEndpoint}, collections=${config.collections.length}`);
  
  return new Response(yaml, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Decap-Mode': IS_LOCAL ? 'local' : 'git'
    }
  });
};