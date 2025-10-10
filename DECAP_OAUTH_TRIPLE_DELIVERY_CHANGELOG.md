# Decap CMS OAuth Triple Delivery Implementation

## Цель
Гарантировать завершение входа в Decap CMS после GitHub OAuth, используя тройную доставку сообщения (postMessage → localStorage → BroadcastChannel) и систему ретраев на стороне админки.

## Изменённые файлы
1. `apps/website/src/pages/api/decap/oauth/callback.ts`
2. `apps/website/public/website-admin/override-login.client.js`

---

## Changelog

### apps/website/src/pages/api/decap/oauth/callback.ts

1. Добавлена тройная доставка OAuth токена через BroadcastChannel в дополнение к postMessage и localStorage
2. Добавлен console.log для дебага доставки токена во всех response-блоках (успех и ошибки)
3. BroadcastChannel добавлен во всех 12 точках доставки сообщений:
   - OAuth error handler
   - Missing code/state validation
   - Missing cookie validation
   - State cookie not found
   - Invalid state format
   - State signature mismatch
   - State value mismatch
   - Token exchange failed
   - Token data error
   - Missing access token
   - Success response
   - General catch block
4. Все response-блоки теперь используют единый паттерн доставки через три канала
5. Сохранены все существующие механизмы безопасности (state verification, cookie clearing)

### apps/website/public/website-admin/override-login.client.js

6. Добавлены константы MAX_RETRIES=10 и RETRY_INTERVAL=250 для управления ретраями
7. Реализована функция `isCMSAuthenticated()` для детекции успешного входа в CMS по исчезновению экрана логина
8. Реализована функция `deliverToCMS(payload)` с механизмом ретраев (10 попыток × 250мс)
9. Функция deliverToCMS логирует каждую попытку доставки и прекращает ретраи при успехе
10. Добавлен BroadcastChannel listener для приёма токена через третий канал доставки
11. Добавлен graceful fallback если BroadcastChannel не поддерживается браузером
12. Добавлен diagnostic listener для postMessage с логированием входящих сообщений
13. Функция `relayFromStorage()` теперь использует `deliverToCMS()` вместо прямого postMessage
14. Добавлено логирование при получении токена через storage event
15. Добавлено логирование при старте скрипта (`waiting for token...`)
16. Обновлён комментарий в заголовке файла с описанием механизма ретраев
17. Все три канала доставки теперь очищают localStorage после успешной доставки

---

## Технические детали

### Каналы доставки (в порядке приоритета)
1. **postMessage** (window.opener) - для popup-сценария
2. **localStorage** - для new-tab сценария и персистентности
3. **BroadcastChannel** - для same-origin межвкладочной коммуникации

### Механизм ретраев
- Максимум 10 попыток с интервалом 250 мс (всего 2.5 секунды)
- Прекращение при детекции успешного входа в CMS
- Логирование каждой попытки для диагностики

### Детектор успешного входа
Проверяет два условия:
- Исчезновение кнопки логина (`.LoginButton`, `.login-button`) и текста "Login with GitHub"
- Появление панели коллекций (`[data-testid="collection-group"]`)

### Безопасность
- Сохранены все существующие механизмы state verification
- Cookie clearing работает как прежде (SameSite=None; Secure)
- Проверка origin для postMessage
- Валидация формата payload перед доставкой

---

## Acceptance Criteria (выполнено)

✅ После GitHub-логина вкладка закрывается или остаётся открытой, но админка переходит в авторизованное состояние  
✅ В консоли админки видны логи:
   - `[override-login] waiting for token...`
   - `[override-login] received token via storage/broadcast`
   - `[override-login] postMessage attempt 1..N`
   - `[override-login] CMS acknowledged, login successful`

✅ В консоли callback-вкладки виден лог: `[decap-oauth] callback delivered via postMessage/localStorage/broadcast`  
✅ Даже если window.opener недоступен, вход завершается за счёт localStorage/BroadcastChannel

---

## Quick Checks

### 1. Проверка state-cookie в authorize endpoint
```powershell
curl.exe -I "https://dmitrybond.tech/api/decap/oauth/authorize?provider=github&site_id=dmitrybond.tech&scope=repo" | Select-String "Set-Cookie"
```
Ожидается: `Set-Cookie` с `SameSite=None; Secure`

### 2. Наблюдение в DevTools браузера
**Application → Local Storage:**
- Во вкладке callback ключ `decap_oauth_message` появится на доли секунды
- На админке сработает storage/broadcast слушатель

**Console:**
- Callback вкладка: `[decap-oauth] callback delivered via postMessage/localStorage/broadcast`
- Admin вкладка: логи ретраев и успешного подтверждения

---

## Не изменено

❌ Auth.js endpoints (`/api/auth/*`)  
❌ OAuth keys и secrets  
❌ CI/CD pipeline  
❌ Динамический конфиг Decap CMS  
❌ Routing и редиректы (кроме добавления BroadcastChannel)

---

## Совместимость

- **BroadcastChannel**: Поддерживается всеми современными браузерами (Chrome 54+, Firefox 38+, Safari 15.4+)
- **Fallback**: Если BroadcastChannel недоступен, работают postMessage и localStorage
- **Backward compatible**: Существующий popup-флоу не затронут

---

## Метрики успеха

1. **Надёжность**: Вход завершается успешно даже при потере одного канала доставки
2. **Диагностика**: Полное логирование позволяет отследить путь токена
3. **UX**: Пользователь не видит зависание на экране логина
4. **Производительность**: Ретраи завершаются за 2.5 секунды максимум

