# syntax=docker/dockerfile:1.5
# -------- build stage --------
FROM node:20-alpine AS build

# Ставим тулчейн для нативных модулей
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && apk add --no-cache libc6-compat
    
# Работаем прямо с сабприложением
WORKDIR /app/apps/website
    
# Публичные ARG/ENV, которые нужны на этапе билда
ARG PUBLIC_SITE_URL
ARG PUBLIC_ENV
ARG PUBLIC_CAL_USERNAME
ARG PUBLIC_CAL_EMBED_LINK
ARG PUBLIC_CAL_EVENTS
ARG PUBLIC_DECAP_CMS_VERSION
    
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION
    
# Установка зависимостей ТОЛЬКО сайта
COPY apps/website/package*.json ./
RUN npm config set registry https://registry.npmjs.org
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --legacy-peer-deps || npm i --no-audit --no-fund --legacy-peer-deps
    
# Копируем исходники сайта и билдим
COPY apps/website/ ./
RUN node scripts/cms-config-swap.mjs prod || true
RUN node -v && npm -v && pwd && ls -la
RUN npm run build
    
# -------- runtime stage (Node SSR) --------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Кладём только то, что нужно рантайму
COPY --from=build /app/apps/website/package*.json ./ 
COPY --from=build /app/apps/website/node_modules ./node_modules
COPY --from=build /app/apps/website/dist ./dist
    
EXPOSE 3000
CMD ["node","dist/server/entry.mjs"]