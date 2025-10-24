# CI Verification Fix Changelog

## Issue
The static asset verification was failing in CI because the `dist/client` directory didn't exist on the CI runner. This happened because:

1. **Docker Build vs CI Runner**: The Docker build process creates the `dist/client` directory inside the container, but it's not available on the CI runner filesystem
2. **Missing Build Step**: The verification was trying to run on the CI runner without first building the website
3. **Poor Error Messages**: The verification tool didn't provide clear guidance when the dist directory was missing

## Root Cause
The CI workflow was structured as:
1. Build Docker image (creates dist/client inside container)
2. Try to verify assets on CI runner (no dist/client available)

## Changes Made

### 1. Updated CI Workflow (`.github/workflows/ci-docker.yml`)

#### Added Build Step for Verification
```yaml
- name: Build website for verification
  run: |
    cd apps/website
    echo "Building website for asset verification..."
    npm run build
```

#### Added Build Output Debugging
```yaml
- name: Check build output
  run: |
    cd apps/website
    echo "Checking build output..."
    if [ -d "dist" ]; then
      echo "Dist directory contents:"
      ls -la dist/
      if [ -d "dist/client" ]; then
        echo "Client directory contents:"
        ls -la dist/client/
      else
        echo "No client directory found in dist/"
      fi
    else
      echo "No dist directory found at all"
    fi
```

#### Made Verification Conditional
```yaml
- name: Verify static assets
  run: |
    cd apps/website
    if [ -d "dist/client" ]; then
      echo "Running static asset verification..."
      node tools/verify-static.mjs --verbose
    else
      echo "❌ No dist/client directory found"
      echo "This indicates the build step failed or did not complete"
      echo "Please check the build logs above for errors"
      exit 1
    fi
  continue-on-error: false
```

### 2. Updated Production Verification Workflow (`.github/workflows/verify-prod.yml`)

#### Added Build Step
```yaml
- name: Build website for verification
  run: |
    cd apps/website
    echo "Building website for asset verification..."
    npm run build
```

### 3. Enhanced Verification Tool (`apps/website/tools/verify-static.mjs`)

#### Improved Error Messages
```javascript
// Check if dist directory exists
try {
  await stat(DIST_PATH);
} catch {
  this.errors.push(`Dist directory not found: ${DIST_PATH}`);
  this.log('This usually means the build step failed or did not complete.');
  this.log('Please check the build logs for errors.');
  this.log('Expected structure: dist/client/ with built assets');
  return this.report();
}
```

## New CI Workflow Structure

### Before (Failing)
1. Build Docker image (creates dist/client inside container)
2. Try to verify assets on CI runner ❌ (no dist/client available)

### After (Working)
1. Build Docker image (for deployment)
2. **Build website on CI runner** (creates dist/client for verification)
3. **Check build output** (debugging step)
4. **Verify assets conditionally** (only if dist/client exists)

## Benefits

1. **Proper Build Context**: Verification now runs on actual build output
2. **Better Debugging**: Clear output showing what's in the dist directory
3. **Conditional Verification**: Only runs if build succeeded
4. **Clear Error Messages**: Helpful guidance when things go wrong
5. **Dual Purpose**: Docker build for deployment + CI build for verification

## Files Modified

- `.github/workflows/ci-docker.yml` - Added build step and conditional verification
- `.github/workflows/verify-prod.yml` - Added build step for production verification
- `apps/website/tools/verify-static.mjs` - Enhanced error messages

## Testing

The CI should now:
1. ✅ Build the website on the CI runner
2. ✅ Show detailed build output for debugging
3. ✅ Run verification only if build succeeded
4. ✅ Provide clear error messages if build fails
5. ✅ Continue with Docker build for deployment

## Expected CI Output

```
Building website for asset verification...
[Build output...]

Checking build output...
Dist directory contents:
total 8
drwxr-xr-x 3 runner docker 4096 Oct 24 05:34 .
drwxr-xr-x 3 runner docker 4096 Oct 24 05:34 ..
drwxr-xr-x 2 runner docker 4096 Oct 24 05:34 client

Client directory contents:
[Asset files...]

Running static asset verification...
[Verification output...]
✅ All assets verified successfully!
```
