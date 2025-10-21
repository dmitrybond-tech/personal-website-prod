# SSR Static Asset Fix - Краткая сводка

## Что сделано

Исправлена раздача статики из Astro SSR-сервера с правильными заголовками Cache-Control и Content-Type.

## Изменённые файлы

### ✅ Созданы
- **`apps/website/src/server.ts`** - Custom Express server entry point

### ✅ Изменены
- **`apps/website/astro.config.ts`** - добавлены `base: '/'`, `trailingSlash: 'never'`, `build.assets`
- **`apps/website/package.json`** - добавлены express/compression, изменён start script, добавлен postbuild
- **`Dockerfile`** - изменён CMD, добавлена установка production dependencies

### ✅ Документация
- **`SSR_STATIC_ASSET_FIX.md`** - полное описание изменений и проверки

## Ключевые изменения

### 1. Custom Server (`apps/website/src/server.ts`)
```typescript
// Раздача статики с правильными заголовками:
app.use('/_astro', express.static(...))    // immutable, 1 год
app.use('/fonts', express.static(...))     // immutable, 1 год
app.use('/uploads', express.static(...))   // 1 год без immutable
app.use(astroHandler)                       // SSR для остального
```

### 2. Astro Config
```typescript
export default defineConfig({
  base: '/',
  trailingSlash: 'never',
  build: { assets: '_astro' }
})
```

### 3. Package.json
```json
{
  "dependencies": {
    "express": "^4.21.2",
    "compression": "^1.7.5",
    "@types/express": "^5.0.0"
  },
  "scripts": {
    "postbuild": "tsc src/server.ts --outDir dist/server ...",
    "start": "node ./dist/server/server.mjs"
  }
}
```

### 4. Dockerfile
```dockerfile
# Install production dependencies
RUN cd /tmp/website && npm ci --omit=dev && \
    cp -r node_modules /app/node_modules

CMD ["node","./dist/server/server.mjs"]
```

## Следующие шаги

1. **Установить зависимости:**
   ```bash
   cd apps/website
   npm install
   ```

2. **Локальная проверка:**
   ```bash
   npm run build
   npm start
   curl http://localhost:3000/_healthz
   ```

3. **Docker сборка:**
   ```bash
   docker build -t website-test .
   docker run -p 3000:3000 -e NODE_ENV=production website-test
   ```

4. **Production деплой:**
   ```bash
   npm run deploy:prod
   ```

5. **Проверка в production:**
   ```bash
   # Используй команды из SSR_STATIC_ASSET_FIX.md
   curl -sI https://dmitrybond.tech/fonts/Inter-roman.var.woff2
   ```

## Ожидаемые результаты

✅ HTML: `Cache-Control: no-store, max-age=0, must-revalidate`  
✅ CSS: `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: text/css`  
✅ Fonts: `Cache-Control: public, max-age=31536000, immutable` + `Content-Type: font/woff2`  
✅ Uploads: `Cache-Control: public, max-age=31536000` + правильный Content-Type  
✅ Нет 404 на статику  
✅ Браузер применяет стили  

## Быстрый rollback

```bash
git checkout apps/website/package.json apps/website/astro.config.ts Dockerfile
rm apps/website/src/server.ts
npm install
npm run deploy:prod
```

## Детали

См. полную документацию в `SSR_STATIC_ASSET_FIX.md`

