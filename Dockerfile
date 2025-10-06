# syntax=docker/dockerfile:1.5
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && apk add --no-cache libc6-compat

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

# Monorepo-friendly deps install
COPY package*.json ./
COPY apps/website/package*.json apps/website/
RUN npm config set registry https://registry.npmjs.org
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --legacy-peer-deps --verbose \
 || npm i --no-audit --no-fund --legacy-peer-deps --verbose

# Copy sources and build website only
COPY . .
WORKDIR /app/apps/website
RUN node scripts/cms-config-swap.mjs prod || true
RUN npm run build