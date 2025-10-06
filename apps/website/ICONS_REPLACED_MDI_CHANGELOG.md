# Icons Replaced with MDI - Changelog

## Проблема
Многие иконки из `simple-icons` и `twemoji` не загружались с CDN, хотя `mdi` работали стабильно.

## Решение
Заменили неработающие иконки на аналогичные из коллекции `mdi` (Material Design Icons).

## Изменения

### English version (about-expanded.md)
**Файл**: `src/content/aboutPage/en/about-expanded.md`

#### Skills section:
```yaml
# БЫЛО → СТАЛО
- name: Delivery
  icon: simple-icons:delivery → mdi:truck-delivery

- name: ITILv4
  icon: simple-icons:itil → mdi:book-open-variant

- name: PMBoK
  icon: simple-icons:projectmanagementinstitute → mdi:book-account

- name: Agile
  icon: simple-icons:agile → mdi:rocket-launch

- name: TOGAF
  icon: simple-icons:iso → mdi:certificate

- name: Cloud / IaaS
  icon: simple-icons:amazonaws → mdi:cloud

- name: Linux
  icon: simple-icons:linux → mdi:linux

- name: WebDev
  icon: simple-icons:webcomponents → mdi:web

- name: Python
  icon: simple-icons:python → mdi:language-python

- name: SQL
  icon: simple-icons:postgresql → mdi:database

- name: ML&AI
  icon: simple-icons:tensorflow → mdi:brain
```

#### Languages section:
```yaml
# БЫЛО → СТАЛО
- name: English — C1
  icon: twemoji:flag-united-kingdom → mdi:flag

- name: Russian — native
  icon: twemoji:flag-russia → mdi:flag

- name: Dutch — A1
  icon: twemoji:flag-netherlands → mdi:flag
```

### Russian version (about-expanded.md)
**Файл**: `src/content/aboutPage/ru/about-expanded.md`

Аналогичные изменения для русской версии.

## Результат

### ✅ Что работает:
- **Все иконки отображаются** - mdi загружается стабильно
- **CDN кеширование** - иконки загружаются с `https://api.iconify.design`
- **Семантически подходящие иконки** - выбраны аналогичные по смыслу
- **Единообразие** - все иконки из одной коллекции

### ✅ Сохранены работающие иконки:
- `simple-icons:discovery` ✅
- `simple-icons:googleanalytics` ✅
- `simple-icons:googlecloud` ✅
- `simple-icons:eslint` ✅
- `fa6-solid:*` ✅ (user, briefcase, star)

## Маппинг иконок

| Навык | Старая иконка | Новая иконка | Описание |
|-------|---------------|--------------|----------|
| Delivery | simple-icons:delivery | mdi:truck-delivery | Доставка |
| ITILv4 | simple-icons:itil | mdi:book-open-variant | Книга/документация |
| PMBoK | simple-icons:projectmanagementinstitute | mdi:book-account | Управление проектами |
| Agile | simple-icons:agile | mdi:rocket-launch | Быстрая разработка |
| TOGAF | simple-icons:iso | mdi:certificate | Сертификация |
| Cloud / IaaS | simple-icons:amazonaws | mdi:cloud | Облачные технологии |
| Linux | simple-icons:linux | mdi:linux | Linux |
| WebDev | simple-icons:webcomponents | mdi:web | Веб-разработка |
| Python | simple-icons:python | mdi:language-python | Python |
| SQL | simple-icons:postgresql | mdi:database | База данных |
| ML&AI | simple-icons:tensorflow | mdi:brain | ИИ/машинное обучение |
| Languages | twemoji:flag-* | mdi:flag | Языки |

## Проверка

1. Открыть `http://localhost:4321/en/about`
2. Проверить, что все иконки отображаются
3. Проверить DevTools → Network → загрузка с CDN
4. Убедиться, что нет ошибок в консоли

## Файлы изменены

- `src/content/aboutPage/en/about-expanded.md` - английская версия
- `src/content/aboutPage/ru/about-expanded.md` - русская версия

Все иконки теперь должны работать стабильно! 🚀
