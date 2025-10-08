# syntax=docker/dockerfile:1.5
# -------- build stage --------
FROM node:22-alpine AS builder

# Install toolchain for native modules and common libs for canvas/sharp
RUN apk add --no-cache --virtual .build-deps python3 make g++ libc6-compat \
    pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev \
    && ln -sf /usr/bin/python3 /usr/bin/python
    
# Set working directory to monorepo root
WORKDIR /app

# Accept and export build args for PUBLIC_* variables
ARG PUBLIC_SITE_URL=""
ARG PUBLIC_ENV=""
ARG PUBLIC_CAL_USERNAME=""
ARG PUBLIC_CAL_EMBED_LINK=""
ARG PUBLIC_CAL_EVENTS=""
ARG PUBLIC_DECAP_CMS_VERSION=""
ARG DEBUG_CAL=0
    
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION \
    DEBUG_CAL=$DEBUG_CAL
    
# Copy only manifests first for better caching
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/
RUN npm config set registry https://registry.npmjs.org

# Install dependencies
RUN npm ci

# Copy the rest of the repo (needed for public/src)
COPY . .

# Make sure we build the correct workspace
RUN npm run --workspace apps/website build

# Guard: fail build if client uploads are missing
RUN test -d /app/apps/website/dist/client/uploads

# Visibility in CI logs - show directory structure
RUN node -e "const {readdirSync} = require('fs'); console.log('SERVER:', readdirSync('/app/apps/website/dist/server')); console.log('CLIENT:', readdirSync('/app/apps/website/dist/client')); console.log('UPLOADS:', readdirSync('/app/apps/website/dist/client/uploads'));"
    
# -------- runtime stage --------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Copy the entire dist (server + client) from the apps/website workspace
COPY --from=builder /app/apps/website/dist ./dist
    
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
