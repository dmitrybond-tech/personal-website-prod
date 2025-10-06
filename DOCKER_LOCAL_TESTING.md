# Docker Local Testing Guide

## Quick Start

Build and run the website locally using Docker:

```bash
# Build the image with build args
docker buildx build --load \
  --build-arg PUBLIC_SITE_URL=http://localhost:3000 \
  --build-arg PUBLIC_ENV=development \
  --build-arg PUBLIC_CAL_USERNAME=your-username \
  --build-arg PUBLIC_CAL_EMBED_LINK=https://cal.com/your-username \
  --build-arg PUBLIC_CAL_EVENTS=true \
  --build-arg PUBLIC_DECAP_CMS_VERSION=3.8.4 \
  --build-arg GIT_SHA=local-build \
  -t website:test .

# Run the container
docker run --rm -p 3000:3000 website:test
```

## Health Check

Once running, test the container:

```bash
# Check if the server is responding
curl -I http://localhost:3000/

# Should return HTTP 200 or 3xx status
```

## Build Process

The Docker build:
1. Installs native module toolchain (Alpine packages)
2. Copies only `apps/website` package files
3. Installs dependencies with npm cache
4. Copies website source code
5. Runs pre-build scripts and builds the app
6. Creates minimal runtime image with Node SSR

## Troubleshooting

If the build fails:
- Ensure Docker BuildKit is enabled
- Check that all build args are provided
- Verify the `apps/website` directory exists
- Review build logs for specific error messages
