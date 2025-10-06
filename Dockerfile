# syntax=docker/dockerfile:1.5
# -------- build stage --------
FROM node:20-alpine AS build

# Install toolchain for native modules and common libs for canvas/sharp
RUN apk add --no-cache --virtual .build-deps python3 make g++ libc6-compat \
    pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev \
    && ln -sf /usr/bin/python3 /usr/bin/python
    
# Work directly with the website sub-application
WORKDIR /app/apps/website
    
# Accept and export build args for PUBLIC_* variables
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
    
# Copy only website package files and install dependencies
COPY apps/website/package*.json ./
RUN npm config set registry https://registry.npmjs.org

# Install dependencies with cache mount and fallback
RUN --mount=type=cache,target=/root/.npm \
    (npm ci --no-audit --no-fund --legacy-peer-deps || npm i --no-audit --no-fund --legacy-peer-deps)

# Optional: Support for private npm registry via secret (commented for public builds)
# RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
#     --mount=type=cache,target=/root/.npm \
#     npm ci --no-audit --no-fund --legacy-peer-deps
    
# Copy website sources and build
COPY apps/website/ ./
RUN node scripts/cms-config-swap.mjs prod || true

# Diagnostic logging before build
RUN node -v && npm -v && pwd && ls -la

# Build the application
RUN npm run build
    
# -------- runtime stage (Node SSR) --------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
    
# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA
    
# Copy runtime artifacts from build stage
COPY --from=build /app/apps/website/package*.json ./ 
COPY --from=build /app/apps/website/node_modules ./node_modules
COPY --from=build /app/apps/website/dist ./dist
    
EXPOSE 3000
CMD ["node","dist/server/entry.mjs"]