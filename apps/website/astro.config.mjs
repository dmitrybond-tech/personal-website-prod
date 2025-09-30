import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';
import decapCmsOauth from "astro-decap-cms-oauth";

// Читаем TUNNEL_HOSTS из env для поддержки туннелей
const tunnelHosts = process.env.TUNNEL_HOSTS?.split(',').map(host => host.trim()) || [];

export default defineConfig({
  site: 'http://localhost:4321',
  server: {
    port: 4321,
    host: true, // слушать извне
  },
  integrations: [
    tailwind(),
    decapCmsOauth({
      adminDisabled: true,         // we keep our own /website-admin
      oauthDisabled: false,        // enable OAuth routes
      oauthLoginRoute: "/oauth",
      oauthCallbackRoute: "/oauth/callback",
    }),
  ],
  vite: {
    plugins: [],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
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
