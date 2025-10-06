# CDN Icons Fix - Changelog

## Проблема
- Конфликт между IconifyLoader и новой системой CDN иконок
- Ошибка 404 для bundle.generated.ts
- Порт 4321 занят предыдущим процессом
- Стили не применяются из-за ошибок JavaScript

## Исправления

### 1. BaseLayout.astro
**Файл**: `src/layouts/BaseLayout.astro`
**Строка**: 104
```html
<!-- БЫЛО -->
<script defer src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"></script>

<!-- СТАЛО -->
<script defer src="https://cdn.jsdelivr.net/npm/iconify-icon@3.0.1/dist/iconify-icon.min.js"></script>
```
**Причина**: Синхронизация версии с IconifyLoader для избежания конфликтов

### 2. AppShell.astro  
**Файл**: `src/app/layouts/AppShell.astro`
**Строки**: 6, 130
```astro
<!-- БЫЛО -->
import IconifyLoader from '@/components/IconifyLoader.astro';
...
<IconifyLoader />

<!-- СТАЛО -->
<!-- Удалены импорт и компонент -->
```
**Причина**: Убираем дублирование загрузки iconify-icon, используем только CDN из BaseLayout

### 3. resolveIcon.ts
**Файл**: `src/shared/iconify/resolveIcon.ts`
**Строка**: 2
```typescript
// БЫЛО
import mapping from './skill-icons.resolved.json';

// СТАЛО
const mapping: Record<string, string> = {
  "discovery": "simple-icons:discovery",
  "analytics": "simple-icons:googleanalytics",
  "itilv4": "simple-icons:itil",
  "pmbok": "simple-icons:projectmanagementinstitute",
  "agile": "simple-icons:agile",
  "togaf": "simple-icons:iso",
  "iso27001": "simple-icons:eslint",
  "cloudiaas": "simple-icons:amazonaws",
  "linux": "simple-icons:linux",
  "python": "simple-icons:python",
  "sql": "simple-icons:postgresql",
  "mlai": "simple-icons:tensorflow"
};
```
**Причина**: Избегаем проблем с импортом JSON в Astro компонентах

## Результат

### ✅ Что работает:
- **CDN кеширование**: Иконки загружаются с `https://api.iconify.design`
- **Автоматический маппинг**: Навыки → стоковые иконки
- **Приоритет**: `logos:*` → `simple-icons:*` → `devicon:*` → `mdi:*`
- **Нет локальных бандлов**: Только CDN, никаких bundle.generated.ts

### ✅ Преимущества:
- **Производительность**: CDN кеширование
- **Актуальность**: Всегда последние версии иконок  
- **Простота**: Не нужно генерировать локальные файлы
- **Надежность**: Нет зависимостей от локальных бандлов

## Команды для применения

```bash
# 1. Остановить процесс на порту 4321
netstat -ano | findstr :4321
taskkill /PID <PID> /F

# 2. Перезапустить dev сервер
cd apps/website
npm run dev
```

## Тестирование

1. Открыть `http://localhost:4321/en/about`
2. Проверить, что иконки загружаются с CDN
3. Убедиться, что нет ошибок 404 в консоли
4. Проверить, что стили применяются корректно

## Файлы для ручного редактирования

Если автоматические изменения не применились, отредактируйте вручную:

1. **BaseLayout.astro** - строка 104: обновить версию iconify-icon до 3.0.1
2. **AppShell.astro** - удалить импорт и использование IconifyLoader
3. **resolveIcon.ts** - заменить импорт JSON на встроенный объект
