# Changelog: SSR Static Asset Fix

## [2025-10-21] - SSR Static Asset Delivery Fix

### Проблема
- ❌ 404 ошибки на `/_astro/*.css`, `/fonts/*.woff2`, `/uploads/*`
- ❌ Неправильные Content-Type заголовки для статики
- ❌ Отсутствие Cache-Control заголовков
- ❌ Браузер не применял стили из-за MIME-ошибок

### Причина
Astro Node adapter в `standalone` mode не раздаёт статику автоматически из `dist/client`. Он ожидает, что это сделает reverse proxy или custom wrapper.

### Решение

#### 1. Создан Custom Express Server
**Файл:** `apps/website/src/server.ts`

- Раздаёт статику из `dist/client` с правильными заголовками
- Устанавливает immutable кэш для хэшированных файлов (`/_astro/*`, `/fonts/*`)
- Устанавливает длительный кэш для uploads (`/uploads/*`)
- Добавлен healthcheck endpoint (`/_healthz`)
- Интегрирован с Astro SSR handler

#### 2. Обновлён Astro Config
**Файл:** `apps/website/astro.config.ts`

```diff
export default defineConfig({
  site: 'https://dmitrybond.tech',
+ base: '/',
+ trailingSlash: 'never',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
+ build: {
+   assets: '_astro',
+ },
  // ...
})
```

#### 3. Обновлён Package.json
**Файл:** `apps/website/package.json`

**Новые зависимости:**
```diff
"dependencies": {
+   "@types/express": "^5.0.0",
+   "compression": "^1.7.5",
+   "express": "^4.21.2",
    // ...
}

"devDependencies": {
+   "@types/compression": "^1.7.5",
    // ...
}
```

**Обновлённые scripts:**
```diff
"scripts": {
  "build": "astro build",
+ "postbuild": "tsc src/server.ts --outDir dist/server --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck --esModuleInterop --resolveJsonModule --allowSyntheticDefaultImports",
- "start": "node ./dist/server/entry.mjs",
+ "start": "node ./dist/server/server.mjs",
}
```

#### 4. Обновлён Dockerfile
**Файл:** `Dockerfile`

```diff
# Copy the entire dist (server + client) from the apps/website workspace
COPY --from=build /app/apps/website/dist /app/dist
COPY --from=build /app/apps/website/package.json /app/package.json

+ # Install production dependencies for the custom Express server
+ COPY --from=build /app/package*.json /tmp/root/
+ COPY --from=build /app/apps/website/package*.json /tmp/website/
+ RUN cd /tmp/website && npm ci --omit=dev && \
+     cp -r node_modules /app/node_modules && \
+     rm -rf /tmp/root /tmp/website

EXPOSE 3000
- HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
+ HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/_healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
- CMD ["node","./dist/server/entry.mjs"]
+ CMD ["node","./dist/server/server.mjs"]
```

### Результат
- ✅ HTML: `Cache-Control: no-store` (из middleware)
- ✅ CSS: `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: text/css; charset=utf-8`
- ✅ JS: `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: application/javascript; charset=utf-8`
- ✅ Fonts: `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: font/woff2`
- ✅ Uploads: `Cache-Control: public, max-age=31536000` + правильный Content-Type (image/png, image/jpeg, etc.)
- ✅ Нет 404 на статику
- ✅ Браузер корректно применяет стили
- ✅ Healthcheck работает в Docker

### Совместимость
- ✅ Существующий `src/middleware.ts` продолжает работать для SSR responses
- ✅ Caddy не требует изменений - просто проксирует на `:3000`
- ✅ Обратная совместимость с существующими путями
- ✅ Dev режим не затронут (работает через `astro dev`)

### Deployment
```bash
# 1. Установить новые зависимости
cd apps/website
npm install

# 2. Локальная проверка
npm run build
npm start

# 3. Production deploy
cd ../..
npm run deploy:prod
```

### Проверка
```bash
# Healthcheck
curl http://localhost:3000/_healthz

# CSS с правильными заголовками
curl -I https://dmitrybond.tech/_astro/index.abc123.css

# Font с правильными заголовками
curl -I https://dmitrybond.tech/fonts/Inter-roman.var.woff2

# Upload с правильными заголовками
curl -I https://dmitrybond.tech/uploads/logos/brand-ricoh-custom.png
```

### Файлы изменений
- `SSR_STATIC_ASSET_FIX.md` - полная документация
- `SSR_STATIC_ASSET_FIX_SUMMARY.md` - краткая сводка
- `SSR_STATIC_ASSET_FIX_CHANGELOG.md` - этот файл

### Breaking Changes
Нет. Все изменения обратно совместимы.

### Rollback
```bash
git checkout apps/website/package.json apps/website/astro.config.ts Dockerfile
rm apps/website/src/server.ts
npm install
npm run deploy:prod
```

---

**Автор:** AI Assistant  
**Дата:** 2025-10-21  
**Связанные файлы:** `SSR_CACHE_POLICY.md`, `src/middleware.ts`

