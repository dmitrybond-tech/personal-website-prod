import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';

// Читаем TUNNEL_HOSTS из env для поддержки туннелей
const tunnelHosts = process.env.TUNNEL_HOSTS?.split(',').map(host => host.trim()) || [];

export default defineConfig({
  output: 'hybrid', // нужен on-demand рендер для POST
  // adapter: node({ mode: 'standalone' }), // только для production build
  site: 'http://localhost:4321',
  server: {
    port: 4321,
    host: true, // слушать извне
  },
  integrations: [tailwind()],
  vite: {
    plugins: [],
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      },
    },
    server: {
      host: true,
      /** 
       * DEV: разрешаем хосты из TUNNEL_HOSTS env + стандартные
       * Поддержка туннелей: *.lhr.life, *.ngrok-free.app и др.
       */
      allowedHosts: [
        '.lhr.life',
        'localhost',
        '127.0.0.1',
        ...tunnelHosts,
      ],
    },
    /**
     * PREVIEW/PROD: если используешь `astro preview`, можно ограничить список.
     * Для билда/превью оставим только стабильные домены.
     */
    preview: {
      allowedHosts: [
        'hooks.dmitrybond.tech', // твой будущий постоянный поддомен
        '.lhr.life',
        'localhost',
        '127.0.0.1',
        ...tunnelHosts,
      ],
    },
    // Прокси убран - iframe ходит напрямую на DevsCard origins
  },
});
