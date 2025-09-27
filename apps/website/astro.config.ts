import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';
import path from 'path';

export default defineConfig({
  site: 'http://localhost:4321',
  server: {
    port: 4321,
    host: true
  },
  integrations: [tailwind()],
  vite: {
    server: {
      middlewareMode: false,
      fs: { strict: true },
    },
    plugins: [{
      name: 'force-utf8-header',
      configureServer(server) {
        server.middlewares.use((req,res,next)=>{
          if (res.getHeader('content-type')?.toString().startsWith('text/html')) {
            res.setHeader('Content-Type','text/html; charset=utf-8');
          }
          next();
        });
      }
    }],
    resolve: {
      alias: {
        '@app': path.resolve('./src/app'),
        '@shared': path.resolve('./src/app/shared'),
        '@entities': path.resolve('./src/app/entities'),
        '@features': path.resolve('./src/app/features'),
        '@widgets': path.resolve('./src/app/widgets'),
        '@pages': path.resolve('./src/pages'),
        '@providers': path.resolve('./src/providers'),
      },
    },
  },
});
