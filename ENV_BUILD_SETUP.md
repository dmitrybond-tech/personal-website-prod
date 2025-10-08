# .env.build Setup Instructions

## Создайте файл `.env.build` в корне репозитория

```bash
# .env.build
PUBLIC_SITE_URL=https://yourdomain.com
PUBLIC_ENV=production
PUBLIC_CAL_USERNAME=your-cal-username
PUBLIC_CAL_EMBED_LINK=your-cal-embed-link
PUBLIC_CAL_EVENTS=your-cal-events
PUBLIC_DECAP_CMS_VERSION=latest
```

## Или используйте GitHub Variables

Вместо файла `.env.build` можете настроить переменные в GitHub:

1. Перейдите в **Repository Settings** → **Secrets and variables** → **Actions**
2. Во вкладке **Variables** добавьте:
   - `PUBLIC_SITE_URL` = `https://yourdomain.com`
   - `PUBLIC_ENV` = `production`
   - `PUBLIC_CAL_USERNAME` = `your-cal-username`
   - `PUBLIC_CAL_EMBED_LINK` = `your-cal-embed-link`
   - `PUBLIC_CAL_EVENTS` = `your-cal-events`
   - `PUBLIC_DECAP_CMS_VERSION` = `latest`

## Приоритет переменных

GitHub Actions использует следующий приоритет:
1. GitHub Variables (`vars.VARIABLE_NAME`)
2. Environment variables (`env.VARIABLE_NAME`)

В workflow используется: `${{ vars.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL }}`
