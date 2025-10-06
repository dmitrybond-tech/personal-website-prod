# Inline Resolver Fix - Changelog

## Проблема
- Иконки пропали после внедрения resolver'а через импорт
- Astro компоненты не могут импортировать TypeScript функции
- Нужно сохранить CDN кешированные иконки + автоматический маппинг

## Решение
Встроили resolver прямо в компоненты для избежания проблем с импортами.

## Изменения

### 1. LevelledSkill.astro
**Файл**: `src/features/about/devscard/ui/sections/LevelledSkill.astro`
**Строки**: 6, 11

```astro
<!-- БЫЛО -->
import { resolveSkillIcon } from '@/shared/iconify/resolveIcon';
const resolvedIcon = resolveSkillIcon(name, icon);

<!-- СТАЛО -->
// Inline icon resolver - uses CDN cached stock icons
const iconMapping: Record<string, string> = {
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

const normalize = (s: string) => String(s || '').toLowerCase()
  .replace(/[\s_+.-]/g, '')
  .replace(/[^a-z0-9]/g, '');

const resolvedIcon = icon || (name ? iconMapping[normalize(name)] || 'mdi:help-circle' : 'mdi:help-circle');
```

### 2. Tag.astro
**Файл**: `src/features/about/devscard/ui/Tag.astro`
**Строки**: 5, 10

```astro
<!-- БЫЛО -->
import { resolveSkillIcon } from '@/shared/iconify/resolveIcon';
const resolvedIcon = resolveSkillIcon(name, icon);

<!-- СТАЛО -->
// Inline icon resolver - uses CDN cached stock icons
const iconMapping: Record<string, string> = {
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

const normalize = (s: string) => String(s || '').toLowerCase()
  .replace(/[\s_+.-]/g, '')
  .replace(/[^a-z0-9]/g, '');

const resolvedIcon = icon || (name ? iconMapping[normalize(name)] || 'mdi:help-circle' : 'mdi:help-circle');
```

## Логика работы

### Приоритет иконок:
1. **Явная иконка** (`icon` prop) - если указана, используется как есть
2. **Автоматический маппинг** - если нет явной иконки, ищет по имени навыка
3. **Fallback** - если ничего не найдено, использует `mdi:help-circle`

### Примеры маппинга:
- `"Discovery"` → `"simple-icons:discovery"`
- `"Python"` → `"simple-icons:python"`
- `"Cloud / IaaS"` → `"simple-icons:amazonaws"`
- `"ML&AI"` → `"simple-icons:tensorflow"`

## Результат

### ✅ Что работает:
- **CDN кеширование**: Иконки загружаются с `https://api.iconify.design`
- **Автоматический маппинг**: Навыки без иконок получают стоковые иконки
- **Сохранение оригинальных**: Явно указанные иконки остаются неизменными
- **Нет проблем с импортами**: Все встроено в компоненты

### ✅ Преимущества:
- **Производительность**: CDN кеширование + inline resolver
- **Надежность**: Нет зависимостей от внешних импортов
- **Гибкость**: Легко добавлять новые маппинги
- **Совместимость**: Работает с существующими данными

## Тестирование

1. Открыть `http://localhost:4321/en/about`
2. Проверить, что иконки отображаются
3. Убедиться, что CDN загружается (DevTools → Network)
4. Проверить, что нет ошибок в консоли

## Файлы для обновления маппинга

При добавлении новых навыков обновляйте маппинг в двух местах:
1. `LevelledSkill.astro` - строки 12-24
2. `Tag.astro` - строки 11-23

Или используйте скрипт `npm run icons:resolve:stock` для генерации нового маппинга.
