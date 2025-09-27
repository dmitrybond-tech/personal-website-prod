import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import path from 'path';

export default defineConfig({
  site: 'http://localhost:4321',
  server: {
    port: 4321,
    host: true
  },
  integrations: [tailwind()],
  vite: {
    plugins: [],
    resolve: {
      alias: {
        '@app': path.resolve('./src/app'),
        '@shared': path.resolve('./src/app/shared'),
        '@entities': path.resolve('./src/app/entities'),
        '@features': path.resolve('./src/app/features'),
        '@widgets': path.resolve('./src/app/widgets'),
        '@pages': path.resolve('./src/pages'),
        '@providers': path.resolve('./src/providers'),
        '@components': path.resolve('./src/components'),
      },
    },
    // Прокси убран - iframe ходит напрямую на DevsCard origins
  },
});
