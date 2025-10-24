# Static Asset Verification Implementation

## Overview

Implemented comprehensive static asset verification system for Astro SSR build to ensure all assets are properly generated, copied, and accessible in production.

## Changes Made

### 1. Asset Verification Tools

#### `apps/website/tools/verify-static.mjs`
- **Purpose**: Build-time verification of static assets
- **Features**:
  - Parses HTML files to extract asset URLs from `<link>`, `<script>`, `<img>`, and CSS `@font-face` declarations
  - Verifies file existence in `dist/client/` directory
  - Optional HTTP server testing with correct MIME types
  - Public asset verification (ensures `public/` files are copied to `dist/client/`)
  - Comprehensive error reporting and statistics

#### `apps/website/tools/verify-prod.mjs`
- **Purpose**: Production asset verification
- **Features**:
  - Fetches key pages from production website
  - Extracts and verifies asset URLs via HTTP HEAD requests
  - Concurrent asset checking with configurable limits
  - Timeout handling and error reporting
  - Success rate calculation and detailed reporting

### 2. Package.json Scripts

Added verification commands to `apps/website/package.json`:

```json
{
  "verify:static": "node tools/verify-static.mjs",
  "verify:static:verbose": "node tools/verify-static.mjs --verbose",
  "verify:static:server": "node tools/verify-static.mjs --server --verbose",
  "verify:prod": "node tools/verify-prod.mjs",
  "verify:prod:verbose": "node tools/verify-prod.mjs --verbose",
  "verify:all": "npm run verify:static && npm run verify:prod"
}
```

### 3. GitHub Actions Integration

#### Updated `.github/workflows/ci-docker.yml`
- Added Node.js setup for verification
- Integrated static asset verification after build
- Added build artifact upload for failure inspection
- Maintains existing LFS pointer detection

#### New `.github/workflows/verify-prod.yml`
- Daily production asset verification (2 AM UTC)
- Manual trigger with configurable base URL
- Comprehensive reporting and artifact upload
- Configurable concurrency and timeout settings

### 4. Documentation Updates

#### Enhanced `apps/website/README.md`
- Added "Static Asset Verification" section
- Documented asset contract and verification commands
- Explained build process integration
- Added troubleshooting guide for common issues
- Documented export process for production deployment

## Asset Contract

The system enforces the following static asset contract:

1. **Public Assets**: All files in `public/` must be copied to `dist/client/` preserving relative paths
2. **Hashed Assets**: CSS/JS bundles are generated with content hashes under `dist/client/_astro/`
3. **Static Routes**: `/uploads/**`, `/fonts/**`, `/favicons/**` are served as static content
4. **No LFS Pointers**: Git LFS pointer files must not leak into public assets

## Verification Features

### Build-Time Verification (`verify-static.mjs`)
- HTML parsing for asset URL extraction
- File system existence checks
- Public asset copy verification
- Optional HTTP server testing
- MIME type validation
- Comprehensive error reporting

### Production Verification (`verify-prod.mjs`)
- Multi-page asset extraction
- Concurrent HTTP HEAD requests
- Configurable concurrency and timeout
- Success rate calculation
- Failed asset tracking
- Detailed reporting

## CI/CD Integration

### Build Pipeline
1. **Pre-build**: LFS pointer detection (existing)
2. **Build**: Astro build with asset generation
3. **Post-build**: Static asset verification
4. **Artifact Upload**: Build artifacts preserved for inspection

### Production Monitoring
- **Daily Verification**: Automated production asset checks
- **Manual Triggers**: On-demand verification with custom parameters
- **Reporting**: Detailed logs and artifact preservation

## Usage Examples

### Local Development
```bash
# Basic verification
npm run verify:static

# Verbose output
npm run verify:static:verbose

# With HTTP server testing
npm run verify:static:server

# Production verification
npm run verify:prod
```

### CI/CD
- Verification runs automatically on every build
- Production monitoring runs daily
- Failed builds include detailed asset reports
- Build artifacts are preserved for inspection

## Error Handling

### Common Issues
1. **Missing Assets**: Files not copied from `public/` to `dist/client/`
2. **LFS Pointers**: Git LFS pointer files in public assets
3. **404 Errors**: Incorrect server configuration
4. **MIME Type Issues**: Incorrect Content-Type headers

### Troubleshooting
- Check file system permissions
- Verify Git LFS configuration
- Validate server static file serving
- Review build output for errors

## Benefits

1. **Early Detection**: Catch asset issues during build
2. **Production Monitoring**: Continuous verification of live assets
3. **Automated CI/CD**: Integrated verification in build pipeline
4. **Comprehensive Reporting**: Detailed error tracking and statistics
5. **Flexible Configuration**: Customizable verification parameters

## Future Enhancements

- Performance monitoring for asset load times
- CDN integration verification
- Asset optimization recommendations
- Historical asset tracking and trends
