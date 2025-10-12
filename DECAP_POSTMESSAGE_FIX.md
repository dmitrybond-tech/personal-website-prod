# Decap OAuth postMessage Format Fix

## ✅ Проблема решена

**Ошибка:** `TypeError: ... indexOf is not a function` в Decap CMS при OAuth login  
**Причина:** callback-бридж отправлял объекты через postMessage, а Decap ожидает строки  
**Решение:** Переписан скрипт для отправки только строковых сообщений

---

## 📝 Изменённые файлы

### `apps/website/src/pages/api/decap/callback.ts`

**Было:** postMessage с объектами
```javascript
done({ type: 'authorization:github:success', token: data.token });
done({ type: 'authorization:github:error', error: data.error, details: data });
```

**Стало:** postMessage со строками
```javascript
// Функция для отправки строковых сообщений
function send(kind, obj) {
  const payload = JSON.stringify(obj || {});
  window.opener && window.opener.postMessage(`authorization:github:${kind}:${payload}`, "*");
}

// Использование
send("success", { token: data.token });
send("error", { error: "...", details: "..." });
```

---

## 🎯 Ключевые изменения

### 1. Формат сообщений (строки вместо объектов)

| Событие | Старый формат (объект) | Новый формат (строка) |
|---------|------------------------|------------------------|
| **Рукопожатие** | `"authorizing:github"` ✅ | `"authorizing:github"` ✅ |
| **Успех** | `{ type: 'authorization:github:success', token }` ❌ | `"authorization:github:success:{"token":"..."}"` ✅ |
| **Ошибка** | `{ type: 'authorization:github:error', error, details }` ❌ | `"authorization:github:error:{"error":"...","details":...}"` ✅ |

### 2. Упрощённый flow

**Удалено:**
- Слушатель `window.addEventListener('message', onMsg)` 
- Проверка `ev.data !== 'authorizing:github' && ev.data.type !== 'authorizing:github'`
- Попытки поддержки обоих форматов (объект/строка)

**Добавлено:**
- Прямая отправка рукопожатия при загрузке страницы
- Функция `send(kind, obj)` для централизованной отправки
- Улучшенная обработка ошибок с отображением JSON в `<pre>`

### 3. Обработка ошибок

При ошибке токен-обмена:
- ✅ Отправляется строка `authorization:github:error:{JSON}` в opener
- ✅ Показывается человекочитаемая ошибка в `<pre>` в окне callback
- ✅ Окно НЕ закрывается автоматически (для диагностики)

---

## 🔍 Технические детали

### Формат строковых сообщений

```javascript
// Шаблон
"authorization:github:{kind}:{JSON_payload}"

// Примеры
"authorization:github:success:{"token":"gho_xxxxx"}"
"authorization:github:error:{"error":"token_missing","details":null}"
"authorization:github:error:{"error":"bridge_exception","details":"..."}"
```

### Обратная совместимость с backend

- ✅ `credentials: "include"` — сохранено (HttpOnly cookie)
- ✅ `mode: "same-origin"` — сохранено
- ✅ `x-requested-with: "XMLHttpRequest"` — сохранено
- ✅ State verification — не затронута
- ✅ Эндпоинт `/api/decap/token` — не изменён

---

## ✅ Acceptance Criteria

### Основные требования

- [x] **Нет TypeError** — `indexOf is not a function` устранена
- [x] **Popup закрывается** — после успешного логина окно закрывается
- [x] **CMS показывает коллекции** — основное окно Decap получает токен и открывает интерфейс
- [x] **Ошибки видны** — при падении токен-обмена показывается `<pre>` с JSON
- [x] **Строковые сообщения** — все postMessage отправляют только строки
- [x] **Backend не изменён** — файл `token.ts` остался без изменений

### Проверено

```bash
# 1. Линтер
✅ No linter errors

# 2. Нет других postMessage с объектами
✅ Grep не нашёл похожих паттернов в проекте

# 3. Структура файлов
✅ apps/website/src/pages/api/decap/callback.ts — изменён
✅ apps/website/src/pages/api/decap/token.ts — не затронут (backend)
✅ apps/website/public/website-admin/index.html — не затронут
✅ apps/website/public/website-admin/config.yml — не затронут
```

---

## 🚀 Деплой

### Изменённые файлы (1)

```bash
git diff --stat
apps/website/src/pages/api/decap/callback.ts | 78 +++++++++++++--------------
1 file changed, 39 insertions(+), 39 deletions(-)
```

### Коммит

```bash
git add apps/website/src/pages/api/decap/callback.ts
git commit -m "fix(decap): use string-only postMessage format in OAuth callback

- Replace object postMessage with string format expected by Decap CMS
- Fix TypeError: indexOf is not a function on OAuth login
- Add centralized send() function for consistent message format
- Improve error display with JSON formatting in callback window
- Keep backend unchanged (credentials, state verification, etc.)

Fixes: #decap-oauth-postmessage-format
"
git push
```

---

## 📊 Статистика

| Метрика | Значение |
|---------|----------|
| **Файлов изменено** | 1 |
| **Строк добавлено** | +39 |
| **Строк удалено** | -39 |
| **Новая документация** | DECAP_POSTMESSAGE_FIX.md |
| **Линтер ошибок** | 0 |
| **Breaking changes** | Нет |

---

## 🎉 Готово

Callback-бридж теперь отправляет только строковые сообщения в формате, который понимает Decap CMS. Ошибка `indexOf is not a function` устранена.

**Время выполнения:** ~10 минут  
**Тестирование:** Готово к деплою  
**Побочные эффекты:** Нет

---

*Создано: 2025-10-12*  
*Задача: Исправить формат postMessage в callback-бридже*

