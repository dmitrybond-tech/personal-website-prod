# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Install toolchain for native modules (sharp, etc.)
RUN apk add --no-cache python3 make g++ libc6-compat \
    && ln -sf /usr/bin/python3 /usr/bin/python

ENV NODE_ENV=production

# Accept and export build args for PUBLIC_* variables
ARG PUBLIC_SITE_URL=""
ARG PUBLIC_ENV=""
ARG PUBLIC_CAL_USERNAME=""
ARG PUBLIC_CAL_EMBED_LINK=""
ARG PUBLIC_CAL_EVENTS=""
ARG PUBLIC_DECAP_CMS_VERSION=""
ARG DEBUG_CAL=0

# OAuth Environment Variables for Production
ARG DECAP_GITHUB_CLIENT_ID=""
ARG DECAP_GITHUB_CLIENT_SECRET=""

# AuthJS Environment Variables for Production
ARG AUTHJS_GITHUB_CLIENT_ID=""
ARG AUTHJS_GITHUB_CLIENT_SECRET=""
    
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_ENV=$PUBLIC_ENV \
    PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK \
    PUBLIC_CAL_EVENTS=$PUBLIC_CAL_EVENTS \
    PUBLIC_DECAP_CMS_VERSION=$PUBLIC_DECAP_CMS_VERSION \
    DEBUG_CAL=$DEBUG_CAL \
    DECAP_GITHUB_CLIENT_ID=$DECAP_GITHUB_CLIENT_ID \
    DECAP_GITHUB_CLIENT_SECRET=$DECAP_GITHUB_CLIENT_SECRET \
    AUTHJS_GITHUB_CLIENT_ID=$AUTHJS_GITHUB_CLIENT_ID \
    AUTHJS_GITHUB_CLIENT_SECRET=$AUTHJS_GITHUB_CLIENT_SECRET

# Copy only manifests first for better caching
COPY package*.json ./
COPY apps/website/package*.json ./apps/website/

# Support npm/pnpm/yarn: use the lockfile that exists
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    else npm ci; fi

# Copy the rest of the repo (needed for public/src)
COPY . .

# Make sure we build the correct workspace
RUN npm run --workspace apps/website build

# Guard: fail build if client uploads are missing
RUN test -d /app/apps/website/dist/client/uploads

# Visibility in CI logs - show directory structure
RUN node -e "const {readdirSync} = require('fs'); console.log('SERVER:', readdirSync('/app/apps/website/dist/server')); console.log('CLIENT:', readdirSync('/app/apps/website/dist/client')); console.log('UPLOADS:', readdirSync('/app/apps/website/dist/client/uploads'));"

# ---- run ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Labels and ENV for git revision tracking
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
ENV APP_BUILD_SHA=$GIT_SHA

# OAuth Environment Variables for Runtime
ARG DECAP_GITHUB_CLIENT_ID=""
ARG DECAP_GITHUB_CLIENT_SECRET=""
ARG AUTHJS_GITHUB_CLIENT_ID=""
ARG AUTHJS_GITHUB_CLIENT_SECRET=""
ENV DECAP_GITHUB_CLIENT_ID=$DECAP_GITHUB_CLIENT_ID \
    DECAP_GITHUB_CLIENT_SECRET=$DECAP_GITHUB_CLIENT_SECRET \
    AUTHJS_GITHUB_CLIENT_ID=$AUTHJS_GITHUB_CLIENT_ID \
    AUTHJS_GITHUB_CLIENT_SECRET=$AUTHJS_GITHUB_CLIENT_SECRET

# Copy the entire dist (server + client) from the apps/website workspace
COPY --from=build /app/apps/website/dist /app/dist
COPY --from=build /app/apps/website/package.json /app/package.json

# Install production dependencies for the custom Express server
# (express, compression required for server.mjs)
COPY --from=build /app/package*.json /tmp/root/
COPY --from=build /app/apps/website/package*.json /tmp/website/
RUN cd /tmp/website && npm ci --omit=dev && \
    cp -r node_modules /app/node_modules && \
    rm -rf /tmp/root /tmp/website

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/_healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","./dist/server/server.mjs"]