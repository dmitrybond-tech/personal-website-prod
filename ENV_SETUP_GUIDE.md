# Environment Variables Setup Guide

This guide explains how to properly configure environment variables for both build-time and runtime scenarios.

## 🎯 Overview

The application uses two types of environment variables:

1. **Build-time variables (PUBLIC_*)** - Injected during Docker build and embedded in the frontend bundle
2. **Runtime variables** - Used by the server at runtime for API keys, secrets, etc.

## 📁 File Structure

```
├── env.prod                    # Production environment variables
├── env.build                   # Build-time variables (fallback)
├── compose.prod.yml            # Docker Compose with build-args
├── .github/workflows/ci-docker.yml  # GitHub Actions workflow
└── scripts/
    ├── deploy-local.ps1        # Local deployment script (Windows)
    └── deploy-local.sh         # Local deployment script (Linux/Mac)
```

## 🚀 Quick Start

### 1. Create Environment File

Create `env.prod` with your production variables:

```bash
# Copy the template
cp env.prod.example env.prod

# Edit with your values
nano env.prod
```

### 2. Set Required Variables

```bash
# Build-time variables (PUBLIC_*)
PUBLIC_CAL_USERNAME=dmitrybond
PUBLIC_CAL_EMBED_LINK=https://cal.com/dmitrybond
PUBLIC_CAL_EVENTS=intro-30m|Intro 30m,tech-90m|Tech 90m,mentoring-60m|Mentoring 60m
PUBLIC_SITE_URL=https://dmitrybond.tech
PUBLIC_ENV=production
PUBLIC_DECAP_CMS_VERSION=3.8.3

# Runtime variables
NODE_ENV=production
PORT=3000
AUTH_SECRET=your-32-plus-character-secret
# ... other runtime variables
```

### 3. Deploy Locally

**Windows:**
```powershell
.\scripts\deploy-local.ps1
```

**Linux/Mac:**
```bash
./scripts/deploy-local.sh
```

## 🔧 How It Works

### Build-time Variables (PUBLIC_*)

These variables are injected during Docker build and embedded in the frontend bundle:

```dockerfile
# Dockerfile
ARG PUBLIC_CAL_USERNAME=""
ARG PUBLIC_CAL_EMBED_LINK=""
# ... other PUBLIC_* args

ENV PUBLIC_CAL_USERNAME=$PUBLIC_CAL_USERNAME \
    PUBLIC_CAL_EMBED_LINK=$PUBLIC_CAL_EMBED_LINK
```

```yaml
# compose.prod.yml
build:
  args:
    PUBLIC_CAL_USERNAME: ${PUBLIC_CAL_USERNAME}
    PUBLIC_CAL_EMBED_LINK: ${PUBLIC_CAL_EMBED_LINK}
```

### Runtime Variables

These are loaded at container startup:

```yaml
# compose.prod.yml
env_file:
  - env.prod
environment:
  - NODE_ENV=production
  - PORT=3000
```

## 🐛 Debugging Environment Variables

### 1. Check Console Logs

The application includes debug logging for environment variables:

```javascript
// In browser console, you'll see:
[cal] Environment variables debug: {
  hasImportMeta: true,
  username: "dmitrybond",
  eventSlug: "intro-30m",
  // ... more debug info
}
```

### 2. Verify Build Args

Check Docker build logs for environment variable injection:

```bash
docker compose -f compose.prod.yml build --no-cache
```

Look for:
```
--build-arg PUBLIC_CAL_USERNAME=dmitrybond
--build-arg PUBLIC_CAL_EMBED_LINK=https://cal.com/dmitrybond
```

### 3. Check Container Environment

```bash
# Check environment variables in running container
docker exec -it <container-name> env | grep PUBLIC_
```

## 🔄 GitHub Actions Integration

### 1. Set Repository Variables

Go to GitHub repository → Settings → Secrets and variables → Actions → Variables tab:

- `PUBLIC_CAL_USERNAME` = `dmitrybond`
- `PUBLIC_CAL_EMBED_LINK` = `https://cal.com/dmitrybond`
- `PUBLIC_CAL_EVENTS` = `intro-30m|Intro 30m,tech-90m|Tech 90m,mentoring-60m|Mentoring 60m`
- `PUBLIC_SITE_URL` = `https://dmitrybond.tech`
- `PUBLIC_ENV` = `production`
- `PUBLIC_DECAP_CMS_VERSION` = `3.8.3`

### 2. Workflow Configuration

The GitHub Actions workflow automatically uses these variables:

```yaml
build-args: |
  PUBLIC_CAL_USERNAME=${{ vars.PUBLIC_CAL_USERNAME || env.PUBLIC_CAL_USERNAME || 'dmitrybond' }}
  PUBLIC_CAL_EMBED_LINK=${{ vars.PUBLIC_CAL_EMBED_LINK || env.PUBLIC_CAL_EMBED_LINK || 'https://cal.com/dmitrybond' }}
  # ... with fallback defaults
```

## 🚨 Common Issues

### Issue 1: Empty PUBLIC_* Variables

**Symptoms:**
- Cal.com embed shows "not configured" error
- Console shows empty environment variables

**Solution:**
1. Verify `env.prod` file exists and has correct values
2. Check Docker build logs for build-args
3. Ensure GitHub repository variables are set

### Issue 2: Runtime Variables Not Available

**Symptoms:**
- Server-side features don't work
- API calls fail

**Solution:**
1. Check `env_file` directive in compose.prod.yml
2. Verify `env.prod` file is loaded
3. Check container logs for environment variable loading

### Issue 3: Development vs Production

**Symptoms:**
- Different behavior between local and production

**Solution:**
1. Use separate environment files:
   - `env.local` for development
   - `env.prod` for production
2. Update compose files accordingly
3. Use different Docker Compose files for different environments

## 📋 Environment Variables Reference

### Build-time Variables (PUBLIC_*)

| Variable | Description | Example |
|----------|-------------|---------|
| `PUBLIC_CAL_USERNAME` | Cal.com username | `dmitrybond` |
| `PUBLIC_CAL_EMBED_LINK` | Cal.com profile URL | `https://cal.com/dmitrybond` |
| `PUBLIC_CAL_EVENTS` | Available events | `intro-30m\|Intro 30m,tech-90m\|Tech 90m` |
| `PUBLIC_SITE_URL` | Site URL | `https://dmitrybond.tech` |
| `PUBLIC_ENV` | Environment name | `production` |
| `PUBLIC_DECAP_CMS_VERSION` | CMS version | `3.8.3` |

### Runtime Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Server port | `3000` |
| `AUTH_SECRET` | Auth.js secret | `32-plus-character-secret` |
| `AUTHJS_GITHUB_CLIENT_ID` | GitHub OAuth client ID | `github-client-id` |
| `DECAP_GITHUB_CLIENT_ID` | Decap CMS OAuth client ID | `decap-client-id` |

## 🔍 Verification Checklist

- [ ] `env.prod` file exists with correct values
- [ ] All required PUBLIC_* variables are set
- [ ] GitHub repository variables are configured
- [ ] Docker build logs show build-args
- [ ] Browser console shows environment variable debug logs
- [ ] Cal.com embed loads with correct username
- [ ] No "not configured" errors in console

## 📞 Support

If you encounter issues:

1. Check the debug logs in browser console
2. Verify environment variable setup
3. Check Docker build and runtime logs
4. Ensure GitHub repository variables are set correctly

The debug logging will help identify exactly where the environment variable chain is breaking.
