export const prerender = false;

export async function GET() {
  const DEV = process.env.NODE_ENV !== 'production';
  const IS_LOCAL = process.env.DECAP_LOCAL_BACKEND === 'true';
  const REPO_PREFIX = IS_LOCAL ? '' : 'apps/website/';

  // Build Decap config object dynamically
  const config = {
    backend: IS_LOCAL 
      ? { name: 'test-repo' } // not used by decap-server anyway
      : {
          name: 'github',
          repo: 'dmitrybond-tech/personal-website-dev',
          branch: 'main',
          base_url: 'http://localhost:4321'
        },
    ...(IS_LOCAL && { local_backend: true }),
    publish_mode: 'simple',
    media_folder: `${REPO_PREFIX}public/uploads`,
    public_folder: '/uploads',
    i18n: {
      structure: 'multiple_folders',
      locales: ['en', 'ru'],
      default_locale: 'en'
    },
    collections: [
      {
        name: 'posts',
        label: 'Blog posts',
        folder: `${REPO_PREFIX}src/content/en/blog`,
        create: true,
        format: 'frontmatter',
        extension: 'md',
        slug: '{{slug}}',
        path: '{{locale}}/{{slug}}',
        i18n: true,
        fields: [
          { label: 'Title', name: 'title', widget: 'string', i18n: 'translate' },
          { label: 'Date', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', time_format: false, default: '{{now}}', i18n: false },
          { label: 'Draft', name: 'draft', widget: 'boolean', default: false, i18n: false },
          { label: 'Description', name: 'description', widget: 'text', required: false, i18n: 'translate' },
          { label: 'Body', name: 'body', widget: 'markdown', i18n: 'translate' }
        ]
      },
      {
        name: 'pages',
        label: 'Pages',
        folder: `${REPO_PREFIX}src/content/ru/pages`,
        create: true,
        format: 'frontmatter',
        extension: 'md',
        slug: '{{slug}}',
        path: '{{locale}}/{{slug}}',
        i18n: true,
        fields: [
          { label: 'Title', name: 'title', widget: 'string', i18n: 'translate' },
          { label: 'Date', name: 'date', widget: 'datetime', format: 'YYYY-MM-DD', time_format: false, default: '{{now}}', i18n: false },
          { label: 'Draft', name: 'draft', widget: 'boolean', default: false, i18n: false },
          { label: 'Description', name: 'description', widget: 'text', required: false, i18n: 'translate' },
          { label: 'Body', name: 'body', widget: 'markdown', i18n: 'translate' }
        ]
      }
    ]
  };

  // Convert to YAML
  const yml = `backend:
  name: ${config.backend.name}${config.backend.name === 'github' ? `
  repo: ${config.backend.repo}
  branch: ${config.backend.branch}
  base_url: "${config.backend.base_url}"` : ''}
${IS_LOCAL ? 'local_backend: true' : ''}
publish_mode: ${config.publish_mode}

media_folder: "${config.media_folder}"
public_folder: "${config.public_folder}"

i18n:
  structure: ${config.i18n.structure}
  locales: [${config.i18n.locales.join(', ')}]
  default_locale: ${config.i18n.default_locale}

collections:
${config.collections.map(collection => `  - name: "${collection.name}"
    label: "${collection.label}"
    folder: "${collection.folder}"
    create: ${collection.create}
    format: "${collection.format}"
    extension: "${collection.extension}"
    slug: "${collection.slug}"
    path: "${collection.path}"
    i18n: ${collection.i18n}
    fields:
${collection.fields.map(field => `      - { label: "${field.label}", name: "${field.name}", widget: "${field.widget}"${field.format ? `, format: "${field.format}"` : ''}${field.time_format !== undefined ? `, time_format: ${field.time_format}` : ''}${field.default !== undefined ? `, default: ${typeof field.default === 'string' ? `"${field.default}"` : field.default}` : ''}${field.required !== undefined ? `, required: ${field.required}` : ''}${field.i18n ? `, i18n: "${field.i18n}"` : ''} }`).join('\n')}`).join('\n')}`;

  if (DEV) {
    console.log(`[API config] local_backend: ${IS_LOCAL ? 'ENABLED' : 'DISABLED'} (env: ${process.env.DECAP_LOCAL_BACKEND ?? 'unset'})`);
    console.log(`[API config] repo_prefix: "${REPO_PREFIX}"`);
    console.log(`[API config] backend: ${config.backend.name}`);
    console.log('[API config] 200 OK | bytes =', yml.length);
  }

  return new Response(yml, {
    status: 200,
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

