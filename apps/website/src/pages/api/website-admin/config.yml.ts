import type { APIRoute } from 'astro';
import { stringify } from 'yaml';
export const prerender = false;

export const GET: APIRoute = async () => {
  const IS_LOCAL = process.env.DECAP_LOCAL_BACKEND === 'true';
  const REPO_PREFIX = IS_LOCAL ? '' : 'apps/website/';

  const config = {
    ...(IS_LOCAL ? { local_backend: true } : {}),
    backend: IS_LOCAL
      ? { name: 'test-repo' } // локалка пишет через decap-server в ФС
      : {
          name: 'github',
          repo: 'dmitrybond-tech/personal-website-dev',          // ← впиши свой owner/repo
          branch: 'main',
          base_url: process.env.PUBLIC_SITE_URL || 'http://localhost:4321'
        },
    publish_mode: 'simple',
    media_folder: `${REPO_PREFIX}public/uploads`,
    public_folder: '/uploads',
    // ВЫРОВНЯЙ ПУТИ ПОД ФАКТ — см. шаг 4
    collections: [
      {
        name: 'posts_en',
        label: 'Blog Posts (EN)',
        folder: `${REPO_PREFIX}src/content/posts/en`,
        create: true,
        extension: 'md',
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Date',  name: 'date',  widget: 'datetime' },
          { label: 'Body',  name: 'body',  widget: 'markdown' }
        ]
      },
      {
        name: 'posts_ru',
        label: 'Блог посты (RU)',
        folder: `${REPO_PREFIX}src/content/posts/ru`,
        create: true,
        extension: 'md',
        fields: [
          { label: 'Заголовок', name: 'title', widget: 'string' },
          { label: 'Дата', name: 'date', widget: 'datetime' },
          { label: 'Текст', name: 'body', widget: 'markdown' }
        ]
      },
      {
        name: 'blog_en',
        label: 'Blog (EN) - New Structure',
        folder: `${REPO_PREFIX}src/content/en/blog`,
        create: true,
        extension: 'md',
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Date',  name: 'date',  widget: 'datetime' },
          { label: 'Body',  name: 'body',  widget: 'markdown' }
        ]
      }
      // добавишь остальные коллекции аналогично
    ]
  };

  const yaml = stringify(config);
  return new Response(yaml, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Decap-Mode': IS_LOCAL ? 'local' : 'git'
    }
  });
};