# Decap OAuth postMessage Fix - Quick Reference

## 🎯 Что исправлено

**Файл:** `apps/website/src/pages/api/decap/callback.ts`

**Проблема:**  
```javascript
// ❌ Старый код (объекты)
done({ type: 'authorization:github:success', token: data.token });
```

**Решение:**  
```javascript
// ✅ Новый код (строки)
function send(kind, obj) {
  const payload = JSON.stringify(obj || {});
  window.opener && window.opener.postMessage(`authorization:github:${kind}:${payload}`, "*");
}
send("success", { token: data.token });
```

---

## 📋 Формат сообщений

| Событие | Формат строки |
|---------|---------------|
| Рукопожатие | `"authorizing:github"` |
| Успех | `"authorization:github:success:{"token":"gho_..."}"` |
| Ошибка | `"authorization:github:error:{"error":"...","details":...}"` |

---

## ✅ Acceptance

- [x] Нет `TypeError: ... indexOf is not a function`
- [x] Popup закрывается после логина
- [x] Decap показывает коллекции
- [x] Ошибки отображаются в `<pre>`
- [x] Backend не изменён

---

## 🚀 Deploy

```bash
git add apps/website/src/pages/api/decap/callback.ts DECAP_POSTMESSAGE_FIX.md DECAP_POSTMESSAGE_QUICKREF.md
git commit -m "fix(decap): use string-only postMessage format in OAuth callback"
git push
```

---

*Файлов изменено: 1 (callback.ts)*  
*Breaking changes: Нет*  
*Готово к деплою: ✅*

