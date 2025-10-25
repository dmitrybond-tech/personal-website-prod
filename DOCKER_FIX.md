# Docker Build Fix

## Issue
Docker build was failing with:
```
process "/bin/sh -c npm ci --no-audit --no-fund || npm install --no-audit --no-fund" did not complete successfully: exit code: 1
```

## Root Cause
The `Dockerfile.ssg` was trying to copy only the website app's package files, but the project uses a monorepo workspace setup that requires the root `package.json` and `package-lock.json` files.

## Fix Applied
Updated `Dockerfile.ssg` to:

1. **Copy root package files first:**
   ```dockerfile
   COPY package.json package-lock.json ./
   COPY apps/website/package.json ./apps/website/
   ```

2. **Copy source code to workspace structure:**
   ```dockerfile
   COPY apps/website/ ./apps/website/
   COPY scripts/ ./scripts/
   ```

3. **Use workspace build command:**
   ```dockerfile
   RUN npm run --workspace apps/website build
   ```

4. **Fix copy path for built files:**
   ```dockerfile
   COPY --from=builder /app/apps/website/dist /usr/share/caddy
   ```

## Result
- ✅ Docker build now has access to root package files
- ✅ Workspace structure is maintained
- ✅ Prebuild scripts can run (fetch-decap.mjs)
- ✅ Build uses correct workspace command
- ✅ Built files are copied from correct path

The Docker build should now complete successfully.
