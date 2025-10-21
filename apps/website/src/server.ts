/**
 * Custom SSR Server Entry Point
 * 
 * Раздаёт статику из dist/client с правильными заголовками
 * и использует Astro SSR handler для остального.
 * 
 * @see SSR_CACHE_POLICY.md
 * @see src/middleware.ts - дополнительные заголовки для SSR responses
 */

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import express, { type Request, type Response } from 'express';
import compression from 'compression';
// После компиляции: dist/server/server.mjs -> dist/server/entry.mjs
import { handler as astroHandler } from './entry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// В prod: dist/server/server.mjs
// Нужно найти dist/client относительно dist/server
const CLIENT_ROOT = resolve(__dirname, '../client');

const app = express();

// Отключаем дефолтные заголовки
app.disable('x-powered-by');
app.disable('etag'); // Контролируем кэш через Cache-Control

// Сжатие для текстовых ресурсов
app.use(compression());

/**
 * Хелпер для immutable-кэша (хэшированные файлы)
 */
function setImmutableCache(res: Response) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}

/**
 * Хелпер для длительного кэша (без immutable)
 */
function setLongCache(res: Response) {
  res.setHeader('Cache-Control', 'public, max-age=31536000');
}

/**
 * Middleware для установки Content-Type и кэша для статики
 */
function staticHeaders(res: Response, filePath: string) {
  // CSS файлы
  if (filePath.endsWith('.css')) {
    res.type('text/css; charset=utf-8');
    setImmutableCache(res); // _astro всегда хэшированные
  }
  // JavaScript файлы
  else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
    res.type('application/javascript; charset=utf-8');
    setImmutableCache(res);
  }
  // WOFF2 шрифты
  else if (filePath.endsWith('.woff2')) {
    res.type('font/woff2');
    setImmutableCache(res);
  }
  // WOFF шрифты
  else if (filePath.endsWith('.woff')) {
    res.type('font/woff');
    setImmutableCache(res);
  }
  // Картинки
  else if (filePath.endsWith('.png')) {
    res.type('image/png');
  }
  else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    res.type('image/jpeg');
  }
  else if (filePath.endsWith('.svg')) {
    res.type('image/svg+xml');
  }
  else if (filePath.endsWith('.webp')) {
    res.type('image/webp');
  }
  else if (filePath.endsWith('.gif')) {
    res.type('image/gif');
  }
  // JSON
  else if (filePath.endsWith('.json')) {
    res.type('application/json; charset=utf-8');
  }
}

// ================================
// 1. /_astro/* - хэшированные бандлы (immutable)
// ================================
app.use(
  '/_astro',
  express.static(join(CLIENT_ROOT, '_astro'), {
    fallthrough: false,
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, filePath) => {
      staticHeaders(res, filePath);
    },
  })
);

// ================================
// 2. /fonts/* - шрифты (immutable)
// ================================
app.use(
  '/fonts',
  express.static(join(CLIENT_ROOT, 'fonts'), {
    fallthrough: false,
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, filePath) => {
      staticHeaders(res, filePath);
    },
  })
);

// ================================
// 3. /uploads/* - пользовательский контент (длительный кэш без immutable)
// ================================
app.use(
  '/uploads',
  express.static(join(CLIENT_ROOT, 'uploads'), {
    fallthrough: false,
    maxAge: '365d',
    setHeaders: (res, filePath) => {
      staticHeaders(res, filePath);
      // Переопределяем на длительный кэш без immutable
      setLongCache(res);
    },
  })
);

// ================================
// 4. Корневые статичные файлы (favicon, robots, sitemap)
// ================================
const ROOT_STATIC_FILES = [
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
];

for (const file of ROOT_STATIC_FILES) {
  app.get(`/${file}`, (req, res, next) => {
    const filePath = join(CLIENT_ROOT, file);
    res.sendFile(filePath, (err) => {
      if (err) next(); // fallthrough to Astro
    });
  });
}

// ================================
// 5. Healthcheck (для Docker/мониторинга)
// ================================
app.get('/_healthz', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

// ================================
// 6. Astro SSR Handler (для всего остального)
// ================================
// Middleware в src/middleware.ts добавит Cache-Control для HTML
app.use((req, res, next) => {
  // Преобразуем Express req/res в Web API Request/Response для Astro
  astroHandler(req, res);
});

// ================================
// Server Start
// ================================
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ SSR server running on http://${HOST}:${PORT}`);
  console.log(`   Static assets: ${CLIENT_ROOT}`);
  console.log(`   Health check: http://${HOST}:${PORT}/_healthz`);
});

