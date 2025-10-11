import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import auth from 'auth-astro';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
// Load .env.local first, then .env as fallback. Do NOT write to these files.
loadEnv({ path: path.resolve(__dirname, '.env.local') });
loadEnv({ path: path.resolve(__dirname, '.env') });

// ...dotenv уже загружается раньше...
const DEV = process.env.NODE_ENV !== 'production';
if (DEV) {
  const authUrl = process.env.AUTH_URL || 'http://localhost:4321';
  console.log('[AUTHJS] cb:', `${authUrl}/api/auth/callback/github`, 'client_id:', process.env.AUTHJS_GITHUB_CLIENT_ID ? '[set]' : '[missing]');
  console.log('[DECAP ] cb:', process.env.AUTH_REDIRECT_URI || `${authUrl}/oauth/callback`, 'client_id:', process.env.DECAP_GITHUB_CLIENT_ID ? '[set]' : '[missing]');
}

const HAS_DECAP = !!(process.env.DECAP_GITHUB_CLIENT_ID && process.env.DECAP_GITHUB_CLIENT_SECRET);
const HAS_AUTHJS = !!(process.env.AUTHJS_GITHUB_CLIENT_ID && process.env.AUTHJS_GITHUB_CLIENT_SECRET);

// Log OAuth App configurations for debugging
if (DEV) {
  console.log('[AUTHJS] client_id:', process.env.AUTHJS_GITHUB_CLIENT_ID ? process.env.AUTHJS_GITHUB_CLIENT_ID.slice(0,8) + '…' : '[missing]');
  console.log('[DECAP ] client_id:', process.env.DECAP_GITHUB_CLIENT_ID ? process.env.DECAP_GITHUB_CLIENT_ID.slice(0,8) + '…' : '[missing]');
}

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
  server: { 
    port: 4321, 
    host: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  },
  integrations: [
    react(),
    auth(),
    // OAuth handled by custom API routes instead of integration
  ],
  vite: {
    plugins: [
      tailwindcss(), 
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@ref': path.resolve(__dirname, '../website-vanilla_ref'),
      },
    },
    optimizeDeps: {
      include: ['iconify-icon']
    },
    ssr: {
      noExternal: ['iconify-icon']
    },
    server: {
      host: true,
      strictPort: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.lhr.life',
        ...(process.env.TUNNEL_HOSTS?.split(',').map(h => h.trim()).filter(Boolean) ?? []),
      ],
      fs: {
        allow: [
          path.resolve(__dirname),
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, '../website-vanilla_ref'),
        ],
      },
    },
    preview: {
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.lhr.life',
        ...(process.env.TUNNEL_HOSTS?.split(',').map(h => h.trim()).filter(Boolean) ?? []),
      ],
    },
  },
});
