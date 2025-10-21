# SSR Static Asset Fix - Краткая сводка

## Что сделано

Исправлена раздача статики из Astro SSR-сервера с правильными заголовками Cache-Control и Content-Type.

## Изменённые файлы

### ✅ Созданы
- **`apps/website/src/server.ts`** - Custom Express server entry point

### ✅ Изменены
- **`apps/website/astro.config.ts`** - добавлены `base: '/'`, `trailingSlash: 'never'`, `build.assets`
- **`apps/website/package.json`** - добавлены express/compression, изменён start script, добавлен postbuild
- **`apps/website/Dockerfile`** - изменён CMD, добавлен healthcheck для `/_healthz`

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

### 4. Dockerfile (`apps/website/Dockerfile`)
```dockerfile
# node_modules уже копируются из builder stage (строка 85)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/_healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
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
git checkout apps/website/package.json apps/website/astro.config.ts apps/website/Dockerfile
rm apps/website/src/server.ts
cd apps/website && npm install && cd ../..
git push origin main  # или ваш deployment workflow
```

## Детали

См. полную документацию в `SSR_STATIC_ASSET_FIX.md`

